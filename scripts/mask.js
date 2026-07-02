#!/usr/bin/env node
// 3.2절 마스킹 제안 도구 — 기본 설계는 담당자가 target_buyer_display를 직접 입력하는 것이고,
// 이 스크립트는 "참고용 제안"만 만들어줄 뿐 최종 판단을 대신하지 않는다.
// API 키 없이도(정규식 + 업종 매핑표) 동작하며, LLM_API_KEY가 있으면 더 나은 초안을 시도한다.
//
// 사용법:
//   node scripts/mask.js                 # target_buyer_display가 비어있는 ko 기업만 제안 채움 (기존 값은 덮어쓰지 않음)
//   node scripts/mask.js --company csec-01

import { readAllCompanies, writeCompany } from './lib/content-store.js';
import { detectFormalPII, suggestGeneralization } from './lib/masking-rules.js';

const LLM_API_KEY = process.env.LLM_API_KEY;

// 기본 경로 — API 없이 정규식·매핑표만으로 참고용 제안을 만든다 (3.2절 1~2번).
export function suggestDisplayText(rawText) {
  if (!rawText || !rawText.trim()) {
    return { classification: 'C', display_text: '', rationale: '원문 없음', source: 'rule-based' };
  }
  const formalPii = detectFormalPII(rawText);
  const generalization = suggestGeneralization(rawText);
  return {
    classification: formalPii.length > 0 || generalization ? 'A' : 'C',
    display_text: generalization ?? '',
    rationale:
      formalPii.length > 0
        ? `이메일/전화번호 패턴 발견(${formalPii.map((h) => h.value).join(', ')}) — 반드시 사람이 확인 필요`
        : '정규식/매핑표 기반 참고 제안 — 최종 문구는 담당자가 직접 확정해야 함',
    source: 'rule-based',
  };
}

// 선택적 보강 — LLM_API_KEY가 있을 때만 사용 가능. 호출부는 항상 이 함수 호출 전에 키 존재를 확인한다.
async function classifyWithLLM(rawText) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: LLM_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 512,
    system: `당신은 B2B 바이어 매칭 웹사이트의 개인정보 마스킹 검수를 돕는 분류기입니다.
입력된 "희망 협력분야/바이어" 원문 텍스트를 아래 기준으로 분류하세요.

- A: 특정 기업명·기관명·담당자 성명이 구체적으로 명시된 경우
- B: 이미 업종/유형 수준으로 일반화되어 있어 실명이 아닌 경우
- C: 바이어를 특정하지 않고 희망 분야만 기재되었거나 공란인 경우

A로 분류한 경우, 실명을 제거하고 업종·유형 수준으로 일반화한 대체 문구도 함께 제안하세요.
반드시 아래 JSON 형식으로만 응답하세요 (설명 문장 없이):
{"classification": "A" | "B" | "C", "display_text": "...", "rationale": "..."}`,
    messages: [{ role: 'user', content: rawText }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  const parsed = JSON.parse(textBlock.text);
  return { ...parsed, source: 'llm' };
}

// 공용 진입점 — tag-admin-edit.js, sync.js에서 사용.
// LLM_API_KEY가 있으면 시도하고, 없거나 실패하면 규칙 기반 제안으로 조용히 폴백한다.
export async function classifyBuyerText(rawText) {
  const ruleBased = suggestDisplayText(rawText);

  if (!LLM_API_KEY) {
    return ruleBased;
  }

  try {
    const llmResult = await classifyWithLLM(rawText);
    // 정규식이 형식 고정 PII(이메일·전화번호)를 찾았다면 LLM 판단과 무관하게 항상 A로 강제.
    const formalPii = detectFormalPII(rawText);
    if (formalPii.length > 0 && llmResult.classification !== 'A') {
      llmResult.classification = 'A';
      llmResult.rationale = `${llmResult.rationale ?? ''} (정규식이 이메일/전화번호를 탐지하여 A로 강제 조정됨)`;
    }
    if (llmResult.classification === 'A' && !llmResult.display_text) {
      llmResult.display_text = suggestGeneralization(rawText) ?? '현지 파트너 (검수자 확인 필요)';
    }
    return llmResult;
  } catch (err) {
    console.warn(`[mask] LLM 호출 실패 — 규칙 기반 제안으로 대체합니다: ${err.message}`);
    return ruleBased;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const companyArgIndex = args.indexOf('--company');
  const onlyCompanyId = companyArgIndex >= 0 ? args[companyArgIndex + 1] : null;

  console.log(
    LLM_API_KEY
      ? '[mask] LLM_API_KEY 감지됨 — 가능한 경우 LLM 제안을 사용합니다.'
      : '[mask] LLM_API_KEY 없음 — 정규식/매핑표 기반 참고 제안만 생성합니다 (기본 동작).',
  );

  // 8장: 원문은 한국어 기준으로 먼저 확정하므로 마스킹 제안도 ko 소스에서 수행한다.
  const companies = await readAllCompanies('ko');
  let processed = 0;

  for (const { id, data } of companies) {
    if (onlyCompanyId && id !== onlyCompanyId) continue;
    if (!data.target_buyer_raw) continue;
    // 담당자가 이미 직접 입력한 값은 절대 덮어쓰지 않는다 — 수동 입력이 항상 우선한다.
    if (data.target_buyer_display) continue;

    console.log(`[mask] ${id} 제안 생성 중...`);
    const result = await classifyBuyerText(data.target_buyer_raw);

    data.target_buyer_display = result.display_text || '';
    // 자동화는 참고용 초안 생성까지만 담당한다 — review_status는 사람이 검수 후 직접 올린다 (1.3절).
    await writeCompany('ko', id, data);
    console.log(`  -> [${result.source}/${result.classification}] "${data.target_buyer_display}" (검수자 확인 필요)`);
    processed++;
  }

  console.log(`\n[mask] done. ${processed}건에 참고용 제안을 채웠습니다 — 반드시 검수자가 확인 후 승인하세요.`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

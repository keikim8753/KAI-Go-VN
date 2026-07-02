#!/usr/bin/env node
// 11.2절 validate.js — PR 생성 시 CI로 실행되는 2차 안전장치.
// 사람의 최종 확인(PR 프리뷰 검수)을 대체하지 않으며, 명백한 위반만 자동 차단한다.

import { readAllCompanies } from './lib/content-store.js';
import { detectFormalPII } from './lib/masking-rules.js';
import { LOCALES } from './lib/paths.js';

const LLM_API_KEY = process.env.LLM_API_KEY;

// target_buyer_raw, review_status 등은 원래도 공개 렌더링되지 않지만(5장 스키마, src/lib/companies.ts
// 의 toPublicCompany() 참조), 실수로 공개 필드에 값이 복사되는 사고를 잡기 위해 아래 "공개 필드"만 검사한다.
const PUBLIC_TEXT_FIELDS = ['name', 'tagline', 'solution_summary', 'target_buyer_display'];

// 선택적 보강 — LLM_API_KEY가 없으면 이 함수는 호출되지 않는다 (기본 검증은 정규식/정합성 검사만으로 완결됨).
async function llmCheckProperNounLeak(text) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: LLM_API_KEY });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 256,
    system:
      '아래 텍스트에 구체적인 회사명·기관명·사람 이름(고유명사)이 포함되어 있는지 판정하세요. ' +
      '업종/유형을 일반화한 표현(예: "현지 SI 파트너", "대기업 그룹")은 위반이 아닙니다. ' +
      'JSON으로만 응답: {"leaked": true|false, "found": ["..."]}',
    messages: [{ role: 'user', content: text }],
  });
  const textBlock = response.content.find((b) => b.type === 'text');
  try {
    return { ...JSON.parse(textBlock.text), parseError: false };
  } catch {
    return { leaked: false, parseError: true };
  }
}

async function validateCompany(locale, id, data) {
  const violations = [];

  // 1) 이메일/전화번호 형식 PII — 공개 필드에서 확정 탐지 (정규식, 항상 실행)
  for (const field of PUBLIC_TEXT_FIELDS) {
    const value = data[field];
    if (typeof value !== 'string') continue;
    const hits = detectFormalPII(value);
    if (hits.length > 0) {
      violations.push({
        severity: 'error',
        rule: 'formal-pii',
        field,
        detail: `${field}에 이메일/전화번호로 보이는 값이 포함됨: ${hits.map((h) => h.value).join(', ')}`,
      });
    }
  }

  // 2) is_published가 true이면 review_status는 반드시 approved여야 한다 (4장 ⑥단계 강제).
  if (data.is_published === true && data.review_status !== 'approved') {
    violations.push({
      severity: 'error',
      rule: 'publish-requires-approval',
      detail: `is_published=true인데 review_status가 '${data.review_status}'입니다. approved만 게시 가능합니다.`,
    });
  }

  // 3) target_buyer_raw 원문이 공개 필드에 그대로 복사되지 않았는지 확인 (복붙 사고 방지).
  if (data.target_buyer_raw && data.target_buyer_raw.trim().length > 3) {
    for (const field of PUBLIC_TEXT_FIELDS) {
      const value = data[field];
      if (typeof value === 'string' && value.includes(data.target_buyer_raw.trim())) {
        violations.push({
          severity: 'error',
          rule: 'raw-copied-to-public-field',
          field,
          detail: `target_buyer_raw 원문이 공개 필드 '${field}'에 그대로 포함되어 있습니다.`,
        });
      }
    }
  }

  // 4) 선택적 보강 — LLM_API_KEY가 설정된 경우에만 고유명사 재검증을 추가로 수행한다 (3.2·11.2절).
  // 키가 없으면 이 단계는 완전히 건너뛴다 — 기본 검증(1~3번)만으로도 병합 게이트는 완결된다.
  if (LLM_API_KEY && data.target_buyer_display) {
    const result = await llmCheckProperNounLeak(data.target_buyer_display);
    if (result.parseError) {
      violations.push({
        severity: 'warning',
        rule: 'llm-check-unparseable',
        detail: 'LLM 응답을 해석하지 못해 이번 실행에서는 고유명사 재검증을 건너뛰었습니다.',
      });
    } else if (result.leaked) {
      violations.push({
        severity: 'error',
        rule: 'llm-proper-noun-leak',
        field: 'target_buyer_display',
        detail: `LLM이 고유명사 노출 가능성을 발견함: ${(result.found ?? []).join(', ')}`,
      });
    }
  }

  return violations.map((v) => ({ locale, id, ...v }));
}

async function main() {
  console.log(
    LLM_API_KEY
      ? '[validate] LLM_API_KEY 감지됨 — 고유명사 재검증(선택적 보강)을 포함해 실행합니다.'
      : '[validate] LLM_API_KEY 없음 — 정규식/정합성 검사만 실행합니다 (기본 동작, 정상입니다).',
  );

  const allViolations = [];

  for (const locale of LOCALES) {
    const companies = await readAllCompanies(locale);
    for (const { id, data } of companies) {
      const violations = await validateCompany(locale, id, data);
      allViolations.push(...violations);
    }
  }

  const errors = allViolations.filter((v) => v.severity === 'error');
  const warnings = allViolations.filter((v) => v.severity === 'warning');

  for (const v of [...errors, ...warnings]) {
    const tag = v.severity === 'error' ? '✗ ERROR' : '⚠ WARN ';
    console.log(`${tag} [${v.locale}/${v.id}] (${v.rule}) ${v.detail}`);
  }

  console.log(`\n[validate] ${errors.length}건 오류, ${warnings.length}건 경고.`);

  if (errors.length > 0) {
    console.error(
      '\n검증 실패 — 위 오류를 해결해야 PR을 병합할 수 있습니다. ' +
        '(이 검증은 2차 안전장치이며 사람의 최종 확인을 대체하지 않습니다. 11.2절 참조)',
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

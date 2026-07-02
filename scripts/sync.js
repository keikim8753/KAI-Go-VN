#!/usr/bin/env node
// 4.1·4.2절 — 스프레드시트 경로 ①~④ (수집 → 표준화 → 마스킹 → 번역).
// 실행 전 부록 B 항목 1~4, 10-1(LLM_API_KEY)이 준비되어 있어야 한다.
//
// 사용법: node scripts/sync.js

import { getAuthorizedClients, buildHeaderIndex, fetchSheetRows } from './lib/sheets.js';
import { resolveSector } from './lib/sector-map.js';
import { translateText } from './lib/translate.js';
import { classifyBuyerText } from './mask.js';
import { listCompanyIds, readCompany, writeCompany } from './lib/content-store.js';

const MASTER_SHEET_ID = process.env.MASTER_SHEET_ID;
const SURVEY_SHEET_ID = process.env.SURVEY_SHEET_ID;

// 마스터 리스트 열 배치는 실제 시트 구조에 맞춰 조정 필요 (예상: A=기업명, B=산업분야, C=담당자).
const MASTER_LIST_RANGE = 'Sheet1!A2:C';
const SURVEY_RANGE = 'Sheet1!A1:AD'; // 헤더 포함 30개 문항 범위 (2.2절)

async function nextSerial(sectorCode) {
  const existingIds = await listCompanyIds('ko');
  const nums = existingIds
    .filter((id) => id.startsWith(`${sectorCode}-`))
    .map((id) => Number.parseInt(id.split('-')[1], 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return String(max + 1).padStart(2, '0');
}

async function resolveCompanyId(companyName, sectorCode) {
  // 이미 동기화된 적 있는 기업인지 이름으로 먼저 조회 (재실행 시 새 id를 중복 발급하지 않도록).
  const existingIds = await listCompanyIds('ko');
  for (const id of existingIds) {
    const data = await readCompany('ko', id);
    if (data.name === companyName) return id;
  }
  const serial = await nextSerial(sectorCode);
  return `${sectorCode}-${serial}`;
}

async function detectConflict(companyId, sheetLastModified) {
  let existing;
  try {
    existing = await readCompany('ko', companyId);
  } catch {
    return { conflict: false, existing: null };
  }
  // 4.3절: 관리자 페이지에서 시트 반영 시점 이후 더 최근에 수정된 경우 자동 덮어쓰기 대신 충돌로 표시.
  if (
    existing.source === 'admin_cms' &&
    existing.last_edited_at &&
    new Date(existing.last_edited_at) > new Date(sheetLastModified)
  ) {
    return { conflict: true, existing };
  }
  return { conflict: false, existing };
}

async function main() {
  if (!MASTER_SHEET_ID || !SURVEY_SHEET_ID) {
    throw new Error('MASTER_SHEET_ID / SURVEY_SHEET_ID 환경 변수가 필요합니다 (.env.example 참조).');
  }

  const { sheets } = await getAuthorizedClients();
  const sheetLastModified = new Date().toISOString(); // 간이 구현 — 실제로는 Drive API modifiedTime 사용 권장 (4.1절 ①)

  const masterRows = await fetchSheetRows(sheets, MASTER_SHEET_ID, MASTER_LIST_RANGE);
  const surveyRows = await fetchSheetRows(sheets, SURVEY_SHEET_ID, SURVEY_RANGE);
  const [surveyHeader, ...surveyBody] = surveyRows;
  const qIndex = buildHeaderIndex(surveyHeader);

  const conflicts = [];
  let created = 0;
  let updated = 0;

  for (const [companyName, sectorName] of masterRows) {
    if (!companyName) continue;
    const { slug: sectorSlug, code: sectorCode } = resolveSector(sectorName);

    const surveyRow = surveyBody.find((row) => row[qIndex.Q5] === companyName);
    if (!surveyRow) {
      console.warn(`[sync] 설문 응답을 찾지 못함: ${companyName} — 건너뜀`);
      continue;
    }

    const companyId = await resolveCompanyId(companyName, sectorCode);
    const { conflict, existing } = await detectConflict(companyId, sheetLastModified);

    if (conflict) {
      conflicts.push({ companyId, companyName });
      console.warn(
        `[sync] ⚠ 충돌 감지: ${companyId} (${companyName}) — 관리자 페이지에서 더 최근에 수정됨. 자동 덮어쓰기를 건너뜁니다.`,
      );
      continue;
    }

    const rawBuyerText = surveyRow[qIndex.Q29] ?? '';
    const maskResult = rawBuyerText
      ? await classifyBuyerText(rawBuyerText)
      : { display_text: '' };

    const koData = {
      company_id: companyId,
      name: companyName,
      logo_image: existing?.logo_image,
      sector: sectorSlug,
      tagline: (surveyRow[qIndex.Q24] ?? '').slice(0, 120),
      solution_summary: surveyRow[qIndex.Q25] ?? '',
      business_model: surveyRow[qIndex.Q30] ?? '',
      ict_stage: surveyRow[qIndex.Q26] ?? '',
      official_website: surveyRow[qIndex.Q6] ?? '',
      target_buyer_raw: rawBuyerText,
      target_buyer_display: maskResult.display_text,
      reference_pdf_links: existing?.reference_pdf_links ?? [],
      // 내용이 바뀌었으므로 검수 이전 상태로 되돌린다 — 자동화는 초안까지만 담당 (1.3절).
      review_status: 'draft',
      is_published: existing?.is_published ?? false,
      source: 'google_sheet',
      last_synced_at: new Date().toISOString(),
    };

    await writeCompany('ko', companyId, koData);

    // ④ 번역 초안 — en/vi. 기존 승인된 번역이 있으면 덮어쓰지 않고 유지, 신규/미번역만 채운다.
    for (const locale of ['en', 'vi']) {
      let existingTranslation = null;
      try {
        existingTranslation = await readCompany(locale, companyId);
      } catch {
        /* 신규 */
      }
      if (existingTranslation?.review_status === 'approved') continue;

      const translated = {
        ...koData,
        name: await translateText(koData.name, locale),
        tagline: await translateText(koData.tagline, locale),
        solution_summary: await translateText(koData.solution_summary, locale),
        target_buyer_display: await translateText(koData.target_buyer_display, locale),
      };
      delete translated.target_buyer_raw; // 번역본에는 원문 보관 불필요 — ko가 단일 출처
      await writeCompany(locale, companyId, translated);
    }

    if (existing) updated++;
    else created++;
  }

  console.log(`\n[sync] 완료 — 신규 ${created}건, 갱신 ${updated}건, 충돌 ${conflicts.length}건.`);
  if (conflicts.length > 0) {
    console.log('[sync] 충돌 목록 (PR 설명에 반영 필요):');
    for (const c of conflicts) console.log(`  - ${c.companyId} (${c.companyName})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

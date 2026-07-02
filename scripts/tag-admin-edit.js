#!/usr/bin/env node
// admin-review.yml 전용 — 관리자 페이지(Decap CMS) PR에서 변경된 기업 파일에
// source/last_edited_by/last_edited_at을 자동으로 채운다.
// target_buyer_display는 관리자가 CMS에서 직접 입력하는 것이 기본값이므로, 이미 값이 있으면
// 절대 덮어쓰지 않는다 — 비어 있는 경우에만 mask.js의 참고용 제안으로 채운다 (4.3절).
//
// 사용법 (GitHub Actions에서): node scripts/tag-admin-edit.js <changed-file-path...>
// 각 경로는 "content/ko/companies/{id}.json" 형태여야 한다.

import path from 'node:path';
import { readCompany, writeCompany } from './lib/content-store.js';
import { classifyBuyerText } from './mask.js';

function extractCompanyId(filePath) {
  const base = path.basename(filePath);
  if (!base.endsWith('.json')) return null;
  if (!filePath.replace(/\\/g, '/').includes('content/ko/companies/')) return null;
  return base.slice(0, -'.json'.length);
}

async function main() {
  const changedFiles = process.argv.slice(2);
  const actor = process.env.GITHUB_ACTOR ?? 'unknown';
  const now = new Date().toISOString();

  if (changedFiles.length === 0) {
    console.log('[tag-admin-edit] 변경된 파일이 전달되지 않았습니다. 아무 작업도 하지 않습니다.');
    return;
  }

  for (const file of changedFiles) {
    const companyId = extractCompanyId(file);
    if (!companyId) continue;

    const data = await readCompany('ko', companyId);
    data.source = 'admin_cms';
    data.last_edited_by = actor;
    data.last_edited_at = now;

    if (data.target_buyer_raw && data.target_buyer_raw.trim() && !data.target_buyer_display) {
      console.log(`[tag-admin-edit] ${companyId}: target_buyer_display가 비어 있음 — 참고용 제안 생성`);
      const result = await classifyBuyerText(data.target_buyer_raw);
      data.target_buyer_display = result.display_text || '';
    }

    await writeCompany('ko', companyId, data);
    console.log(`[tag-admin-edit] ${companyId} 태깅 완료 (source=admin_cms, last_edited_by=${actor})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

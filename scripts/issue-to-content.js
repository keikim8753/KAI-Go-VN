#!/usr/bin/env node
// 4.2·4.3절 — GitHub Issue Forms 제출을 파싱해 content/{lang}/companies/{id}.json과
// assets/docs/{id}/*.pdf 를 생성·수정한다. 이 스크립트는 파일만 만들고, 브랜치·PR 생성은
// company-intake.yml 워크플로우가 담당한다(관심사 분리).
//
// 환경 변수(company-intake.yml에서 주입): ISSUE_BODY, ISSUE_NUMBER, ISSUE_AUTHOR

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  parseIssueBody,
  parseEvents,
  parseKeyMetrics,
  parseSdgs,
  parsePdfAttachments,
  extractImageUrl,
} from './lib/issue-form.js';
import { extractSectorSlug, SECTOR_CODES } from './lib/sector-map.js';
import { listCompanyIds, tryReadCompany, writeCompany } from './lib/content-store.js';
import { ASSETS_DOCS_ROOT, LOCALES } from './lib/paths.js';

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB (4.3·9장)
const MAX_COMPANY_PDF_BYTES = 20 * 1024 * 1024; // 기업당 20MB 상한

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

async function nextSerial(sectorCode) {
  const existingIds = await listCompanyIds('vi');
  const nums = existingIds
    .filter((id) => id.startsWith(`${sectorCode}-`))
    .map((id) => Number.parseInt(id.split('-')[1], 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return String(max + 1).padStart(2, '0');
}

function buildLocaleContent(fields, locale, shared, existing) {
  const suffix = `_${locale}`;
  const required = [
    `tagline${suffix}`,
    `problem${suffix}`,
    `value_summary${suffix}`,
    `vietnam_fit${suffix}`,
    `target_buyer_display${suffix}`,
  ];
  const hasAllRequired = required.every((key) => fields[key] && fields[key].trim());
  if (!hasAllRequired) {
    return null; // 이 언어 콘텐츠가 아직 없음 — 기존 파일 유지, 신규면 생성하지 않음
  }

  return {
    ...shared,
    tagline: fields[`tagline${suffix}`],
    problem: fields[`problem${suffix}`],
    value_summary: fields[`value_summary${suffix}`],
    key_metrics: parseKeyMetrics(fields[`key_metrics${suffix}`]),
    vietnam_fit: fields[`vietnam_fit${suffix}`],
    target_buyer_display: fields[`target_buyer_display${suffix}`],
    pdf_documents: shared.pdf_documents,
    // 신규 제출은 항상 draft·비공개로 시작한다 — 입력자·승인자 분리 원칙(4.2·10장).
    // 제출자가 "공개 여부"에서 '예'를 선택했더라도 승인자가 review_status를 approved로
    // 올리면서 함께 is_published를 true로 바꿔야만 실제 게시된다.
    review_status: 'draft',
    is_published: existing?.is_published && existing.review_status === 'approved'
      ? existing.is_published
      : false,
    last_edited_by: shared.__submittedBy,
    last_edited_at: shared.__submittedAt,
  };
}

async function downloadPdf(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PDF 다운로드 실패 (${res.status}): ${url}`);
  const contentType = res.headers.get('content-type') ?? '';
  const buffer = Buffer.from(await res.arrayBuffer());
  if (!contentType.includes('pdf') && !url.toLowerCase().endsWith('.pdf')) {
    throw new Error(`PDF가 아닌 파일로 보입니다 (content-type: ${contentType}): ${url}`);
  }
  if (buffer.length > MAX_PDF_BYTES) {
    throw new Error(`파일 크기가 10MB를 초과합니다 (${(buffer.length / 1024 / 1024).toFixed(1)}MB): ${url}`);
  }
  return buffer;
}

async function main() {
  const body = process.env.ISSUE_BODY;
  const issueNumber = process.env.ISSUE_NUMBER ?? 'unknown';
  const author = process.env.ISSUE_AUTHOR ?? 'unknown';
  if (!body) {
    throw new Error('ISSUE_BODY 환경 변수가 없습니다.');
  }

  const fields = parseIssueBody(body);
  const sectorSlug = extractSectorSlug(fields.sector);
  const sectorCode = SECTOR_CODES[sectorSlug];

  let companyId = fields.company_id?.trim();
  const isNew = !companyId;
  if (isNew) {
    const serial = await nextSerial(sectorCode);
    companyId = `${sectorCode}-${serial}`;
  }

  console.log(`[issue-to-content] Issue #${issueNumber} -> company_id=${companyId} (${isNew ? '신규' : '수정'})`);

  // PDF 첨부 처리 (4.3절)
  const pdfEntries = parsePdfAttachments(fields.pdf_attachments);
  const pdfDocuments = [];
  let totalBytes = 0;
  for (const entry of pdfEntries) {
    const slug = slugify(entry.title) || 'document';
    const buffer = await downloadPdf(entry.url);
    totalBytes += buffer.length;
    if (totalBytes > MAX_COMPANY_PDF_BYTES) {
      throw new Error(
        `기업당 PDF 총 용량 20MB를 초과합니다. 파일을 압축하거나 일부만 등록해주세요. (${entry.title})`,
      );
    }
    const destDir = path.join(ASSETS_DOCS_ROOT, companyId);
    await fs.mkdir(destDir, { recursive: true });
    const destFile = path.join(destDir, `${slug}.pdf`);
    await fs.writeFile(destFile, buffer);
    pdfDocuments.push({
      title: entry.title,
      file: `assets/docs/${companyId}/${slug}.pdf`,
      lang: entry.lang && LOCALES.includes(entry.lang) ? entry.lang : 'vi',
      is_published: true,
    });
    console.log(`[issue-to-content] PDF 저장: ${destFile} (${(buffer.length / 1024).toFixed(0)}KB)`);
  }

  const existingVi = await tryReadCompany('vi', companyId);

  const shared = {
    company_id: companyId,
    name: fields.name,
    logo_image: extractImageUrl(fields.logo_image),
    sector: sectorSlug,
    events: parseEvents(fields.events),
    sdgs: parseSdgs(fields.sdgs),
    official_website: fields.official_website,
    pdf_documents: pdfEntries.length > 0 ? pdfDocuments : existingVi?.pdf_documents ?? [],
    __submittedBy: author,
    __submittedAt: new Date().toISOString(),
  };

  let anyWritten = false;
  for (const locale of LOCALES) {
    const existing = await tryReadCompany(locale, companyId);
    const content = buildLocaleContent(fields, locale, shared, existing);
    if (!content) {
      console.log(`[issue-to-content] ${locale}: 필수 필드 미입력 — 건너뜀 (기존 파일 유지)`);
      continue;
    }
    delete content.__submittedBy;
    delete content.__submittedAt;
    await writeCompany(locale, companyId, content);
    anyWritten = true;
    console.log(`[issue-to-content] ${locale}/${companyId}.json 작성 완료`);
  }

  if (!anyWritten) {
    throw new Error('어떤 언어의 필수 필드도 충족되지 않았습니다 — 최소 VI 콘텐츠는 필수입니다.');
  }

  console.log(`\n[issue-to-content] 완료. company_id=${companyId}`);
  // 후속 워크플로우 스텝이 PR 제목/브랜치명에 쓸 수 있도록 GITHUB_OUTPUT에 기록
  if (process.env.GITHUB_OUTPUT) {
    await fs.appendFile(process.env.GITHUB_OUTPUT, `company_id=${companyId}\nis_new=${isNew}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

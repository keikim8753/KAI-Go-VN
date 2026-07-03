#!/usr/bin/env node
// 9장 validate.js — 개인정보 정규식, 차단어(해시), is_published 정합성, PDF 크기·타입 검증.
// 3장: 이 검증은 2차 안전장치이며, 입력 전 검토 완료(1.3절 원칙)를 대체하지 않는다.

import fs from 'node:fs/promises';
import path from 'node:path';
import { readAllCompanies } from './lib/content-store.js';
import { findBlockedTokens } from './lib/blocklist.js';
import { ASSETS_DOCS_ROOT, REPO_ROOT, LOCALES } from './lib/paths.js';

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_PATTERN = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_COMPANY_PDF_BYTES = 20 * 1024 * 1024;
const MAX_REPO_PDF_BYTES = 700 * 1024 * 1024; // 12장 리스크 4번 — 저장소 전체 상한

const TEXT_FIELDS = ['name', 'tagline', 'problem', 'value_summary', 'vietnam_fit', 'target_buyer_display'];

function detectPii(text) {
  if (!text) return [];
  const hits = [];
  const emails = text.match(EMAIL_PATTERN);
  if (emails) hits.push(...emails.map((v) => ({ type: 'email', value: v })));
  const phones = text.match(PHONE_PATTERN);
  if (phones) hits.push(...phones.map((v) => ({ type: 'phone', value: v })));
  return hits;
}

function validateCompanyFields(locale, id, data) {
  const violations = [];

  for (const field of TEXT_FIELDS) {
    const value = data[field];
    if (typeof value !== 'string') continue;

    const piiHits = detectPii(value);
    if (piiHits.length > 0) {
      violations.push({
        severity: 'error',
        rule: 'formal-pii',
        field,
        detail: `${field}에 이메일/전화번호로 보이는 값이 포함됨: ${piiHits.map((h) => h.value).join(', ')}`,
      });
    }

    const blockedHits = findBlockedTokens(value);
    if (blockedHits.length > 0) {
      violations.push({
        severity: 'error',
        rule: 'blocked-word',
        field,
        detail: `${field}에 내부 차단어 목록에 등록된 표현이 포함됨: ${blockedHits.join(', ')}`,
      });
    }
  }

  for (const metric of data.key_metrics ?? []) {
    const blockedHits = findBlockedTokens(metric.label);
    if (blockedHits.length > 0) {
      violations.push({
        severity: 'error',
        rule: 'blocked-word',
        field: 'key_metrics',
        detail: `key_metrics 설명에 차단어 포함: ${blockedHits.join(', ')}`,
      });
    }
  }

  if (data.is_published === true && data.review_status !== 'approved') {
    violations.push({
      severity: 'error',
      rule: 'publish-requires-approval',
      detail: `is_published=true인데 review_status가 '${data.review_status}'입니다. approved만 게시 가능합니다.`,
    });
  }

  return violations.map((v) => ({ locale, id, ...v }));
}

async function validatePdfFiles() {
  const violations = [];
  let totalBytes = 0;

  let companyDirs = [];
  try {
    companyDirs = await fs.readdir(ASSETS_DOCS_ROOT);
  } catch {
    return violations; // assets/docs 아직 없음 — 정상
  }

  for (const companyId of companyDirs) {
    const dir = path.join(ASSETS_DOCS_ROOT, companyId);
    const stat = await fs.stat(dir);
    if (!stat.isDirectory()) continue;

    const files = await fs.readdir(dir);
    let companyBytes = 0;

    for (const file of files) {
      const filePath = path.join(dir, file);
      const buffer = await fs.readFile(filePath);
      companyBytes += buffer.length;
      totalBytes += buffer.length;

      if (!file.toLowerCase().endsWith('.pdf')) {
        violations.push({
          severity: 'error',
          rule: 'pdf-invalid-extension',
          detail: `${path.relative(REPO_ROOT, filePath)}는 .pdf 확장자가 아닙니다.`,
        });
        continue;
      }

      // PDF 매직 바이트(%PDF) 확인 — MIME 스푸핑 방지
      if (buffer.subarray(0, 4).toString('ascii') !== '%PDF') {
        violations.push({
          severity: 'error',
          rule: 'pdf-invalid-magic-bytes',
          detail: `${path.relative(REPO_ROOT, filePath)}가 유효한 PDF 파일이 아닙니다.`,
        });
      }

      if (buffer.length > MAX_PDF_BYTES) {
        violations.push({
          severity: 'error',
          rule: 'pdf-too-large',
          detail: `${path.relative(REPO_ROOT, filePath)}가 10MB를 초과합니다 (${(buffer.length / 1024 / 1024).toFixed(1)}MB).`,
        });
      }
    }

    if (companyBytes > MAX_COMPANY_PDF_BYTES) {
      violations.push({
        severity: 'error',
        rule: 'pdf-company-quota-exceeded',
        detail: `${companyId}의 PDF 총 용량이 20MB를 초과합니다 (${(companyBytes / 1024 / 1024).toFixed(1)}MB).`,
      });
    }
  }

  if (totalBytes > MAX_REPO_PDF_BYTES) {
    violations.push({
      severity: 'warning',
      rule: 'pdf-repo-quota-warning',
      detail: `저장소 전체 PDF 용량이 700MB에 근접/초과했습니다 (${(totalBytes / 1024 / 1024).toFixed(0)}MB). 12장 리스크 4번 참조 — 압축 또는 외부 스토리지 전환을 검토하세요.`,
    });
  }

  return violations;
}

async function main() {
  const allViolations = [];

  for (const locale of LOCALES) {
    const companies = await readAllCompanies(locale);
    for (const { id, data } of companies) {
      allViolations.push(...validateCompanyFields(locale, id, data));
    }
  }

  allViolations.push(...(await validatePdfFiles()));

  const errors = allViolations.filter((v) => v.severity === 'error');
  const warnings = allViolations.filter((v) => v.severity === 'warning');

  for (const v of [...errors, ...warnings]) {
    const tag = v.severity === 'error' ? '✗ ERROR' : '⚠ WARN ';
    const loc = v.locale ? `[${v.locale}/${v.id}] ` : '';
    console.log(`${tag} ${loc}(${v.rule}) ${v.detail}`);
  }

  console.log(`\n[validate] ${errors.length}건 오류, ${warnings.length}건 경고.`);

  if (errors.length > 0) {
    console.error(
      '\n검증 실패 — 위 오류를 해결해야 PR을 병합할 수 있습니다. ' +
        '(이 검증은 2차 안전장치이며, 입력 전 검토 완료 원칙을 대체하지 않습니다. 1.3·3장 참조)',
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

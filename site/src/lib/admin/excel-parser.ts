import * as XLSX from 'xlsx';
import { SECTORS, SECTOR_LABELS, type Sector } from '../sectors';
import { SECTOR_CODES } from '../sectorCodes';
import { KO_HEADERS, TRANSLATION_HEADERS, SHEET_NAMES } from './excel-schema';

export interface LocaleContent {
  tagline: string;
  problem: string;
  value_summary: string;
  key_metrics: { value: string; label: string }[];
  vietnam_fit: string;
  target_buyer_display: string;
}

export interface ParsedCompany {
  company_id: string;
  isNew: boolean;
  name: string;
  sector: Sector;
  events: { name: string; date: string }[];
  sdgs: number[];
  official_website: string;
  logo_image?: string;
  requestedPublish: boolean;
  locales: Partial<Record<'ko' | 'en' | 'vi', LocaleContent>>;
  rowRef: string; // 오류 메시지용 (예: "ko 시트 3행")
}

export interface ParseResult {
  companies: ParsedCompany[];
  errors: string[];
  existingIds: Set<string>;
}

function resolveSector(raw: string): Sector | null {
  const value = raw?.trim();
  if (!value) return null;
  if ((SECTORS as readonly string[]).includes(value)) return value as Sector;
  for (const sector of SECTORS) {
    if (SECTOR_LABELS[sector].ko === value) return sector;
  }
  return null;
}

function parseEvents(raw: string): { name: string; date: string }[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [name, date] = s.split('|').map((p) => p.trim());
      return { name, date: date ?? '' };
    });
}

function parseSdgs(raw: string): number[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 17);
}

function buildKeyMetrics(row: Record<string, string>, headers: typeof KO_HEADERS | typeof TRANSLATION_HEADERS) {
  const metrics: { value: string; label: string }[] = [];
  for (const [valueKey, labelKey] of [
    [headers.metric1Value, headers.metric1Label],
    [headers.metric2Value, headers.metric2Label],
    [headers.metric3Value, headers.metric3Label],
  ] as const) {
    const value = String(row[valueKey] ?? '').trim();
    const label = String(row[labelKey] ?? '').trim();
    if (value || label) metrics.push({ value, label });
  }
  return metrics;
}

function rowToLocaleContent(row: Record<string, string>, headers: typeof KO_HEADERS | typeof TRANSLATION_HEADERS): LocaleContent | null {
  const tagline = String(row[headers.tagline] ?? '').trim();
  const problem = String(row[headers.problem] ?? '').trim();
  const value_summary = String(row[headers.valueSummary] ?? '').trim();
  const vietnam_fit = String(row[headers.vietnamFit] ?? '').trim();
  const target_buyer_display = String(row[headers.targetBuyerDisplay] ?? '').trim();

  if (!tagline || !problem || !value_summary || !vietnam_fit || !target_buyer_display) {
    return null; // 필수 필드 중 하나라도 비어 있으면 이 언어는 아직 준비되지 않은 것으로 간주
  }

  return {
    tagline,
    problem,
    value_summary,
    key_metrics: buildKeyMetrics(row, headers),
    vietnam_fit,
    target_buyer_display,
  };
}

export function parseWorkbook(buffer: ArrayBuffer, existingCompanyNamesById: Map<string, string>): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const errors: string[] = [];
  const companies: ParsedCompany[] = [];

  const koSheet = workbook.Sheets[SHEET_NAMES.ko] ?? workbook.Sheets['KO'] ?? workbook.Sheets['한글'];
  if (!koSheet) {
    errors.push('필수 시트 "ko"를 찾을 수 없습니다. 워크북에 "ko"라는 이름의 시트가 있어야 합니다.');
    return { companies, errors, existingIds: new Set() };
  }

  const koRows: Record<string, string>[] = XLSX.utils.sheet_to_json(koSheet, { defval: '' });
  const enSheet = workbook.Sheets[SHEET_NAMES.en] ?? workbook.Sheets['EN'];
  const viSheet = workbook.Sheets[SHEET_NAMES.vi] ?? workbook.Sheets['VI'];
  const enRows: Record<string, string>[] = enSheet ? XLSX.utils.sheet_to_json(enSheet, { defval: '' }) : [];
  const viRows: Record<string, string>[] = viSheet ? XLSX.utils.sheet_to_json(viSheet, { defval: '' }) : [];

  // 번역 시트는 기업ID(있으면) 또는 기업명(신규)으로 조인한다.
  function findTranslationRow(rows: Record<string, string>[], companyId: string, name: string) {
    return rows.find((r) => {
      const rid = String(r[TRANSLATION_HEADERS.companyId] ?? '').trim();
      const rname = String(r[TRANSLATION_HEADERS.name] ?? '').trim();
      if (companyId && rid) return rid === companyId;
      return rname && rname === name;
    });
  }

  koRows.forEach((row, index) => {
    const rowRef = `ko 시트 ${index + 2}행`; // 헤더가 1행이므로 데이터는 2행부터
    const name = String(row[KO_HEADERS.name] ?? '').trim();
    if (!name) return; // 완전히 빈 행은 건너뜀

    const sector = resolveSector(String(row[KO_HEADERS.sector] ?? ''));
    if (!sector) {
      errors.push(`${rowRef}: "${row[KO_HEADERS.sector]}"는 알 수 없는 분야입니다.`);
      return;
    }

    const officialWebsite = String(row[KO_HEADERS.officialWebsite] ?? '').trim();
    if (!officialWebsite) {
      errors.push(`${rowRef}: 홈페이지 URL이 비어 있습니다.`);
      return;
    }

    const koContent = rowToLocaleContent(row, KO_HEADERS);
    if (!koContent) {
      errors.push(`${rowRef}: 한글 콘텐츠 필수 항목(한줄가치제안/문제/해결과가치/베트남적용/희망협력분야) 중 빈 값이 있습니다.`);
      return;
    }

    let companyId = String(row[KO_HEADERS.companyId] ?? '').trim();
    const isNew = !companyId;
    if (isNew) {
      const code = SECTOR_CODES[sector];
      const existingNums = [...existingCompanyNamesById.keys()]
        .filter((id) => id.startsWith(`${code}-`))
        .map((id) => Number.parseInt(id.split('-')[1], 10))
        .filter((n) => !Number.isNaN(n));
      const usedInThisBatch = companies
        .filter((c) => c.company_id.startsWith(`${code}-`))
        .map((c) => Number.parseInt(c.company_id.split('-')[1], 10));
      const max = Math.max(0, ...existingNums, ...usedInThisBatch);
      companyId = `${code}-${String(max + 1).padStart(2, '0')}`;
    }

    const locales: ParsedCompany['locales'] = { ko: koContent };
    const enRow = findTranslationRow(enRows, isNew ? '' : companyId, name);
    if (enRow) {
      const content = rowToLocaleContent(enRow, TRANSLATION_HEADERS);
      if (content) locales.en = content;
    }
    const viRow = findTranslationRow(viRows, isNew ? '' : companyId, name);
    if (viRow) {
      const content = rowToLocaleContent(viRow, TRANSLATION_HEADERS);
      if (content) locales.vi = content;
    }

    companies.push({
      company_id: companyId,
      isNew,
      name,
      sector,
      events: parseEvents(String(row[KO_HEADERS.events] ?? '')),
      sdgs: parseSdgs(String(row[KO_HEADERS.sdgs] ?? '')),
      official_website: officialWebsite,
      logo_image: String(row[KO_HEADERS.logoImage] ?? '').trim() || undefined,
      requestedPublish: /^y(es)?$/i.test(String(row[KO_HEADERS.isPublished] ?? '').trim()),
      locales,
      rowRef,
    });
  });

  return { companies, errors, existingIds: new Set(existingCompanyNamesById.keys()) };
}

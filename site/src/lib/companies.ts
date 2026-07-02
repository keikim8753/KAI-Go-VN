import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { Locale } from './i18n';

const COLLECTION_BY_LOCALE = {
  ko: 'companies-ko',
  en: 'companies-en',
  vi: 'companies-vi',
} as const satisfies Record<Locale, 'companies-ko' | 'companies-en' | 'companies-vi'>;

type AnyCompanyEntry =
  | CollectionEntry<'companies-ko'>
  | CollectionEntry<'companies-en'>
  | CollectionEntry<'companies-vi'>;

// 5장: target_buyer_raw·review_status 등 내부 전용 필드는 절대 렌더링하지 않는다.
// 이 함수가 공개 필드만 남기는 유일한 통로 — 페이지 컴포넌트는 항상 이 함수를 거친 값만 사용한다.
export function toPublicCompany(entry: AnyCompanyEntry) {
  const {
    target_buyer_raw: _targetBuyerRaw,
    review_status: _reviewStatus,
    source: _source,
    last_edited_by: _lastEditedBy,
    last_edited_at: _lastEditedAt,
    last_synced_at: _lastSyncedAt,
    ...publicData
  } = entry.data;
  return publicData;
}

export type PublicCompany = ReturnType<typeof toPublicCompany>;

async function getApprovedEntries(locale: Locale): Promise<AnyCompanyEntry[]> {
  const collectionName = COLLECTION_BY_LOCALE[locale];
  const entries = await getCollection(collectionName);
  // 4장 ⑥단계: 승인(approved)되고 공개(is_published) 상태인 기업만 빌드에 포함한다.
  return entries.filter(
    (entry) => entry.data.review_status === 'approved' && entry.data.is_published,
  );
}

export async function getPublicCompanies(locale: Locale): Promise<PublicCompany[]> {
  const entries = await getApprovedEntries(locale);
  return entries.map(toPublicCompany);
}

export async function getPublicCompaniesBySector(
  locale: Locale,
  sector: string,
): Promise<PublicCompany[]> {
  const companies = await getPublicCompanies(locale);
  return companies.filter((company) => company.sector === sector);
}

export async function getPublicCompany(
  locale: Locale,
  companyId: string,
): Promise<PublicCompany | undefined> {
  const collectionName = COLLECTION_BY_LOCALE[locale];
  const entry = await getEntry(collectionName, companyId);
  if (!entry || entry.data.review_status !== 'approved' || !entry.data.is_published) {
    return undefined;
  }
  return toPublicCompany(entry);
}

export async function getAllPublicCompanyIds(locale: Locale): Promise<string[]> {
  const entries = await getApprovedEntries(locale);
  return entries.map((entry) => entry.data.company_id);
}

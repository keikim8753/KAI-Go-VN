import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { Locale } from './i18n';

const COLLECTION_BY_LOCALE = {
  vi: 'companies-vi',
  en: 'companies-en',
  ko: 'companies-ko',
} as const satisfies Record<Locale, 'companies-vi' | 'companies-en' | 'companies-ko'>;

type AnyCompanyEntry =
  | CollectionEntry<'companies-vi'>
  | CollectionEntry<'companies-en'>
  | CollectionEntry<'companies-ko'>;

// 저장소의 모든 필드는 이미 공개 가능 정보다(1.3절) — v1/v2와 달리 내부 전용 필드를 스트리핑할
// 필요는 없지만, 운영 메타(review_status 등)는 페이지에 렌더링하지 않도록 여기서 한 번에 제외한다.
export function toPublicCompany(entry: AnyCompanyEntry) {
  const { review_status: _reviewStatus, last_edited_by: _by, last_edited_at: _at, ...publicData } =
    entry.data;
  return publicData;
}

export type PublicCompany = ReturnType<typeof toPublicCompany>;

async function getApprovedEntries(locale: Locale): Promise<AnyCompanyEntry[]> {
  const collectionName = COLLECTION_BY_LOCALE[locale];
  const entries = await getCollection(collectionName);
  // 4.2절: 승인(approved)되고 공개(is_published) 상태인 기업만 빌드에 포함한다.
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

export async function getCompaniesWithEvents(locale: Locale): Promise<PublicCompany[]> {
  const companies = await getPublicCompanies(locale);
  return companies.filter((c) => c.events && c.events.length > 0);
}

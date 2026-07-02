import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 5장 콘텐츠 데이터 모델 기준 스키마.
// target_buyer_raw, review_status 등 내부 전용 필드는 여기 스키마에는 두되,
// src/lib/companies.ts의 toPublicCompany()가 렌더링 전에 항상 제거한다 (절대 렌더링 금지 원칙).
const companySchema = z.object({
  company_id: z.string(),
  name: z.string(),
  logo_image: z.string().optional(),
  sector: z.enum([
    'cybersecurity',
    'manufacturing-dx',
    'healthcare',
    'cloud-infra',
    'environment-energy',
    'ai-data',
    'edutech',
  ]),
  tagline: z.string(),
  solution_summary: z.string(),
  business_model: z.string(),
  ict_stage: z.string(),
  official_website: z.string().url(),
  target_buyer_display: z.string(),
  target_buyer_raw: z.string().optional(), // 비공개·내부전용 — 절대 렌더링 금지 (3장·5장 참조)
  reference_pdf_links: z.array(z.string()).optional(),
  review_status: z
    .enum(['draft', 'masking_reviewed', 'translation_reviewed', 'approved'])
    .default('draft'),
  is_published: z.boolean().default(false),
  source: z.enum(['google_sheet', 'admin_cms']).optional(),
  last_edited_by: z.string().optional(),
  last_edited_at: z.string().optional(),
  last_synced_at: z.string().optional(),
});

const companiesKo = defineCollection({
  loader: glob({ pattern: '*.json', base: '../content/ko/companies' }),
  schema: companySchema,
});

const companiesEn = defineCollection({
  loader: glob({ pattern: '*.json', base: '../content/en/companies' }),
  schema: companySchema,
});

const companiesVi = defineCollection({
  loader: glob({ pattern: '*.json', base: '../content/vi/companies' }),
  schema: companySchema,
});

export const collections = {
  'companies-ko': companiesKo,
  'companies-en': companiesEn,
  'companies-vi': companiesVi,
};

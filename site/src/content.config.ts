import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 5장 콘텐츠 데이터 모델 기준 스키마. 저장소의 모든 필드는 공개 가능 정보다(1.3절) —
// v1/v2와 달리 "내부 전용·절대 렌더링 금지" 필드(target_buyer_raw 등)가 존재하지 않는다.
const pdfDocumentSchema = z.object({
  title: z.string(),
  file: z.string(), // assets/docs/{company_id}/{slug}.pdf 상대 경로
  lang: z.enum(['vi', 'en', 'ko']),
  is_published: z.boolean().default(true),
});

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
  events: z.array(z.object({ name: z.string(), date: z.string() })).default([]),
  tagline: z.string(),
  problem: z.string(),
  value_summary: z.string(),
  key_metrics: z.array(z.object({ label: z.string(), value: z.string() })).max(3).default([]),
  vietnam_fit: z.string(),
  sdgs: z.array(z.number().int().min(1).max(17)).default([]),
  official_website: z.string().url(),
  target_buyer_display: z.string(),
  pdf_documents: z.array(pdfDocumentSchema).default([]),
  review_status: z
    .enum(['draft', 'content_reviewed', 'translation_reviewed', 'approved'])
    .default('draft'),
  is_published: z.boolean().default(false),
  last_edited_by: z.string().optional(),
  last_edited_at: z.string().optional(),
});

const loaderFor = (locale: string) =>
  glob({ pattern: '*.json', base: `../content/${locale}/companies` });

export const collections = {
  'companies-vi': defineCollection({ loader: loaderFor('vi'), schema: companySchema }),
  'companies-en': defineCollection({ loader: loaderFor('en'), schema: companySchema }),
  'companies-ko': defineCollection({ loader: loaderFor('ko'), schema: companySchema }),
};

import type { Locale } from './i18n';

// 2.2절 마스터 리스트 기준 7개 산업분야 — slug는 URL(/{lang}/sector/{slug})에 사용.
export const SECTORS = [
  'cybersecurity',
  'manufacturing-dx',
  'healthcare',
  'cloud-infra',
  'environment-energy',
  'ai-data',
  'edutech',
] as const;

export type Sector = (typeof SECTORS)[number];

export const SECTOR_LABELS: Record<Sector, Record<Locale, string>> = {
  cybersecurity: {
    ko: '사이버보안 및 보안관제',
    en: 'Cybersecurity & Security Monitoring',
    vi: 'An ninh mạng & Giám sát an ninh',
  },
  'manufacturing-dx': {
    ko: '제조혁신 (제조 DX)',
    en: 'Manufacturing Innovation (Manufacturing DX)',
    vi: 'Đổi mới sản xuất (Manufacturing DX)',
  },
  healthcare: {
    ko: '의료헬스케어바이오',
    en: 'Healthcare & Bio',
    vi: 'Y tế & Công nghệ sinh học',
  },
  'cloud-infra': {
    ko: '클라우드인프라플랫폼',
    en: 'Cloud Infrastructure Platform',
    vi: 'Nền tảng hạ tầng đám mây',
  },
  'environment-energy': {
    ko: '환경에너지스마트시티',
    en: 'Environment, Energy & Smart City',
    vi: 'Môi trường, Năng lượng & Thành phố thông minh',
  },
  'ai-data': {
    ko: 'AI데이터분석솔루션',
    en: 'AI & Data Analytics Solutions',
    vi: 'Giải pháp AI & Phân tích dữ liệu',
  },
  edutech: {
    ko: '교육콘텐츠서비스플랫폼',
    en: 'Education Content Service Platform',
    vi: 'Nền tảng dịch vụ nội dung giáo dục',
  },
};

export function sectorLabel(sector: Sector, locale: Locale): string {
  return SECTOR_LABELS[sector]?.[locale] ?? sector;
}

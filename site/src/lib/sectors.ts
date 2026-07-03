import type { Locale } from './i18n';

// 2.1절 신규 마스터 시트 '분야' 컬럼 기준 7개 산업분야.
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
    vi: 'An ninh mạng & Giám sát an ninh',
    en: 'Cybersecurity & Security Monitoring',
    ko: '사이버보안 및 보안관제',
  },
  'manufacturing-dx': {
    vi: 'Đổi mới sản xuất (Manufacturing DX)',
    en: 'Manufacturing Innovation (Manufacturing DX)',
    ko: '제조혁신 (제조 DX)',
  },
  healthcare: {
    vi: 'Y tế & Công nghệ sinh học',
    en: 'Healthcare & Bio',
    ko: '의료헬스케어바이오',
  },
  'cloud-infra': {
    vi: 'Nền tảng hạ tầng đám mây',
    en: 'Cloud Infrastructure Platform',
    ko: '클라우드인프라플랫폼',
  },
  'environment-energy': {
    vi: 'Môi trường, Năng lượng & Thành phố thông minh',
    en: 'Environment, Energy & Smart City',
    ko: '환경에너지스마트시티',
  },
  'ai-data': {
    vi: 'Giải pháp AI & Phân tích dữ liệu',
    en: 'AI & Data Analytics Solutions',
    ko: 'AI데이터분석솔루션',
  },
  edutech: {
    vi: 'Nền tảng dịch vụ nội dung giáo dục',
    en: 'Education Content Service Platform',
    ko: '교육콘텐츠서비스플랫폼',
  },
};

export function sectorLabel(sector: Sector, locale: Locale): string {
  return SECTOR_LABELS[sector]?.[locale] ?? sector;
}

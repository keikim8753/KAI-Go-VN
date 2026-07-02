export const LOCALES = ['ko', 'en', 'vi'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ko';

export const UI_TEXT: Record<Locale, Record<string, string>> = {
  ko: {
    siteTitle: '2026 집중지원기업 베트남 홍보',
    nav_home: '홈',
    nav_directory: '전체 기업',
    nav_about: '소개/연락처',
    home_hero_title: '베트남 진출 집중지원기업 소개',
    home_hero_desc: '7개 산업분야, 47개 기업의 솔루션을 만나보세요.',
    sector_view_all: '전체 기업 보기',
    company_visit_website: '공식 웹사이트 방문하기',
    company_target_buyer: '희망 협력분야',
    company_business_model: '비즈니스 모델',
    company_ict_stage: 'ICT 단계',
    company_inquiry: '문의하기',
    company_inquiry_desc:
      'NIPA 호치민IT지원센터를 통해 매칭 문의를 남길 수 있습니다.',
    directory_filter_sector: '산업분야',
    directory_filter_business_model: '비즈니스 모델',
    directory_filter_ict_stage: 'ICT 단계',
    directory_filter_all: '전체',
    directory_no_results: '조건에 맞는 기업이 없습니다.',
    about_title: '소개 및 문의',
    about_body:
      '본 사이트는 2026 집중지원기업의 베트남 현지 진출을 지원하기 위해 NIPA 호치민IT지원센터가 운영합니다.',
    about_contact: '문의: hcmc@nipa.kr',
    footer_notice: '본 사이트의 콘텐츠는 사전 검수를 거쳐 게시됩니다.',
  },
  en: {
    siteTitle: '2026 Vietnam Promotion — Focus Support Companies',
    nav_home: 'Home',
    nav_directory: 'All Companies',
    nav_about: 'About / Contact',
    home_hero_title: 'Focus Support Companies Expanding into Vietnam',
    home_hero_desc:
      'Discover solutions from 47 companies across 7 industry sectors.',
    sector_view_all: 'View all companies',
    company_visit_website: 'Visit official website',
    company_target_buyer: 'Target partners',
    company_business_model: 'Business model',
    company_ict_stage: 'ICT stage',
    company_inquiry: 'Inquire',
    company_inquiry_desc:
      'Send a matching inquiry via NIPA Ho Chi Minh City IT Support Center.',
    directory_filter_sector: 'Sector',
    directory_filter_business_model: 'Business model',
    directory_filter_ict_stage: 'ICT stage',
    directory_filter_all: 'All',
    directory_no_results: 'No companies match the selected filters.',
    about_title: 'About & Contact',
    about_body:
      'This site is operated by NIPA Ho Chi Minh City IT Support Center to support 2026 focus support companies expanding into Vietnam.',
    about_contact: 'Contact: hcmc@nipa.kr',
    footer_notice: 'All content on this site is reviewed before publication.',
  },
  vi: {
    siteTitle: '2026 Quảng bá doanh nghiệp trọng điểm tại Việt Nam',
    nav_home: 'Trang chủ',
    nav_directory: 'Tất cả doanh nghiệp',
    nav_about: 'Giới thiệu / Liên hệ',
    home_hero_title: 'Doanh nghiệp trọng điểm mở rộng sang Việt Nam',
    home_hero_desc:
      'Khám phá giải pháp từ 47 doanh nghiệp thuộc 7 lĩnh vực công nghiệp.',
    sector_view_all: 'Xem tất cả doanh nghiệp',
    company_visit_website: 'Truy cập website chính thức',
    company_target_buyer: 'Đối tác mong muốn',
    company_business_model: 'Mô hình kinh doanh',
    company_ict_stage: 'Giai đoạn ICT',
    company_inquiry: 'Liên hệ',
    company_inquiry_desc:
      'Gửi yêu cầu kết nối qua Trung tâm Hỗ trợ CNTT NIPA Hồ Chí Minh.',
    directory_filter_sector: 'Lĩnh vực',
    directory_filter_business_model: 'Mô hình kinh doanh',
    directory_filter_ict_stage: 'Giai đoạn ICT',
    directory_filter_all: 'Tất cả',
    directory_no_results: 'Không có doanh nghiệp phù hợp.',
    about_title: 'Giới thiệu & Liên hệ',
    about_body:
      'Trang web này được vận hành bởi Trung tâm Hỗ trợ CNTT NIPA Hồ Chí Minh nhằm hỗ trợ các doanh nghiệp trọng điểm 2026 mở rộng sang Việt Nam.',
    about_contact: 'Liên hệ: hcmc@nipa.kr',
    footer_notice: 'Toàn bộ nội dung trên trang này được kiểm duyệt trước khi đăng.',
  },
};

export function t(locale: Locale, key: string): string {
  return UI_TEXT[locale]?.[key] ?? UI_TEXT[DEFAULT_LOCALE][key] ?? key;
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

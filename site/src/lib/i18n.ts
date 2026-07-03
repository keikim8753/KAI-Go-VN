export const LOCALES = ['vi', 'en', 'ko'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'vi';

export const UI_TEXT: Record<Locale, Record<string, string>> = {
  vi: {
    siteTitle: 'Doanh nghiệp ICT Hàn Quốc tại Việt Nam',
    nav_home: 'Trang chủ',
    nav_directory: 'Tất cả doanh nghiệp',
    nav_about: 'Giới thiệu',
    hero_title: 'Giải pháp ICT Hàn Quốc cho bài toán của bạn',
    hero_desc:
      'Khám phá cách các doanh nghiệp ICT Hàn Quốc giải quyết vấn đề thực tế tại Việt Nam.',
    trust_bar: '66+ Doanh nghiệp · 7 Lĩnh vực · Hỗ trợ bởi NIPA · VI / EN / KO',
    upcoming_events: 'Sự kiện sắp tới',
    sector_view_all: 'Xem tất cả doanh nghiệp',
    section_problem: 'Vấn đề',
    section_value: 'Giải pháp & Giá trị',
    section_vietnam_fit: 'Phù hợp với Việt Nam',
    section_documents: 'Tài liệu',
    section_target_buyer: 'Đối tác mong muốn',
    cta_website: 'Truy cập website chính thức',
    cta_inquiry: 'Liên hệ kết nối',
    cta_meet_event: 'Gặp gỡ tại sự kiện',
    inquiry_desc: 'Gửi yêu cầu kết nối qua Trung tâm Hỗ trợ CNTT NIPA Hồ Chí Minh.',
    doc_view: 'Xem tài liệu',
    doc_download: 'Tải xuống / Mở trong tab mới',
    doc_mobile_notice: 'Xem tốt nhất trên máy tính. Nhấn để tải xuống hoặc mở trong tab mới.',
    directory_filter_sector: 'Lĩnh vực',
    directory_filter_sdg: 'SDG',
    directory_filter_event: 'Có sự kiện',
    directory_filter_all: 'Tất cả',
    directory_no_results: 'Không có doanh nghiệp phù hợp.',
    about_title: 'Giới thiệu & Liên hệ',
    about_body:
      'Trang web này được vận hành bởi Trung tâm Hỗ trợ CNTT NIPA Hồ Chí Minh nhằm kết nối doanh nghiệp ICT Hàn Quốc với đối tác tại Việt Nam.',
    about_contact: 'Liên hệ: hcmc@nipa.kr',
    footer_notice: 'Toàn bộ nội dung trên trang này được kiểm duyệt trước khi đăng.',
  },
  en: {
    siteTitle: 'Korean ICT Companies in Vietnam',
    nav_home: 'Home',
    nav_directory: 'All Companies',
    nav_about: 'About',
    hero_title: 'Korean ICT solutions for your challenges',
    hero_desc:
      'Discover how Korean ICT companies solve real problems for businesses in Vietnam.',
    trust_bar: '66+ Companies · 7 Sectors · Supported by NIPA · VI / EN / KO',
    upcoming_events: 'Upcoming Events',
    sector_view_all: 'View all companies',
    section_problem: 'The Problem',
    section_value: 'Solution & Value',
    section_vietnam_fit: 'Fit for Vietnam',
    section_documents: 'Documents',
    section_target_buyer: 'Target Partners',
    cta_website: 'Visit official website',
    cta_inquiry: 'Get in touch',
    cta_meet_event: 'Meet us at the event',
    inquiry_desc: 'Send a matching inquiry via NIPA Ho Chi Minh City IT Support Center.',
    doc_view: 'View document',
    doc_download: 'Download / Open in new tab',
    doc_mobile_notice: 'Best viewed on desktop. Tap to download or open in a new tab.',
    directory_filter_sector: 'Sector',
    directory_filter_sdg: 'SDG',
    directory_filter_event: 'Has event',
    directory_filter_all: 'All',
    directory_no_results: 'No companies match the selected filters.',
    about_title: 'About & Contact',
    about_body:
      'This site is operated by NIPA Ho Chi Minh City IT Support Center to connect Korean ICT companies with partners in Vietnam.',
    about_contact: 'Contact: hcmc@nipa.kr',
    footer_notice: 'All content on this site is reviewed before publication.',
  },
  ko: {
    siteTitle: '베트남 진출 한국 ICT 기업',
    nav_home: '홈',
    nav_directory: '전체 기업',
    nav_about: '소개',
    hero_title: '당신의 문제를 해결할 한국 ICT 솔루션',
    hero_desc: '한국 ICT 기업이 베트남 현장의 실제 문제를 어떻게 해결하는지 확인해보세요.',
    trust_bar: '66+ 기업 · 7개 분야 · NIPA 지원 · VI / EN / KO',
    upcoming_events: '다가오는 행사',
    sector_view_all: '전체 기업 보기',
    section_problem: '문제',
    section_value: '해결과 가치',
    section_vietnam_fit: '베트남 적용',
    section_documents: '자료실',
    section_target_buyer: '희망 협력분야',
    cta_website: '공식 웹사이트 방문하기',
    cta_inquiry: '매칭 문의하기',
    cta_meet_event: '행사에서 만나기',
    inquiry_desc: 'NIPA 호치민IT지원센터를 통해 매칭 문의를 남길 수 있습니다.',
    doc_view: '문서 보기',
    doc_download: '다운로드 / 새 탭에서 보기',
    doc_mobile_notice: 'PC에서 보시는 걸 권장합니다. 눌러서 다운로드하거나 새 탭에서 여세요.',
    directory_filter_sector: '산업분야',
    directory_filter_sdg: 'SDG',
    directory_filter_event: '행사 참가',
    directory_filter_all: '전체',
    directory_no_results: '조건에 맞는 기업이 없습니다.',
    about_title: '소개 및 문의',
    about_body:
      '본 사이트는 한국 ICT 기업과 베트남 현지 파트너를 연결하기 위해 NIPA 호치민IT지원센터가 운영합니다.',
    about_contact: '문의: hcmc@nipa.kr',
    footer_notice: '본 사이트의 콘텐츠는 사전 검수를 거쳐 게시됩니다.',
  },
};

export function t(locale: Locale, key: string): string {
  return UI_TEXT[locale]?.[key] ?? UI_TEXT[DEFAULT_LOCALE][key] ?? key;
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

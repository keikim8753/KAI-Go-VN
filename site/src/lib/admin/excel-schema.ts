// 관리자 웹앱 엑셀 업로드 양식 — 워크북 안에 "ko"(필수, 공통필드 포함) · "en"(선택) · "vi"(선택)
// 시트 3개. ko 시트가 기업ID·분야·행사·SDG·홈페이지 등 공통 필드의 기준(canonical)이다.
// en/vi 시트는 번역 텍스트만 담고, 기업ID(기존 수정) 또는 기업명(신규 등록, 조인 키)으로 ko 시트와 매칭한다.

export const KO_HEADERS = {
  companyId: '기업ID',
  name: '기업명',
  sector: '분야',
  events: '참가행사',
  sdgs: 'SDG',
  officialWebsite: '홈페이지',
  logoImage: '로고URL',
  tagline: '한줄가치제안',
  problem: '문제',
  valueSummary: '해결과가치',
  metric1Value: '핵심지표1값',
  metric1Label: '핵심지표1설명',
  metric2Value: '핵심지표2값',
  metric2Label: '핵심지표2설명',
  metric3Value: '핵심지표3값',
  metric3Label: '핵심지표3설명',
  vietnamFit: '베트남적용',
  targetBuyerDisplay: '희망협력분야',
  isPublished: '공개여부',
} as const;

export const TRANSLATION_HEADERS = {
  companyId: '기업ID',
  name: '기업명',
  tagline: '한줄가치제안',
  problem: '문제',
  valueSummary: '해결과가치',
  metric1Value: '핵심지표1값',
  metric1Label: '핵심지표1설명',
  metric2Value: '핵심지표2값',
  metric2Label: '핵심지표2설명',
  metric3Value: '핵심지표3값',
  metric3Label: '핵심지표3설명',
  vietnamFit: '베트남적용',
  targetBuyerDisplay: '희망협력분야',
} as const;

export const SHEET_NAMES = { ko: 'ko', en: 'en', vi: 'vi' } as const;

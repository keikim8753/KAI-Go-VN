// 3.2절 자동 일반화 변환 — 업종 매핑표.
// A(실명 명시) 분류 결과를 일반화 문구로 바꿀 때 참고하는 시작점. 완전한 목록이 아니므로
// 담당자가 47개사 전체 적용 후 계속 보강해야 한다 (검수 없이 게시하지 않는다는 원칙은 유지).
export const INDUSTRY_GENERALIZATION_MAP = [
  { match: /telecom|통신|viettel|vnpt|mobifone/i, display: '현지 통신·ICT 기업' },
  { match: /resort|retail|리조트|유통|distribution/i, display: '리테일·리조트 운영사' },
  { match: /bank|finance|은행|금융|fintech/i, display: '금융권 기관' },
  { match: /hospital|clinic|병원|헬스케어|healthcare/i, display: '병원·헬스케어 솔루션 바이어' },
  { match: /government|공공|gov\.|ministry|committee/i, display: '공공 ICT 기관' },
  { match: /group|conglomerate|그룹|대기업/i, display: '대기업 그룹' },
  { match: /si\b|system integrat|시스템\s*통합/i, display: '현지 SI/유통 파트너' },
];

// 정형 패턴(이메일·전화번호)만 정규식으로 확정 탐지 — 인명·고유명사는 LLM 재검증에 위임 (3.2·11.2절).
export const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
export const PHONE_PATTERN = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;

export function detectFormalPII(text) {
  if (!text) return [];
  const hits = [];
  const emails = text.match(EMAIL_PATTERN);
  if (emails) hits.push(...emails.map((v) => ({ type: 'email', value: v })));
  const phones = text.match(PHONE_PATTERN);
  if (phones) hits.push(...phones.map((v) => ({ type: 'phone', value: v })));
  return hits;
}

export function suggestGeneralization(rawText) {
  for (const rule of INDUSTRY_GENERALIZATION_MAP) {
    if (rule.match.test(rawText)) return rule.display;
  }
  return null;
}

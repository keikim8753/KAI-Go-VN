// GitHub Issue Forms가 렌더링하는 이슈 본문은 각 필드가 "### {label}\n\n{value}\n\n" 형태로 나온다.
// 이 맵은 .github/ISSUE_TEMPLATE/company.yml의 label 문구와 정확히 일치해야 한다.
export const FIELD_LABELS = {
  company_id: '기업 ID (수정 시에만 입력)',
  name: '기업명',
  sector: '산업분야',
  official_website: '공식 홈페이지 URL',
  logo_image: '로고 이미지',
  events: '참가 행사 (선택)',
  sdgs: '해당 SDGs (선택)',
  tagline_vi: '한 줄 가치 제안 (VI)',
  problem_vi: '문제 (VI)',
  value_summary_vi: '해결과 가치 (VI)',
  key_metrics_vi: '핵심 수치 지표 (VI, 최대 3개)',
  vietnam_fit_vi: '베트남 적용 포인트 (VI)',
  target_buyer_display_vi: '희망 협력분야 (VI)',
  tagline_en: 'Tagline (EN)',
  problem_en: 'Problem (EN)',
  value_summary_en: 'Solution & Value (EN)',
  key_metrics_en: 'Key Metrics (EN, up to 3)',
  vietnam_fit_en: 'Vietnam Fit (EN)',
  target_buyer_display_en: 'Target Partners (EN)',
  tagline_ko: '한 줄 가치 제안 (KO)',
  problem_ko: '문제 (KO)',
  value_summary_ko: '해결과 가치 (KO)',
  key_metrics_ko: '핵심 수치 지표 (KO, 최대 3개)',
  vietnam_fit_ko: '베트남 적용 (KO)',
  target_buyer_display_ko: '희망 협력분야 (KO)',
  pdf_attachments: 'PDF 자료 첨부',
  is_published: '공개 여부',
};

const NO_RESPONSE = '_No response_';

/**
 * GitHub Issue Forms 렌더링 본문을 { fieldId: value } 형태로 파싱한다.
 */
export function parseIssueBody(body) {
  const result = {};
  const labelToId = Object.fromEntries(Object.entries(FIELD_LABELS).map(([id, l]) => [l, id]));

  // "### label" 로 시작하는 블록 단위로 분할
  const blocks = body.split(/\n(?=### )/g);
  for (const block of blocks) {
    const headerMatch = block.match(/^### (.+)\n/);
    if (!headerMatch) continue;
    const label = headerMatch[1].trim();
    const fieldId = labelToId[label];
    if (!fieldId) continue;

    const value = block.slice(headerMatch[0].length).trim();
    result[fieldId] = value === NO_RESPONSE ? '' : value;
  }
  return result;
}

/** "값 | 설명" 또는 "이름 | 날짜" 형태의 줄들을 파싱 */
export function parsePipeLines(text) {
  if (!text) return [];
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [a, b] = line.split('|').map((s) => s.trim());
      return [a, b];
    });
}

export function parseEvents(text) {
  return parsePipeLines(text).map(([name, date]) => ({ name, date }));
}

export function parseKeyMetrics(text) {
  return parsePipeLines(text)
    .slice(0, 3)
    .map(([value, label]) => ({ value, label }));
}

export function parseSdgs(text) {
  if (!text) return [];
  return text
    .split(',')
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 17);
}

/** "제목 | 언어 | URL" 형태의 PDF 첨부 목록 파싱 */
export function parsePdfAttachments(text) {
  if (!text) return [];
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((s) => s.trim());
      if (parts.length < 3) return null;
      const [title, lang, url] = parts;
      return { title, lang, url };
    })
    .filter(Boolean);
}

/** 드래그 앤 드롭으로 삽입된 이미지 마크다운(`![](url)`)에서 URL만 추출 */
export function extractImageUrl(text) {
  const match = text?.match(/!\[[^\]]*\]\((\S+)\)/);
  return match ? match[1] : text?.trim();
}

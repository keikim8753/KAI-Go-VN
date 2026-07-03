import crypto from 'node:crypto';

// 3·9장: "내부 관리 차단어 목록(해시 보관)". 실명이 알려진 특정 바이어/기관명을 평문으로
// 저장소에 남기지 않기 위해, 금지어 자체가 아니라 SHA-256 해시만 이 배열에 보관한다.
// 새 금지어를 추가하려면: node -e "console.log(require('crypto').createHash('sha256').update('금지어').digest('hex'))"
// 로 해시를 뽑아 아래 배열에 추가한다.
export const BLOCKED_WORD_HASHES = [
  // 예시 — 실제 운영 시 내부적으로 확인된 바이어 실명의 해시를 여기에 추가한다.
];

export function hashToken(token) {
  return crypto.createHash('sha256').update(token.trim().toLowerCase()).digest('hex');
}

/** 텍스트를 토큰화(공백·구두점 분리 + 2~4단어 조합)하여 차단어 해시와 대조한다 */
export function findBlockedTokens(text) {
  if (!text || BLOCKED_WORD_HASHES.length === 0) return [];
  const words = text
    .replace(/[.,!?;:()\[\]"']/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const candidates = new Set();
  for (let n = 1; n <= 4; n++) {
    for (let i = 0; i + n <= words.length; i++) {
      candidates.add(words.slice(i, i + n).join(' '));
    }
  }

  const hits = [];
  for (const candidate of candidates) {
    if (BLOCKED_WORD_HASHES.includes(hashToken(candidate))) {
      hits.push(candidate);
    }
  }
  return hits;
}

// 2.2절 마스터 리스트의 7개 산업분야 한글명 -> 사이트 sector slug / company_id 접두사 매핑.
// site/src/lib/sectors.ts의 SECTORS 목록과 반드시 동일하게 유지할 것 (두 프로젝트가 별도 런타임이라 공유 불가).
export const SECTOR_MAP = [
  { keyword: '사이버보안', slug: 'cybersecurity', code: 'csec' },
  { keyword: '제조', slug: 'manufacturing-dx', code: 'mfg' },
  { keyword: '의료', slug: 'healthcare', code: 'hc' },
  { keyword: '클라우드', slug: 'cloud-infra', code: 'cloud' },
  { keyword: '환경', slug: 'environment-energy', code: 'env' },
  { keyword: 'AI', slug: 'ai-data', code: 'ai' },
  { keyword: '교육', slug: 'edutech', code: 'edu' },
];

export function resolveSector(masterListSectorName) {
  const found = SECTOR_MAP.find((s) => masterListSectorName?.includes(s.keyword));
  if (!found) {
    throw new Error(`알 수 없는 산업분야명: "${masterListSectorName}" — SECTOR_MAP을 확인하세요.`);
  }
  return found;
}

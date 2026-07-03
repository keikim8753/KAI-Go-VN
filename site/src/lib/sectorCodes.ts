import type { Sector } from './sectors';

// company_id 채번 접두사 — scripts/lib/sector-map.js(구 버전, 삭제됨)와 동일한 값을 유지해야 한다.
// 관리자 웹앱(admin.astro)의 엑셀 파서에서 사용.
export const SECTOR_CODES: Record<Sector, string> = {
  cybersecurity: 'csec',
  'manufacturing-dx': 'mfg',
  healthcare: 'hc',
  'cloud-infra': 'cloud',
  'environment-energy': 'env',
  'ai-data': 'ai',
  edutech: 'edu',
};

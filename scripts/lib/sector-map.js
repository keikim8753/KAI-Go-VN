// 2.1절 7개 산업분야 <-> company_id 접두사. site/src/lib/sectors.ts의 SECTORS와 반드시 동일하게 유지.
export const SECTOR_CODES = {
  cybersecurity: 'csec',
  'manufacturing-dx': 'mfg',
  healthcare: 'hc',
  'cloud-infra': 'cloud',
  'environment-energy': 'env',
  'ai-data': 'ai',
  edutech: 'edu',
};

export function extractSectorSlug(dropdownValue) {
  // "cybersecurity (사이버보안 및 보안관제)" -> "cybersecurity"
  const match = dropdownValue?.match(/^([a-z-]+)/);
  if (!match || !SECTOR_CODES[match[1]]) {
    throw new Error(`알 수 없는 산업분야 값: "${dropdownValue}"`);
  }
  return match[1];
}

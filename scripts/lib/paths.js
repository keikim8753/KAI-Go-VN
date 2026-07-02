import path from 'node:path';
import { fileURLToPath } from 'node:url';

// scripts/lib/paths.js -> 저장소 루트는 두 단계 위
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const CONTENT_ROOT = path.join(REPO_ROOT, 'content');
export const LOCALES = ['ko', 'en', 'vi'];

export function companiesDir(locale) {
  return path.join(CONTENT_ROOT, locale, 'companies');
}

export function companyFilePath(locale, companyId) {
  return path.join(companiesDir(locale), `${companyId}.json`);
}

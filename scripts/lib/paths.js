import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const CONTENT_ROOT = path.join(REPO_ROOT, 'content');
export const ASSETS_DOCS_ROOT = path.join(REPO_ROOT, 'assets', 'docs');
export const LOCALES = ['vi', 'en', 'ko'];

export function companiesDir(locale) {
  return path.join(CONTENT_ROOT, locale, 'companies');
}

export function companyFilePath(locale, companyId) {
  return path.join(companiesDir(locale), `${companyId}.json`);
}

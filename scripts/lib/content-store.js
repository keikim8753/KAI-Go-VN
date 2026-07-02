import fs from 'node:fs/promises';
import path from 'node:path';
import { companiesDir, companyFilePath, LOCALES } from './paths.js';

export async function listCompanyIds(locale) {
  const dir = companiesDir(locale);
  await fs.mkdir(dir, { recursive: true });
  const files = await fs.readdir(dir);
  return files.filter((f) => f.endsWith('.json')).map((f) => path.basename(f, '.json'));
}

export async function readCompany(locale, companyId) {
  const raw = await fs.readFile(companyFilePath(locale, companyId), 'utf-8');
  return JSON.parse(raw);
}

export async function writeCompany(locale, companyId, data) {
  const filePath = companyFilePath(locale, companyId);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export async function readAllCompanies(locale) {
  const ids = await listCompanyIds(locale);
  const entries = await Promise.all(
    ids.map(async (id) => ({ id, data: await readCompany(locale, id) })),
  );
  return entries;
}

export async function readAllLocales(companyId) {
  const result = {};
  for (const locale of LOCALES) {
    try {
      result[locale] = await readCompany(locale, companyId);
    } catch {
      result[locale] = null; // 해당 언어 파일이 아직 없을 수 있음 (번역 대기 등)
    }
  }
  return result;
}

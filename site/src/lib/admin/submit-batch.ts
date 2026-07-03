import type { ParsedCompany } from './excel-parser';
import { createBranch, readFile, upsertFile, createPullRequest, GitHubApiError } from './github-api';

export interface SubmitProgress {
  message: string;
}

export async function submitExcelBatch(
  token: string,
  submitterLogin: string,
  companies: ParsedCompany[],
  onProgress: (p: SubmitProgress) => void,
): Promise<{ number: number; html_url: string }> {
  const branch = `admin/excel-${Date.now()}`;
  onProgress({ message: `브랜치 생성: ${branch}` });
  await createBranch(token, branch);

  for (const company of companies) {
    for (const [locale, content] of Object.entries(company.locales) as [
      'ko' | 'en' | 'vi',
      NonNullable<ParsedCompany['locales']['ko']>,
    ][]) {
      const path = `content/${locale}/companies/${company.company_id}.json`;
      onProgress({ message: `${path} 작성 중...` });

      // 기존 파일이 있으면 pdf_documents 등 엑셀에 없는 필드를 보존한다.
      const existing = await readFile(token, path, branch);
      const existingData = existing ? JSON.parse(existing.content) : {};

      const data = {
        company_id: company.company_id,
        name: company.name,
        logo_image: company.logo_image ?? existingData.logo_image,
        sector: company.sector,
        events: company.events,
        sdgs: company.sdgs,
        official_website: company.official_website,
        tagline: content.tagline,
        problem: content.problem,
        value_summary: content.value_summary,
        key_metrics: content.key_metrics,
        vietnam_fit: content.vietnam_fit,
        target_buyer_display: content.target_buyer_display,
        pdf_documents: existingData.pdf_documents ?? [],
        // 입력자·승인자 분리 원칙 — 엑셀 업로드는 항상 draft·비공개로 1차 반영되고,
        // 웹어드민의 "승인" 버튼(approveAndMerge)만이 review_status/is_published을 올린다.
        review_status: 'draft',
        is_published: false,
        last_edited_by: submitterLogin,
        last_edited_at: new Date().toISOString(),
      };

      await upsertFile(token, branch, path, data, `chore(admin): ${company.company_id} (${locale}) 엑셀 업로드 반영`);
    }
  }

  onProgress({ message: 'PR 생성 중...' });
  const newCount = companies.filter((c) => c.isNew).length;
  const updateCount = companies.length - newCount;
  const body = [
    `엑셀 업로드로 생성된 변경분입니다 (@${submitterLogin}).`,
    '',
    `- 신규 등록: ${newCount}건`,
    `- 기존 수정: ${updateCount}건`,
    '',
    '| company_id | 기업명 | 상태 | 언어 |',
    '|---|---|---|---|',
    ...companies.map(
      (c) =>
        `| ${c.company_id} | ${c.name} | ${c.isNew ? '신규' : '수정'} | ${Object.keys(c.locales).join(', ')} |`,
    ),
    '',
    '이 PR은 입력자 본인이 아닌 별도 승인자가 웹어드민의 "승인 대기 목록"에서 승인해야 반영됩니다.',
  ].join('\n');

  return createPullRequest(token, branch, `[관리자] 엑셀 업로드 — ${companies.length}건`, body);
}

export { GitHubApiError };

// 관리자 웹앱의 GitHub REST API 클라이언트 — 브라우저에서 개인 액세스 토큰(PAT)으로 직접 호출한다.
// 서버·시크릿 없음: 토큰은 sessionStorage에만 보관되고 api.github.com으로만 전송된다.

const OWNER = 'keikim8753';
const REPO = 'KAI-Go-VN';
const BASE_BRANCH = 'main';
const API = 'https://api.github.com';

export class GitHubApiError extends Error {}

async function gh(token: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new GitHubApiError(`GitHub API ${res.status} — ${path}\n${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function verifyToken(token: string): Promise<{ login: string }> {
  return gh(token, '/user');
}

function toBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

async function fromBase64Utf8(base64: string): Promise<string> {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** content/{locale}/companies/ 하위 파일 목록을 { company_id: name } 형태로 가져온다. */
export async function listExistingCompanies(
  token: string,
  locale: 'ko' | 'en' | 'vi' = 'ko',
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  let files: { name: string }[];
  try {
    files = await gh(token, `/repos/${OWNER}/${REPO}/contents/content/${locale}/companies?ref=${BASE_BRANCH}`);
  } catch {
    return result; // 폴더가 아직 없을 수 있음
  }
  for (const file of files) {
    if (!file.name.endsWith('.json')) continue;
    const id = file.name.replace(/\.json$/, '');
    try {
      const data = await readFile(token, `content/${locale}/companies/${file.name}`, BASE_BRANCH);
      if (!data) throw new Error('file not found');
      const parsed = JSON.parse(data.content);
      result.set(id, parsed.name ?? id);
    } catch {
      result.set(id, id);
    }
  }
  return result;
}

export async function readFile(
  token: string,
  path: string,
  ref: string,
): Promise<{ content: string; sha: string } | null> {
  try {
    const res = await gh(token, `/repos/${OWNER}/${REPO}/contents/${path}?ref=${ref}`);
    return { content: await fromBase64Utf8(res.content), sha: res.sha };
  } catch {
    return null;
  }
}

export async function createBranch(token: string, branchName: string): Promise<void> {
  const ref = await gh(token, `/repos/${OWNER}/${REPO}/git/ref/heads/${BASE_BRANCH}`);
  await gh(token, `/repos/${OWNER}/${REPO}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: ref.object.sha }),
  });
}

export async function upsertFile(
  token: string,
  branch: string,
  path: string,
  contentObj: unknown,
  message: string,
): Promise<void> {
  const existing = await readFile(token, path, branch);
  await gh(token, `/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: toBase64Utf8(JSON.stringify(contentObj, null, 2) + '\n'),
      branch,
      ...(existing ? { sha: existing.sha } : {}),
    }),
  });
}

export async function createPullRequest(
  token: string,
  branch: string,
  title: string,
  body: string,
): Promise<{ number: number; html_url: string }> {
  return gh(token, `/repos/${OWNER}/${REPO}/pulls`, {
    method: 'POST',
    body: JSON.stringify({ title, head: branch, base: BASE_BRANCH, body }),
  });
}

export interface OpenPr {
  number: number;
  title: string;
  html_url: string;
  user: { login: string };
  created_at: string;
  head: { ref: string };
}

export async function listOpenPullRequests(token: string): Promise<OpenPr[]> {
  return gh(token, `/repos/${OWNER}/${REPO}/pulls?state=open&base=${BASE_BRANCH}&per_page=50`);
}

export async function getPullRequest(token: string, prNumber: number): Promise<OpenPr> {
  return gh(token, `/repos/${OWNER}/${REPO}/pulls/${prNumber}`);
}

export async function listPullRequestFiles(token: string, prNumber: number): Promise<{ filename: string }[]> {
  return gh(token, `/repos/${OWNER}/${REPO}/pulls/${prNumber}/files?per_page=100`);
}

/**
 * 승인 처리 — PR 브랜치 위의 콘텐츠 JSON에 review_status: approved, is_published: true를
 * 반영(커밋)한 뒤 승인 리뷰를 남기고 병합한다. 입력자 본인 계정으로 시도하면 GitHub이
 * 셀프 승인을 막아 에러를 던진다(branch protection — 입력자·승인자 분리 강제).
 */
export async function approveAndMerge(token: string, prNumber: number): Promise<void> {
  const pr = await getPullRequest(token, prNumber);
  const files = await listPullRequestFiles(token, prNumber);
  const contentFiles = files.filter((f) => /^content\/(ko|en|vi)\/companies\/.+\.json$/.test(f.filename));

  for (const file of contentFiles) {
    const existing = await readFile(token, file.filename, pr.head.ref);
    if (!existing) continue;
    const data = JSON.parse(existing.content);
    data.review_status = 'approved';
    data.is_published = true;
    await upsertFile(token, pr.head.ref, file.filename, data, `chore: ${file.filename} 승인 반영`);
  }

  await gh(token, `/repos/${OWNER}/${REPO}/pulls/${prNumber}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ event: 'APPROVE' }),
  });
  await gh(token, `/repos/${OWNER}/${REPO}/pulls/${prNumber}/merge`, {
    method: 'PUT',
    body: JSON.stringify({ merge_method: 'squash' }),
  });
}

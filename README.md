# 베트남 진출 한국 ICT 기업 홍보 웹사이트 (v3)

`베트남_홍보웹사이트_구축계획서_v3.md`를 코드로 구현한 것입니다. v1/v2(Google API 파이프라인,
Netlify, Decap CMS)에서 전면 전환 — **시크릿 0개, GitHub 완결형** 아키텍처입니다.

## 핵심 원칙

이 저장소는 **Public**입니다. `content/`, `assets/docs/`, Issue, PR, 커밋 이력까지 전부 공개됩니다.
따라서:
- 바이어 실명, 담당자 개인정보는 **어떤 형태로도 입력하지 않습니다** (검토는 입력 전에 완료).
- PDF는 기업이 **대외 공개용으로 제공에 동의한 자료만** 업로드합니다.
- 모든 게시물은 입력자가 아닌 **별도 승인자**의 PR 승인을 거쳐야 반영됩니다.

## 구조

```
content/{vi,en,ko}/companies/{company_id}.json   # 5장 콘텐츠 데이터 모델
assets/docs/{company_id}/{slug}.pdf              # 4.3절 PDF 자료 (공개용만)
site/                                             # Astro 사이트 (8장 디자인 시스템)
scripts/
  issue-to-content.js   # Issue Form 제출 → 콘텐츠 JSON + PDF 생성
  validate.js            # 개인정보·차단어·is_published 정합성·PDF 크기/타입 검증
.github/
  ISSUE_TEMPLATE/company.yml   # 기업 정보 등록/수정 폼 (유일한 입력 경로)
  workflows/
    company-intake.yml   # Issue 제출 → 콘텐츠 PR 자동 생성
    pr-preview.yml        # PR마다 실제 렌더링 프리뷰 배포
    deploy.yml             # main 병합 시 GitHub Pages 배포
```

## 로컬 개발

```bash
cd site
npm install
npm run dev      # http://localhost:4321/ 는 /vi/로 리다이렉트
npm run build    # 정적 빌드 검증
```

검증 스크립트(저장소 루트, 의존성 없이 Node 내장 모듈만 사용):

```bash
node scripts/validate.js               # PII·차단어·정합성·PDF 검증 — 자격증명 불필요
ISSUE_BODY="..." ISSUE_NUMBER=1 ISSUE_AUTHOR=me node scripts/issue-to-content.js
```

## 지금 바로 되는 것 / 아직 안 되는 것

| 구성 요소 | 상태 |
|---|---|
| Astro 사이트 (vi 기본, 홈/sector/기업상세/directory/about) | ✅ 동작 — 파일럿 3개사(이글루코퍼레이션·Waycen·8ttech)로 빌드 검증 완료 |
| 다크 글래스모피즘 디자인(8장), PDF 뷰어(모바일 CSS 폴백) | ✅ 동작 |
| 클라이언트 검색/필터(분야·SDG·행사) | ✅ 동작 |
| `validate.js` (PII·차단어 해시·정합성·PDF 검증) | ✅ 자격증명 없이 로컬 실행 가능, 4종 위반 케이스 실제 테스트 완료 |
| `issue-to-content.js` (Issue Form 파싱) | ✅ 합성 데이터로 종단 테스트 완료 — company_id 자동 채번, 언어별 부분 제출 처리 확인 |
| GitHub Actions 3종 (company-intake/pr-preview/deploy) | ⚠ YAML 문법 검증만 완료, 실제 GitHub 저장소에서 미검증 |
| GitHub Pages 배포 | ⚠ 저장소 Pages 설정 필요 (아래 참조) |

## 다음으로 사람이 해야 할 일 (부록 체크리스트 대응)

1. **저장소를 Public으로 전환** — Settings → General → Danger Zone → Change visibility
2. **Pages 활성화** — Settings → Pages → Source: **"Deploy from a branch"** → Branch: `gh-pages` (첫 `deploy.yml` 실행 후 이 브랜치가 생성됨 — 그 전까지는 옵션에 안 보일 수 있음)
3. **Branch protection** — Settings → Branches → `main` 보호 규칙: PR 필수, 승인 1인 이상, **셀프 승인 금지**, `validate.js`가 포함된 체크(company-intake.yml)를 required status check로 등록
4. **협업자 초대** — 검수자(승인자) 2인 이상, Trang/Tram 포함
5. **66개사 게시 동의·로고·공개용 PDF·보완 수치 확보** (크리티컬 패스, 12장 리스크 1번) — 지금 바로 요청 발송 가능
6. **파일럿 3개사 데이터 실사** — 지금 있는 이글루코퍼레이션/Waycen/8ttech 콘텐츠는 시연용 예시입니다. 신규 마스터 시트(2.1절)의 실제 값으로 교체 필요
7. **66개사 본 구축** — 마스터 시트 확보 후, 이 저장소에서 Claude 세션을 열어 2.1절 매핑 규칙대로 JSON 초안 생성 → 검수 → 커밋 (2.3절 — API 불필요, 사람이 직접 검수)

## 알아둘 것

- `assets/docs/`에 올라간 PDF는 **공개 저장소를 통해 영구히 배포되는 것으로 간주**하세요. 삭제해도 git 이력에는 남습니다.
- `scripts/lib/blocklist.js`의 `BLOCKED_WORD_HASHES`는 비워져 있습니다. 알려진 민감 표현이 있다면 해시만 추가하세요(원문은 절대 커밋하지 않음) — 상단 주석에 해시 생성 명령이 있습니다.
- 저장소 용량 상한(PDF 기업당 20MB·전체 700MB)은 `scripts/validate.js`가 자동으로 점검합니다.

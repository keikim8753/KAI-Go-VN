# 베트남 진출 한국 ICT 기업 홍보 웹사이트 (v4)

`베트남_홍보웹사이트_구축계획서_v3.md`(0장에 v4 변경 이력 포함)를 코드로 구현한 것입니다.
**시크릿 0개, GitHub 완결형** 아키텍처를 유지하면서, 관리자 경로를 GitHub Issue Form에서
**웹어드민(`/admin`) + 엑셀 일괄 업로드 + GitHub PAT 인증**으로 교체했습니다 (4.2절 참조).

## 핵심 원칙

이 저장소는 **Public**입니다. `content/`, PR, 커밋 이력까지 전부 공개됩니다. 따라서:
- 바이어 실명, 담당자 개인정보는 **어떤 형태로도 입력하지 않습니다** (검토는 입력 전에 완료).
- 모든 게시물은 입력자가 아닌 **별도 승인자**가 웹어드민에서 승인해야 반영됩니다.

## 구조

```
content/{vi,en,ko}/companies/{company_id}.json   # 5장 콘텐츠 데이터 모델
site/                                             # Astro 사이트 (8장 디자인 시스템)
  src/pages/admin.astro                            # 웹어드민 (4.2절) — PAT 로그인, 엑셀 업로드, 승인 대기 목록
  src/lib/admin/
    github-api.ts                                   # GitHub REST API 클라이언트 (브라우저 → api.github.com)
    excel-parser.ts                                  # SheetJS 워크북(ko/en/vi 시트) → 콘텐츠 레코드
    excel-schema.ts                                  # 엑셀 컬럼 헤더 정의
    submit-batch.ts                                  # 브랜치 생성 → 콘텐츠 커밋 → PR 생성
scripts/
  validate.js   # 개인정보·차단어·is_published 정합성·PDF 크기/타입 검증 (CI에서 실행)
.github/
  workflows/
    pr-preview.yml   # PR마다 실제 렌더링 프리뷰 배포
    deploy.yml        # main 병합 시 GitHub Pages 배포
```

## 웹어드민 사용법

1. `https://keikim8753.github.io/KAI-Go-VN/admin/` 접속
2. [GitHub Fine-grained PAT 발급 페이지](https://github.com/settings/personal-access-tokens/new)에서
   이 저장소(KAI-Go-VN)에 대해 **Contents: Read and write**, **Pull requests: Read and write** 권한을 부여한
   토큰 발급 → 웹어드민에 붙여넣어 로그인 (토큰은 브라우저 `sessionStorage`에만 저장, 서버 전송 없음)
3. **엑셀 업로드 탭**: "템플릿 다운로드"로 양식을 받아 `ko`(필수) / `en` / `vi` 시트에 기업 정보를 채운 뒤 업로드 →
   자동으로 PR 생성 (draft 상태, 1차 반영)
4. **승인 대기 목록 탭**: (입력자와 다른 계정으로 로그인) PR을 확인하고 "승인 및 반영" 클릭 →
   `review_status: approved`, `is_published: true`로 갱신 + 병합 (최종 반영)

## 로컬 개발

```bash
cd site
npm install
npm run dev      # http://localhost:4321/ 는 /vi/로 리다이렉트, /admin/ 도 로컬에서 접속 가능
npm run build    # 정적 빌드 검증
npx astro check  # TypeScript 타입 검증
```

검증 스크립트(저장소 루트, 의존성 없이 Node 내장 모듈만 사용):

```bash
node scripts/validate.js   # PII·차단어·정합성·PDF 검증 — 자격증명 불필요
```

## 지금 바로 되는 것 / 아직 안 되는 것

| 구성 요소 | 상태 |
|---|---|
| Astro 사이트 (vi 기본, 홈/sector/기업상세/directory/about) | ✅ 동작 — 파일럿 3개사(이글루코퍼레이션·Waycen·8ttech)로 빌드 검증 완료 |
| 다크 글래스모피즘 디자인(8장), PDF 뷰어(모바일 CSS 폴백) | ✅ 동작 |
| 클라이언트 검색/필터(분야·SDG·행사) | ✅ 동작 |
| `validate.js` (PII·차단어 해시·정합성·PDF 검증) | ✅ 자격증명 없이 로컬 실행 가능, 위반 케이스 실제 테스트 완료 |
| 엑셀 파서 (SheetJS 워크북 → 레코드) | ✅ Node에서 round-trip 테스트 완료(헤더·한글 텍스트 보존 확인) |
| 웹어드민(`/admin`) — PAT 로그인, 엑셀 업로드, 승인 대기 목록 | ⚠ 빌드·타입체크 통과, **실제 GitHub 저장소 대상 종단 테스트는 아직 안 함** — 실제 PAT로 업로드→PR 생성→승인→병합까지 확인 필요 |
| PDF 자료 업로드 경로 | ❌ **미구현** — v3의 Issue Form 첨부 경로가 사라지고 대체 기능이 아직 없음 (계획서 4.3절 갭) |
| GitHub Actions 2종 (pr-preview/deploy) | ✅ 실제 저장소에서 배포 성공 확인 (gh-pages 브랜치) |
| GitHub Pages 배포 | ✅ https://keikim8753.github.io/KAI-Go-VN/ 실제 서빙 중 |

## 다음으로 사람이 해야 할 일

1. **웹어드민 실사용 테스트** — Fine-grained PAT 2개(입력자용/승인자용) 발급 후, 엑셀 업로드 → PR 생성 → 승인 대기 목록에서 승인 → 실제 병합까지 종단 테스트 (셀프 승인이 정말 막히는지도 함께 확인)
2. **PDF 업로드 경로 결정** — 웹어드민에 업로드 탭을 추가할지, 당분간 저장소 직접 편집으로 대체할지 결정 (계획서 12장 리스크 9번)
3. **66개사 게시 동의·로고·공개용 PDF·보완 수치 확보** (크리티컬 패스, 12장 리스크 1번)
4. **파일럿 3개사 데이터 교체** — 지금 있는 이글루코퍼레이션/Waycen/8ttech 콘텐츠는 시연용 예시입니다. 신규 마스터 시트(2.1절)의 실제 값으로 교체 필요
5. **66개사 본 구축** — 마스터 시트 확보 후 엑셀 템플릿에 채워 웹어드민으로 일괄 업로드

## 알아둘 것

- `scripts/lib/blocklist.js`의 `BLOCKED_WORD_HASHES`는 비워져 있습니다. 알려진 민감 표현이 있다면 해시만 추가하세요(원문은 절대 커밋하지 않음).
- PAT은 브라우저에만 저장되고 탭을 닫으면 사라집니다. 공용 PC에서는 사용하지 마세요 (계획서 12장 리스크 10번).
- 입력자와 승인자는 **반드시 서로 다른 GitHub 계정**을 사용해야 합니다 — 같은 계정으로 시도하면 branch protection이 거부합니다.

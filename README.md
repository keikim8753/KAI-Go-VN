# 2026 집중지원기업 베트남 홍보 웹사이트

`베트남_홍보웹사이트_구축계획서.md`(11장)에 정의된 저장소 구조를 코드로 구현한 것입니다.
이 리포지토리는 **반드시 Private**으로 유지하세요 — `content/**/*.json`에는 바이어 실명 원문(`target_buyer_raw`)이
검수 전 상태로 커밋 이력에 남을 수 있습니다 (3장·5장 참조).

## 구조

```
content/            # 5장 표준 스키마 기준 콘텐츠 (ko/en/vi × companies)
scripts/             # 4장 데이터 파이프라인 (sync.js, mask.js, validate.js, tag-admin-edit.js)
site/                # Astro 정적 사이트 (7장 기술스택)
  └─ public/admin/    # Decap CMS 관리자 페이지 (6.4·7.6절) — 배포 시 /admin 경로로 서빙됨
.github/workflows/    # sync.yml · admin-review.yml · content-check.yml · deploy.yml (11.3절)
```

## 로컬 개발

```bash
cd site
npm install
npm run dev      # http://localhost:4321/ko/ 로 리다이렉트됨
npm run build    # 정적 빌드 검증
```

파이프라인 스크립트(저장소 루트에서 실행):

```bash
npm install                 # 루트 package.json — googleapis, @anthropic-ai/sdk(선택 보강용)
node scripts/validate.js    # 자격증명 없이도 즉시 실행 가능 (PII·검수상태 정합성 점검)
node scripts/mask.js        # 자격증명 없이도 즉시 실행 가능 (정규식/매핑표 기반 참고용 제안)
node scripts/sync.js        # 구글 서비스 계정 키 + 시트 ID 필요 (.env.example 참조)
```

**바이어 마스킹은 기본적으로 API 키가 필요 없습니다.** 담당자가 관리자 페이지(`/admin`)에서
`target_buyer_display`를 직접 입력하는 것이 기본 설계이고(3.2절), `scripts/mask.js`는 정규식·업종
매핑표만으로 참고용 제안을 만들어줍니다. `LLM_API_KEY`(Anthropic API)를 설정하면 `mask.js`·`validate.js`가
더 나은 초안·재검증을 시도하지만, 없어도 파이프라인 전체가 정상 동작합니다(부록 B 항목 10-1 참조).

## 지금 바로 되는 것 / 아직 안 되는 것

| 구성 요소 | 상태 |
|---|---|
| Astro 사이트 (i18n, 홈/sector/기업상세/directory/about) | ✅ 동작 — 샘플 기업 3개(csec-01, env-01, cloud-01)로 빌드·검증 완료 |
| 클라이언트 검색/필터 | ✅ 동작 |
| `validate.js` (PII·검수상태 2차 안전장치) | ✅ 자격증명 없이 로컬 실행 가능, 오탐/미탐 테스트 완료 |
| `toPublicCompany()` 내부 필드 스트리핑 | ✅ 빌드된 HTML에 `target_buyer_raw` 등 미노출 확인 |
| `mask.js` 마스킹 참고 제안 (정규식/매핑표) | ✅ 자격증명 없이 로컬 실행 가능 — API는 선택적 보강일 뿐 |
| Decap CMS 관리자 페이지(`/admin`) | ⚠ 설정만 완료 — Netlify Identity/Git Gateway 활성화(부록 B #14) 전에는 로그인 불가 |
| `sync.js` (구글 시트 연동) | ⚠ 코드는 작성됨, 부록 B #1~4 자격증명 없이 실행 불가 — 미검증 |
| `mask.js`/`validate.js`의 LLM 선택적 보강 | ⚠ 코드는 작성됨, `LLM_API_KEY` 없이는 이 부분만 건너뜀(정상 동작) — 실제 LLM 응답은 미검증 |
| GitHub Actions 4종 | ⚠ 코드는 작성됨, 실제 GitHub 저장소·Secrets 등록 전에는 미검증 |

## 다음으로 사람이 해야 할 일 (부록 B 대응)

1. 이 폴더를 **Private** GitHub 저장소로 push
2. 부록 B 체크리스트 1~9, 11~13, 15번 순서로 자격증명·계정 확보 → GitHub Secrets 등록 (11.5절 목록 참조) — 10-1(LLM_API_KEY)은 선택 사항, 나중에 물량이 늘어나면 추가해도 됨
3. `site_url`, `admin/config.yml`의 `backend.repo` 등 리포지토리별 값 채우기
4. 브랜치 보호 규칙 설정 — `content-check.yml`의 check를 required status check로 등록 (11.2절)
5. `node scripts/sync.js` 1회 실행해 47개사 실데이터로 교체 (현재는 샘플 3개사만 있음)

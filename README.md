# TWIN BLOOMING | OEM Market Intelligence v7

프리미엄 전기차 OLED 수주 검토, 글로벌 OEM 지도, 공개 뉴스·특허 모니터링 웹앱. 공개 데이터와 프로젝트 추론을 구분합니다.

## 1. 로컬 실행 (Windows + VS Code)

1. 압축 해제 후 VS Code에서 폴더 열기 (원본 ZIP은 보관)
2. 터미널에서 `node --version` 확인 (Node.js 20 이상)
3. `npm run dev`
4. 브라우저에서 `http://127.0.0.1:4173/` 접속
5. `npm test`, `npm run check`로 검사

로컬 개발 서버는 localhost에서만 열리며, `/status`, `/alerts`, `/feed`, `/patents`와 동일한 Netlify 함수 경로를 지원합니다. 저장 상태는 `.local-data/`에 기록되고 Git에는 올라가지 않습니다. 일부 라이브 API는 인터넷 접속, 인증키 등이 없으면 사용 불가 상태를 표시합니다. 로컬에서 `npm run dev`를 실행하는 것만으로 외부 공개 서버가 생성되지는 않습니다.

## 2. 공개 배포 (GitHub + Netlify)

1. GitHub에 별도 **Public 저장소**를 만들고 이 프로젝트의 파일을 루트에 업로드 (`public`, `netlify`, `data`, `.github`, `netlify.toml`, `package.json` 등)
2. Netlify → Add new project → Import existing project → GitHub에서 저장소 연결
3. Publish directory = `public`, Functions directory = `netlify/functions`, build command = 비워두기 (정적 사이트)
4. 서버 함수 사용을 위해 Netlify가 dependency를 설치하게 `npm install` (Netlify에서 자동). Build command는 `npm run check`로 설정해도 되며 이때 dependencies install 필수.
5. Netlify 환경변수에 KIPRIS 및 EPO 승인키 등록. 키를 GitHub에 올리지 않기.
6. 실제 Netlify 공개 URL로 기본화면, `/.netlify/functions/status`, `/.netlify/functions/feed`, `/.netlify/functions/patents`, `/.netlify/functions/alerts` 검사
7. Netlify Functions의 1시간(뉴스), 6시간(특허) 스케줄 실행 및 Blobs 스냅샷 보존 여부 확인. 이메일은 Resend 인증 도메인과 환경변수가 필요.

## 보안·운영 설명

- `.env` 및 `.local-data`는 `.gitignore` 대상입니다. Public GitHub에 API 키를 입력하지 마세요.
- Netlify 무료/유료 플랜의 정기 함수/Blobs 사용 가능 여부, 외부 API 이용조건과 요청 제한을 확인해야 합니다.
- 신규 공개 자료 감지 주기는 1시간(뉴스), 6시간(특허)이며, 공급망/뉴스 검색 반영 지연이 있을 수 있습니다. 즉시 알림 보장은 하지 않습니다.
- 브라우저를 닫은 상태의 푸시 알림은 포함되지 않습니다. Resend 환경변수가 설정된 경우 지정한 수신자로 이메일 통지가 가능합니다.
- 공개 페이지의 평가 점수는 14팀 가설 점수이며 실측 수주확률, OEM 구매의향이나 실제 수율 지표가 아닙니다.
- KIPRISPlus와 EPO OPS 발급·승인은 사용자가 각각 신청해야 합니다. 본 프로젝트에는 어떠한 키도 포함되지 않습니다.

## 공개 전 확인

1. GitHub Actions `npm test` 결과
2. 지도 필터, 마커, 기업 검색, 고객 비교, CSV 내보내기
3. 실제 news, patent API 응답의 출처와 날짜
4. 수신자가 허용한 메일 주소와 Resend 발송 도메인
5. Netlify Deploy Status = Published 와 외부 브라우저 접속

외부 공개 URL은 실제 호스팅 배포 완료 시 Netlify에서 발급됩니다. 저장소 URL과 웹사이트 URL은 서로 다릅니다.

## Windows 원클릭 배포 스크립트

- `start-local.ps1`: Node 설치된 PC에서 로컬 웹서버만 실행. 외부 공개되지 않음.
- `publish-github.ps1`: `gh` GitHub CLI 로그인 확인, 사용자의 새 **Public** 저장소 생성, 첫 커밋 push. 기존 저장소가 있으면 덮어쓰지 않고 중단.
- `deploy-netlify.ps1`: 브라우저로 Netlify 인증 후 `netlify init`으로 새 사이트를 GitHub와 연결하고 프로덕션 배포. 첫 실행에 계정 권한 확인이 필요.
- `publish-all.ps1`: 위 GitHub/Netlify 스크립트를 순서대로 호출. 사용자 로그인·선택을 대신할 수 없으므로 완전 무인 실행은 아님.

PowerShell 보안 정책 때문에 스크립트 실행이 막히면 VS Code의 PowerShell 터미널에서 `powershell -NoProfile -ExecutionPolicy Bypass -File .\publish-all.ps1` 실행 가능하며, 먼저 스크립트를 검토하세요. GitHub CLI (`gh`)가 설치되지 않았다면 https://cli.github.com 에서 설치 후 `gh auth login`이 필요합니다. Netlify는 `npx`로 CLI를 다운로드하므로 PC 인터넷 연결이 필요합니다.

### 참고
수정된 코드가 공개 저장소에 업로드되더라도 기존 `chatgpt.site` 사이트와 Google My Maps는 변경하지 않습니다. 새 링크는 Netlify 최종 배포 성공 후 생성됩니다. KIPRIS/EPO API 승인 정보 미등록 시 특허 라이브 조회는 비활성 상태이고, 임의 데이터를 실시간 결과라고 표시하지 않습니다.

# 🎯 4DX WIG Tracker - Frontend

> **4 Disciplines of Execution** 기반 목표 관리 시스템의 React 클라이언트

[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646cff.svg)](https://vitejs.dev)

---

## 📋 목차

- [소개](#-소개)
- [기술 스택](#️-기술-스택)
- [시작하기](#-시작하기)
- [환경 변수](#-환경-변수)
- [인증 흐름](#-인증-흐름)
- [프로젝트 구조](#-프로젝트-구조)
- [화면 구성](#-화면-구성)
- [API 레이어](#-api-레이어)
- [핵심 도메인 규칙](#-핵심-도메인-규칙)
- [배포](#-배포)
- [알려진 이슈](#-알려진-이슈)

---

## 🎯 소개

백엔드([fdx-backend](https://github.com/stoic-warrior/fdx-backend))와 통신하며, 사용자가 자신의 WIG(가장 중요한 목표)를 등록하고 일간/주간 실적을 기록·시각화하는 SPA입니다.

- JWT 기반 인증 + 소셜 로그인(Google / Kakao / Naver)
- 사용자당 WIG 최대 2개
- Lead Measure별 일간 실적 입력, 주간 집계 차트, 연속달성(Streak) 표시

---

## 🛠️ 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| Framework | React 18 |
| Build | Vite 5 |
| HTTP | Axios (인터셉터로 JWT 자동 첨부) |
| Chart | Recharts |
| Icon | lucide-react |
| Style | **Tailwind CSS (CDN)** — `index.html`의 `cdn.tailwindcss.com` 스크립트 |
| Routing | 없음 (App.jsx의 탭 state 기반 단일 페이지) |

> ⚠️ Tailwind는 빌드 파이프라인이 아닌 **CDN 스크립트**로 로드됩니다. `package.json`에 tailwindcss 의존성이 없으며, PostCSS 설정도 없습니다. 운영에서 성능/커스터마이징이 필요해지면 빌드 설치로 전환이 필요합니다.

---

## 🚀 시작하기

### 요구 사항
- Node.js 18+
- 백엔드 서버 (http://localhost:8080)

```bash
# 1. 패키지 설치
npm install

# 2. 백엔드 실행 (별도 터미널)
cd ../fdx-backend && ./gradlew bootRun

# 3. 프론트 실행
npm run dev
```

→ http://localhost:5173 (`vite.config.js`에서 `open: true`이므로 브라우저 자동 실행)

### 명령어

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

---

## 🔑 환경 변수

| 변수 | 용도 | 미설정 시 |
|------|------|-----------|
| `VITE_API_BASE_URL` | REST API 베이스 URL | `''` (same-origin 상대경로) |
| `VITE_OAUTH_BASE_URL` | OAuth 인증 시작 URL (브라우저가 직접 이동하므로 프록시 불가) | `http://localhost:8080` |

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080

# .env.production
VITE_OAUTH_BASE_URL=http://3.27.147.163.nip.io:8080
```

> 운영에서는 `VITE_API_BASE_URL`이 비어 있어 API 호출이 **같은 오리진의 상대경로**로 나갑니다. 배포 플랫폼의 rewrite/proxy 설정에 의존하므로, 백엔드를 직접 호출하려면 `VITE_API_BASE_URL`을 명시해야 합니다.

---

## 🔐 인증 흐름

### 일반 로그인
```
LoginPage → authApi.login() → POST /api/auth/login
         → localStorage: accessToken, user
         → App: isAuthenticated = true
```

### 소셜 로그인
```
LoginPage 버튼 클릭
  → window.location = {VITE_OAUTH_BASE_URL}/oauth2/authorization/{google|kakao|naver}
  → (Provider 인증)
  → 백엔드 OAuth2SuccessHandler가 JWT 발급
  → 프론트로 리다이렉트: /?token=...&email=...&name=...&provider=...&profileImageUrl=...
  → App.jsx의 useEffect가 쿼리 파라미터를 파싱 → localStorage 저장 → history.replaceState로 URL 정리
```

> 라우터를 쓰지 않으므로 **OAuth 콜백 처리는 `App.jsx`가 직접** 수행합니다.

### 토큰 관리 (`api/client.js`)
- **요청 인터셉터**: `localStorage.accessToken`을 `Authorization: Bearer {token}` 헤더로 자동 첨부
- **응답 인터셉터**: 401 응답 시 토큰 삭제 → (`/api/auth/*` 요청이 아니면) 페이지 리로드하여 로그인 화면으로 복귀
- 타임아웃 10초

---

## 📁 프로젝트 구조

```
src/
├── api/                      # API 통신 레이어 (axios)
│   ├── client.js             # axios 인스턴스 + JWT/401 인터셉터
│   ├── authApi.js            # 로그인, 회원가입, 토큰 관리
│   ├── wigApi.js
│   ├── leadMeasureApi.js
│   ├── milestoneApi.js
│   ├── commitmentApi.js
│   ├── weeklyDataApi.js
│   └── dailyDataApi.js       # 일간 실적 + getStreak()
├── components/
│   ├── LoginPage.jsx         # 소셜 로그인 + (개발용) 테스트 계정 로그인
│   ├── OAuthCallback.jsx     # ⚠️ 현재 미사용 (아래 '알려진 이슈' 참고)
│   ├── Dashboard.jsx         # 진행률, Streak, 오늘 Lead Measure, 마일스톤
│   ├── Scoreboard.jsx        # 주간/일간 차트 + 일간 실적 입력 테이블
│   ├── Commitments.jsx       # 주간 약속 관리
│   └── WIGManagement.jsx     # WIG / Lead Measure / Milestone CRUD
├── utils/
│   └── weekUtils.js          # getLocalToday(), getCurrentWeek()
├── App.jsx                   # 인증 상태, OAuth 콜백, 헤더, 탭 네비게이션
└── main.jsx                  # 엔트리 포인트
```

---

## 🖥️ 화면 구성

앱은 라우팅 없이 **4개 탭**으로 구성됩니다 (`App.jsx`의 `activeTab` state).

| 탭 | 컴포넌트 | 내용 |
|----|----------|------|
| 대시보드 | `Dashboard` | Lag 진행률, 🔥 연속달성 일수, 현재 주차, 이번 주 약속 이행 현황, 오늘의 Lead Measure (MAXIMIZE는 프로그레스 바 / MINIMIZE는 미만·주의·초과 카드), 마일스톤 체크 |
| 스코어보드 | `Scoreboard` | 주간/일간 토글, 라인/바 차트 전환, 일간 실적 입력·수정 테이블, 주간 Lag 실적(actual) 입력 |
| 주간 약속 | `Commitments` | 주차별 약속 등록 / 완료 토글 / 이행률 |
| WIG 관리 | `WIGManagement` | WIG CRUD (2/2 제한 UI), Lead Measure CRUD, Milestone CRUD |

**상태 흐름**
- WIG 목록은 `App.jsx`가 소유하고 props로 내려줍니다. 하위에서 변경 시 `onWigChange()` → `loadWigs()` 재조회.
- Scoreboard에서 오늘 데이터가 바뀌면 `onTodayDataChange()` → `dashboardRefreshKey` 증가 → Dashboard 재조회.
- WIG이 0개면 탭 없이 `WIGManagement`의 생성 폼이 바로 열립니다 (`autoShowForm`).

---

## 🔌 API 레이어

모든 모듈은 `client.js`의 axios 인스턴스를 공유합니다.

| 모듈 | 주요 메서드 |
|------|-------------|
| `authApi` | `login`, `register`, `saveToken`, `getToken`, `removeToken`, `isLoggedIn` |
| `wigApi` | `getAll`, `getCount`, `create`, `update`, `delete` |
| `leadMeasureApi` | `getByWigId`, `create`, `update`, `delete` |
| `milestoneApi` | `getByWigId`, `getProgress`, `create`, `update`, `toggle`, `delete` |
| `commitmentApi` | `getByWigId`, `getByWigIdAndWeek`, `getCompletionRate`, `create`, `update`, `toggleCompleted`, `delete` |
| `weeklyDataApi` | `getByWigId`, `getByWigIdAndWeek`, `create`, `update`, `delete` |
| `dailyDataApi` | `getByWigId`, `getByWigIdAndWeek`, `getByDateRange`, `getStreak`, `create`, `update`, `delete` |

### 실적 데이터 형식

Lead Measure 실적은 백엔드 정규화 구조에 맞춰 **`leadValues` 맵**으로 주고받습니다.

```js
// 일간 실적 생성
await dailyDataApi.create({
  date: '2025-01-06',
  week: 'W1',
  dayOfWeek: '월',
  leadValues: { 1: 7.0, 2: 1.0 },  // { leadMeasureId: value }
  wigId: 1
});

// 조회 시에도 동일한 맵 형태
todayDailyData.leadValues[lead.id]
```

### Streak 응답

```js
{
  overallStreak: 3,   // 모든 Lead Measure를 동시에 달성한 연속 일수
  leadMeasureStreaks: [
    { leadMeasureId: 1, name: '코딩 시간', currentStreak: 5, direction: 'MAXIMIZE' }
  ]
}
```

---

## 📐 핵심 도메인 규칙

프론트 UI가 전제하는 규칙입니다 (백엔드와 동일).

| 항목 | 값 |
|------|-----|
| WIG 개수 | 사용자당 최대 **2개** (초과 시 추가 버튼 비활성) |
| WIG 타입 | `NUMERIC`(수치형, unit 필수) / `STATE`(상태형, 마일스톤 기반) |
| Lead Measure 개수 | WIG당 최대 **5개** |
| Lead Measure 방향 | `MAXIMIZE`(↑ 높을수록 좋음) / `MINIMIZE`(↓ 낮을수록 좋음) |
| Lead Measure 타입 | `NUMERIC` / `BOOLEAN`(O·X, 목표값·단위 자동 고정) |
| 진행률 | STATE = 완료 마일스톤 비율, NUMERIC = 최신 주간 actual 기준 |
| 일간 데이터 | WIG+날짜당 1건, **미래 날짜 입력 불가** |

---

## 🚢 배포

Vercel 등 정적 호스팅에 `npm run build` 결과(`dist/`)를 배포합니다.

배포 시 확인할 것:
1. `.env.production`에 `VITE_OAUTH_BASE_URL`(백엔드 주소) 설정
2. API를 백엔드로 직접 호출하려면 `VITE_API_BASE_URL`도 설정 (없으면 상대경로)
3. 백엔드 `SecurityConfig`의 CORS 허용 오리진과 `app.frontend-url`에 배포 도메인 등록

---

## ⚠️ 알려진 이슈

- **`OAuthCallback.jsx`는 현재 죽은 코드입니다.** `react-router-dom`을 import하지만 `package.json`에 해당 의존성이 없고, `main.jsx`/`App.jsx` 어디에서도 렌더링되지 않습니다. 게다가 토큰을 `localStorage.token`에 저장하는데, `client.js`는 `accessToken`을 읽습니다. → 삭제하거나, 라우터 도입 시 키를 맞춰야 합니다.
- **토큰 저장 위치가 localStorage**입니다. XSS에 노출되므로 필요 시 httpOnly 쿠키 방식 검토.
- **LoginPage의 테스트 계정 로그인 버튼**이 남아 있습니다 (개발 편의용). 운영 빌드에서 제거 여부 확인 필요.
- **Tailwind CDN 사용** — 프로덕션 권장 방식이 아닙니다.
- **일반 회원가입 UI가 없습니다.** `authApi.register`는 있지만 화면에서 호출하지 않습니다 (소셜 로그인 위주).
- **에러 처리가 `alert()` 위주**입니다. 토스트/인라인 메시지로 개선 여지가 있습니다.
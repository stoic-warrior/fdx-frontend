# 🎯 4DX WIG Tracker - Frontend

React 기반 4 Disciplines of Execution 목표 관리 시스템

## 🚀 시작하기

### 1. 패키지 설치
\`\`\`bash
npm install
\`\`\`

### 2. 백엔드 실행 확인
백엔드가 http://localhost:8080 에서 실행 중이어야 합니다.

\`\`\`bash
cd ../fdx-backend
./gradlew bootRun
\`\`\`

### 3. 프론트엔드 실행
\`\`\`bash
npm run dev
\`\`\`

http://localhost:5173 에서 앱이 실행됩니다.

## 📁 프로젝트 구조

\`\`\`
src/
├── api/              # API 통신 레이어
│   ├── client.js
│   ├── wigApi.js
│   ├── leadMeasureApi.js
│   ├── milestoneApi.js
│   ├── commitmentApi.js
│   ├── weeklyDataApi.js
│   └── dailyDataApi.js
├── components/       # React 컴포넌트
│   ├── Dashboard.jsx
│   ├── Scoreboard.jsx
│   ├── Commitments.jsx
│   └── WIGManagement.jsx
├── App.jsx          # 메인 앱
└── main.jsx         # 엔트리 포인트
\`\`\`

## 🛠️ 기술 스택

- React 18
- Vite
- Axios (API 통신)
- Recharts (차트)
- Lucide React (아이콘)
- Tailwind CSS (스타일링)

## 📌 주요 기능

1. **Dashboard** - WIG 진행률 대시보드
2. **Scoreboard** - Lag/Lead Measure 차트
3. **Commitments** - 주간 약속 관리
4. **WIG Management** - WIG 생성/수정/삭제

## 🔧 개발 명령어

\`\`\`bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 미리보기
\`\`\`

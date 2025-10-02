# 포커 핸드 로거 v2.0 - 설치 가이드

## 📋 목차

1. [사전 요구사항](#사전-요구사항)
2. [프로젝트 구조](#프로젝트-구조)
3. [설치 방법](#설치-방법)
4. [데이터베이스 설정](#데이터베이스-설정)
5. [개발 서버 실행](#개발-서버-실행)
6. [테스트](#테스트)
7. [문제 해결](#문제-해결)

---

## 사전 요구사항

### 필수 소프트웨어

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Docker** & **Docker Compose** (권장)
- **PostgreSQL** 16+ (Docker 사용 안할 경우)
- **Redis** 7+ (선택, 캐싱용)

### 설치 확인

```bash
node --version  # v18.0.0 이상
pnpm --version  # 8.0.0 이상
docker --version
docker-compose --version
```

### pnpm 설치 (없는 경우)

```bash
npm install -g pnpm
```

---

## 프로젝트 구조

```
poker-hand-logger-v2/
├── packages/
│   ├── shared/          # 공유 타입 & 유틸리티
│   │   ├── src/
│   │   │   ├── types.ts       # TypeScript 타입 정의
│   │   │   ├── constants.ts   # 상수
│   │   │   ├── utils.ts       # 유틸리티 함수
│   │   │   └── index.ts       # Entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── backend/         # Fastify API 서버
│   │   ├── src/
│   │   │   ├── index.ts       # 서버 Entry point
│   │   │   ├── config/        # 환경 설정
│   │   │   ├── routes/        # API 라우트
│   │   │   │   ├── tables.ts  # 테이블 API
│   │   │   │   ├── players.ts # 플레이어 API
│   │   │   │   └── hands.ts   # 핸드 API
│   │   │   └── services/      # 비즈니스 로직
│   │   ├── prisma/
│   │   │   └── schema.prisma  # 데이터베이스 스키마
│   │   ├── .env.example       # 환경변수 예시
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/        # React + Vite UI
│       ├── src/
│       │   ├── main.tsx       # React Entry point
│       │   ├── App.tsx        # 메인 컴포넌트
│       │   ├── components/    # React 컴포넌트
│       │   │   ├── TableList.tsx
│       │   │   ├── PlayerList.tsx
│       │   │   ├── CreateTableForm.tsx
│       │   │   └── CreatePlayerForm.tsx
│       │   ├── store/         # Zustand 상태 관리
│       │   │   └── index.ts
│       │   └── api/           # API 클라이언트
│       │       ├── client.ts  # Axios 설정
│       │       ├── tables.ts  # 테이블 API
│       │       ├── players.ts # 플레이어 API
│       │       └── hands.ts   # 핸드 API
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── package.json
│
├── docker-compose.yml   # PostgreSQL + Redis
├── pnpm-workspace.yaml  # 모노레포 설정
├── package.json         # 루트 패키지
└── README.md
```

---

## 설치 방법

### 1. 리포지토리 클론

```bash
git clone https://github.com/garimto81/poker-hand-logger-v2.git
cd poker-hand-logger-v2
```

### 2. 의존성 설치

```bash
# 모든 패키지 의존성 설치 (shared, backend, frontend)
pnpm install
```

**설치되는 패키지:**
- `packages/shared`: TypeScript, 공유 타입
- `packages/backend`: Fastify, Prisma, PostgreSQL client, Redis, Zod
- `packages/frontend`: React 18, Vite, Zustand, Axios, TailwindCSS

---

## 데이터베이스 설정

### Option 1: Docker Compose (권장)

```bash
# PostgreSQL + Redis 컨테이너 시작
pnpm docker:up

# 로그 확인
pnpm docker:logs

# 중지
pnpm docker:down

# 완전 초기화 (데이터 삭제 포함)
pnpm docker:reset
```

**접속 정보:**
- PostgreSQL: `localhost:5432`
  - Database: `poker_hand_logger`
  - User: `poker`
  - Password: `poker123`
- Redis: `localhost:6379`

### Option 2: 로컬 PostgreSQL

PostgreSQL을 직접 설치한 경우:

```bash
# 데이터베이스 생성
psql -U postgres
CREATE DATABASE poker_hand_logger;
CREATE USER poker WITH PASSWORD 'poker123';
GRANT ALL PRIVILEGES ON DATABASE poker_hand_logger TO poker;
\q
```

### Backend 환경변수 설정

```bash
cd packages/backend
cp .env.example .env
```

`.env` 파일 수정:

```env
DATABASE_URL="postgresql://poker:poker123@localhost:5432/poker_hand_logger?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:5173
```

### Prisma 마이그레이션

```bash
# Prisma Client 생성
pnpm prisma:generate

# 데이터베이스 마이그레이션 실행
pnpm prisma:migrate

# Prisma Studio 실행 (DB GUI)
pnpm prisma:studio
```

**Prisma Studio:** `http://localhost:5555`

---

## 개발 서버 실행

### 전체 실행 (Backend + Frontend 동시)

```bash
# 루트 디렉토리에서
pnpm dev
```

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- API Docs: `http://localhost:3000/health`

### 개별 실행

```bash
# Backend만 실행
pnpm dev:backend

# Frontend만 실행
pnpm dev:frontend
```

---

## 사용 방법

### 1. 프론트엔드 접속

브라우저에서 `http://localhost:5173` 열기

### 2. 테이블 생성

- "테이블 관리" 탭 선택
- 왼쪽 폼에서 테이블 정보 입력:
  - 테이블 이름: "Main Table"
  - 게임 타입: Cash Game
  - 스몰 블라인드: 1
  - 빅 블라인드: 2
  - 최대 인원: 10
- "테이블 생성" 버튼 클릭

### 3. 플레이어 추가

- "플레이어 관리" 탭 선택
- 왼쪽 폼에서 플레이어 정보 입력:
  - 플레이어 이름: "홍길동"
  - 이메일 (선택): hong@example.com
- "플레이어 추가" 버튼 클릭

### 4. API 테스트

**Postman/cURL 예시:**

```bash
# Health Check
curl http://localhost:3000/health

# 테이블 목록 조회
curl http://localhost:3000/api/tables

# 테이블 생성
curl -X POST http://localhost:3000/api/tables \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Table",
    "gameType": "CASH",
    "smallBlind": 1,
    "bigBlind": 2,
    "maxPlayers": 10
  }'

# 플레이어 목록 조회
curl http://localhost:3000/api/players

# 플레이어 생성
curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -d '{
    "name": "홍길동",
    "email": "hong@example.com"
  }'
```

---

## 빌드

### Production 빌드

```bash
# 전체 빌드 (shared → backend → frontend)
pnpm build

# 개별 빌드
pnpm build:shared
pnpm build:backend
pnpm build:frontend
```

### 빌드 결과물

- `packages/shared/dist/` - 컴파일된 TypeScript 타입
- `packages/backend/dist/` - 컴파일된 서버 코드
- `packages/frontend/dist/` - 정적 파일 (배포용)

### Production 실행

```bash
# Backend 프로덕션 모드
cd packages/backend
NODE_ENV=production node dist/index.js

# Frontend 프리뷰
cd packages/frontend
pnpm preview
```

---

## 테스트

```bash
# 전체 테스트
pnpm test

# 커버리지 포함
pnpm test:coverage
```

---

## 문제 해결

### 1. `pnpm install` 실패

**증상:** `ERR_PNPM_NO_MATCHING_VERSION`

**해결:**
```bash
pnpm store prune
pnpm install --force
```

### 2. Prisma 마이그레이션 실패

**증상:** `Error: P1001: Can't reach database server`

**해결:**
```bash
# Docker 컨테이너 상태 확인
docker ps

# PostgreSQL 재시작
pnpm docker:down
pnpm docker:up

# DATABASE_URL 확인
cat packages/backend/.env
```

### 3. Frontend 빌드 오류

**증상:** `Module not found: Error: Can't resolve '@poker-logger/shared'`

**해결:**
```bash
# Shared 패키지 먼저 빌드
pnpm build:shared

# 전체 재빌드
pnpm clean
pnpm install
pnpm build
```

### 4. CORS 오류

**증상:** `Access to fetch at 'http://localhost:3000/api/...' from origin 'http://localhost:5173' has been blocked by CORS`

**해결:**
```bash
# backend/.env 확인
CORS_ORIGIN=http://localhost:5173

# Vite proxy 설정 확인 (vite.config.ts)
server: {
  proxy: {
    '/api': 'http://localhost:3000'
  }
}
```

### 5. 포트 충돌

**증상:** `Error: listen EADDRINUSE: address already in use :::3000`

**해결:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

---

## 유용한 명령어

```bash
# Prisma Studio (DB GUI)
pnpm prisma:studio

# Docker 로그 실시간 확인
docker-compose logs -f postgres

# 데이터베이스 완전 초기화
pnpm docker:reset
pnpm prisma:migrate

# Node modules 완전 삭제 후 재설치
pnpm clean
pnpm install

# 코드 포맷팅
pnpm format

# Lint 검사
pnpm lint
```

---

## 다음 단계

설치가 완료되었다면:

1. [QUICK_START.md](./QUICK_START.md) - 10분 퀵스타트 가이드
2. [PROJECT_PROPOSAL.md](./PROJECT_PROPOSAL.md) - 프로젝트 전체 개요
3. [MIGRATION_FROM_V1.md](./MIGRATION_FROM_V1.md) - v1.0에서 마이그레이션

---

## 지원

- GitHub Issues: https://github.com/garimto81/poker-hand-logger-v2/issues
- Prisma 문서: https://www.prisma.io/docs
- Fastify 문서: https://www.fastify.io
- React 문서: https://react.dev

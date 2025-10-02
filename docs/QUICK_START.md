# Poker Hand Logger v2.0 - 빠른 시작 가이드

## 🎯 10분 안에 시작하기

이 가이드를 따라하면 10분 안에 개발 환경을 구축하고 첫 핸드를 추적할 수 있습니다.

---

## 📋 사전 요구사항

다음 도구들을 설치해주세요:

```bash
# Node.js 20+ (필수)
node --version  # v20.0.0 이상이어야 함

# pnpm 8+ (필수)
npm install -g pnpm
pnpm --version  # 8.0.0 이상이어야 함

# Docker & Docker Compose (권장)
docker --version
docker-compose --version
```

---

## 🚀 Step 1: 프로젝트 생성 (2분)

### Option A: 템플릿에서 생성 (권장)
```bash
# GitHub 템플릿 사용
git clone https://github.com/yourusername/poker-hand-logger-v2.git
cd poker-hand-logger-v2

# 의존성 설치
pnpm install
```

### Option B: 처음부터 생성
```bash
# 프로젝트 디렉토리 생성
mkdir poker-hand-logger-v2
cd poker-hand-logger-v2

# pnpm 초기화
pnpm init

# 워크스페이스 설정
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
EOF

# 패키지 구조 생성
mkdir -p packages/{frontend,backend,shared}/src
mkdir -p packages/backend/prisma
mkdir -p docs scripts
```

---

## 🗄️ Step 2: 데이터베이스 설정 (3분)

### Docker로 PostgreSQL & Redis 실행
```bash
# docker-compose.yml 생성
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: poker-postgres
    environment:
      POSTGRES_DB: poker_hand_logger
      POSTGRES_USER: poker
      POSTGRES_PASSWORD: poker123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U poker"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: poker-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
EOF

# 실행
docker-compose up -d

# 상태 확인
docker-compose ps
```

### Prisma 스키마 생성
```bash
cd packages/backend

# .env 파일 생성
cat > .env << 'EOF'
DATABASE_URL="postgresql://poker:poker123@localhost:5432/poker_hand_logger"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
NODE_ENV=development
EOF

# Prisma 초기화
pnpm add -D prisma
pnpm add @prisma/client
npx prisma init

# schema.prisma 작성 (다음 섹션 참조)
```

---

## 📝 Step 3: Prisma 스키마 작성 (2분)

`packages/backend/prisma/schema.prisma` 파일을 다음 내용으로 생성:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Street {
  PREFLOP
  FLOP
  TURN
  RIVER
}

enum ActionType {
  FOLD
  CHECK
  CALL
  BET
  RAISE
  ALL_IN
}

enum PlayerStatus {
  ACTIVE
  FOLDED
  ALL_IN
  OUT
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  players   Player[]
  tables    Table[]
}

model Table {
  id          String   @id @default(cuid())
  name        String
  maxPlayers  Int      @default(10)
  smallBlind  Decimal  @db.Decimal(10, 2)
  bigBlind    Decimal  @db.Decimal(10, 2)
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])
  hands       Hand[]
  players     Player[]

  @@index([userId])
}

model Player {
  id        String   @id @default(cuid())
  name      String
  userId    String
  tableId   String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  table     Table    @relation(fields: [tableId], references: [id])
  hands     PlayerInHand[]

  @@unique([userId, tableId, name])
  @@index([tableId])
}

model Hand {
  id          String   @id @default(cuid())
  tableId     String
  handNumber  Int
  street      Street   @default(PREFLOP)
  pot         Decimal  @default(0) @db.Decimal(10, 2)
  rake        Decimal  @default(0) @db.Decimal(10, 2)
  buttonSeat  Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  table       Table    @relation(fields: [tableId], references: [id])
  players     PlayerInHand[]
  actions     Action[]
  boardCards  BoardCard[]

  @@unique([tableId, handNumber])
  @@index([tableId])
  @@index([createdAt])
}

model PlayerInHand {
  id          String        @id @default(cuid())
  handId      String
  playerId    String
  seat        Int
  startChips  Decimal       @db.Decimal(10, 2)
  endChips    Decimal       @db.Decimal(10, 2)
  status      PlayerStatus  @default(ACTIVE)
  cards       String[]      @default([])

  hand        Hand          @relation(fields: [handId], references: [id], onDelete: Cascade)
  player      Player        @relation(fields: [playerId], references: [id])
  actions     Action[]

  @@unique([handId, playerId])
  @@index([handId])
  @@index([playerId])
}

model Action {
  id              String     @id @default(cuid())
  handId          String
  playerInHandId  String
  street          Street
  type            ActionType
  amount          Decimal?   @db.Decimal(10, 2)
  order           Int
  createdAt       DateTime   @default(now())

  hand            Hand       @relation(fields: [handId], references: [id], onDelete: Cascade)
  playerInHand    PlayerInHand @relation(fields: [playerInHandId], references: [id])

  @@index([handId, street])
  @@index([playerInHandId])
}

model BoardCard {
  id        String   @id @default(cuid())
  handId    String
  street    Street
  card      String
  order     Int

  hand      Hand     @relation(fields: [handId], references: [id], onDelete: Cascade)

  @@unique([handId, street, order])
  @@index([handId])
}
```

### 마이그레이션 실행
```bash
# Prisma 마이그레이션
npx prisma migrate dev --name init

# Prisma Client 생성
npx prisma generate

# 성공 메시지 확인
# ✅ Your database is now in sync with your Prisma schema.
```

---

## 🎨 Step 4: 백엔드 설정 (2분)

### package.json 생성
```bash
cd packages/backend

cat > package.json << 'EOF'
{
  "name": "@poker/backend",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@fastify/cors": "^9.0.1",
    "@fastify/helmet": "^11.1.1",
    "@fastify/jwt": "^8.0.1",
    "@fastify/rate-limit": "^9.1.0",
    "@prisma/client": "^5.8.0",
    "fastify": "^4.26.0",
    "ioredis": "^5.3.2",
    "socket.io": "^4.6.1",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "prisma": "^5.8.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"
  }
}
EOF

pnpm install
```

### 간단한 서버 생성
```bash
cat > src/index.ts << 'EOF'
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';

const server = Fastify({
  logger: true
});

// 미들웨어
await server.register(cors);
await server.register(helmet);

// 헬스 체크
server.get('/health', async () => {
  return { status: 'ok', version: '2.0.0' };
});

// 서버 시작
const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Server running on http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
EOF
```

### 백엔드 실행
```bash
pnpm dev

# 출력:
# 🚀 Server running on http://localhost:3000

# 다른 터미널에서 테스트
curl http://localhost:3000/health
# {"status":"ok","version":"2.0.0"}
```

---

## ⚛️ Step 5: 프론트엔드 설정 (1분)

### Vite + React 프로젝트 생성
```bash
cd packages/frontend

# package.json 생성
cat > package.json << 'EOF'
{
  "name": "@poker/frontend",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.7",
    "@tanstack/react-query": "^5.17.15",
    "socket.io-client": "^4.6.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.11",
    "vitest": "^1.2.0"
  }
}
EOF

pnpm install

# vite.config.ts 생성
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
EOF

# 간단한 App 생성
mkdir -p src
cat > src/App.tsx << 'EOF'
import { useState, useEffect } from 'react';

export default function App() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealth(data));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>🃏 Poker Hand Logger v2.0</h1>
      <p>Backend Health: {health ? JSON.stringify(health) : 'Loading...'}</p>
    </div>
  );
}
EOF

cat > src/main.tsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Poker Hand Logger v2.0</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF
```

### 프론트엔드 실행
```bash
pnpm dev

# 출력:
# VITE v5.0.11  ready in 500 ms
# ➜  Local:   http://localhost:5173/
```

브라우저에서 `http://localhost:5173` 접속 → "Backend Health: {status: 'ok'}" 확인 ✅

---

## 🎉 완료!

축하합니다! 이제 다음이 실행되고 있습니다:

- ✅ PostgreSQL (port 5432)
- ✅ Redis (port 6379)
- ✅ Backend API (port 3000)
- ✅ Frontend (port 5173)

---

## 📚 다음 단계

### 1. 첫 핸드 생성하기
```bash
curl -X POST http://localhost:3000/api/hands \
  -H "Content-Type: application/json" \
  -d '{
    "tableId": "test-table",
    "handNumber": 1,
    "smallBlind": 1,
    "bigBlind": 2
  }'
```

### 2. API 문서 읽기
- [docs/API.md](./API.md) - 전체 API 엔드포인트
- [docs/ARCHITECTURE.md](./ARCHITECTURE.md) - 시스템 아키텍처

### 3. 기능 개발하기
- [docs/DEVELOPMENT.md](./DEVELOPMENT.md) - 개발 가이드
- [docs/CONTRIBUTING.md](./CONTRIBUTING.md) - 기여 가이드

### 4. 테스트 작성하기
```bash
# 백엔드 테스트
cd packages/backend
pnpm test

# 프론트엔드 테스트
cd packages/frontend
pnpm test
```

---

## 🐛 문제 해결

### PostgreSQL 연결 실패
```bash
# Docker 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs postgres

# 재시작
docker-compose restart postgres
```

### 포트 충돌
```bash
# 사용 중인 포트 확인 (Windows)
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# 프로세스 종료
taskkill /PID [PID번호] /F
```

### Prisma 마이그레이션 실패
```bash
# 데이터베이스 리셋
npx prisma migrate reset

# 다시 마이그레이션
npx prisma migrate dev
```

---

## 💬 도움말

막히는 부분이 있나요?

- 📧 Email: support@poker-hand-logger.com
- 💬 Discord: [Join our server](https://discord.gg/poker)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/poker-hand-logger-v2/issues)

---

**Happy Coding! 🃏**

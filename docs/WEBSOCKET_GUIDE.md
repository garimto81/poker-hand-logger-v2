# WebSocket 실시간 통신 가이드

**버전**: v2.0
**기술**: Socket.io
**구현 일자**: 2025-10-02

---

## 📡 개요

포커 핸드 로거 v2.0은 Socket.io를 사용하여 실시간 양방향 통신을 지원합니다.
핸드 생성, 액션 추가, 테이블 업데이트 등의 이벤트가 모든 연결된 클라이언트에게 실시간으로 브로드캐스트됩니다.

### 주요 기능

- ✅ 실시간 핸드 업데이트
- ✅ 액션 추가 즉시 반영
- ✅ 테이블별 룸 기반 브로드캐스트
- ✅ 자동 재연결 (최대 5회 시도)
- ✅ 연결 상태 표시

---

## 🏗️ 아키텍처

```
┌─────────────┐         WebSocket        ┌─────────────┐
│   Client A  │ <──────────────────────> │             │
├─────────────┤                           │             │
│   Client B  │ <──────────────────────> │   Server    │
├─────────────┤                           │  (Fastify)  │
│   Client C  │ <──────────────────────> │             │
└─────────────┘                           └─────────────┘
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │   Prisma    │
                                          │  (Database) │
                                          └─────────────┘
```

### 데이터 흐름

1. **클라이언트** → API로 핸드 생성 요청
2. **서버** → 데이터베이스에 저장
3. **서버** → WebSocket으로 모든 클라이언트에게 브로드캐스트
4. **클라이언트들** → 실시간 UI 업데이트

---

## 🔌 Backend (Fastify + Socket.io)

### 1. 서버 초기화

**파일**: `packages/backend/src/index.ts`

```typescript
import { initializeSocketService } from './services/socket';

async function start() {
  // HTTP 서버 시작
  await fastify.listen({ port: 3000, host: '0.0.0.0' });

  // WebSocket 초기화
  const socketService = initializeSocketService(fastify.server);
  fastify.log.info('🔌 WebSocket server initialized');
}
```

### 2. WebSocket 서비스

**파일**: `packages/backend/src/services/socket.ts`

```typescript
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class SocketService {
  private io: SocketIOServer;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/socket.io'
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // 테이블 룸 참가
      socket.on('table:join', (tableId: string) => {
        socket.join(`table:${tableId}`);
      });

      // 테이블 룸 떠나기
      socket.on('table:leave', (tableId: string) => {
        socket.leave(`table:${tableId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  // 핸드 생성 브로드캐스트
  public broadcastHandCreated(tableId: string, hand: any) {
    this.io.to(`table:${tableId}`).emit('hand:created', {
      hand,
      timestamp: new Date()
    });
  }

  // 핸드 업데이트 브로드캐스트
  public broadcastHandUpdated(tableId: string, hand: any) {
    this.io.to(`table:${tableId}`).emit('hand:updated', {
      hand,
      timestamp: new Date()
    });
  }

  // 액션 추가 브로드캐스트
  public broadcastActionAdded(tableId: string, handId: string, action: any) {
    this.io.to(`table:${tableId}`).emit('action:added', {
      handId,
      action,
      timestamp: new Date()
    });
  }
}
```

### 3. API 라우트에서 사용

**파일**: `packages/backend/src/routes/hands.ts`

```typescript
import { getSocketService } from '../services/socket';

// POST /api/hands
fastify.post('/', async (request, reply) => {
  const hand = await prisma.hand.create({ /* ... */ });

  // WebSocket 브로드캐스트
  try {
    const socketService = getSocketService();
    socketService.broadcastHandCreated(hand.tableId, hand);
  } catch (err) {
    fastify.log.warn('WebSocket broadcast failed:', err);
  }

  return reply.status(201).send({ success: true, data: hand });
});
```

---

## 💻 Frontend (React + Socket.io-client)

### 1. WebSocket 클라이언트 서비스

**파일**: `packages/frontend/src/services/socket.ts`

```typescript
import { io, Socket } from 'socket.io-client';

class SocketClient {
  private socket: Socket | null = null;

  connect(url: string = 'http://localhost:3000') {
    this.socket = io(url, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.setupEventHandlers();
    return this.socket;
  }

  private setupEventHandlers() {
    this.socket?.on('connect', () => {
      console.log('[WebSocket] Connected');
    });

    this.socket?.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
    });
  }

  // 테이블 룸 참가
  joinTable(tableId: string) {
    this.socket?.emit('table:join', tableId);
  }

  // 테이블 룸 떠나기
  leaveTable(tableId: string) {
    this.socket?.emit('table:leave', tableId);
  }

  // 이벤트 리스너
  onHandCreated(callback: (data: any) => void) {
    this.socket?.on('hand:created', callback);
  }

  onHandUpdated(callback: (data: any) => void) {
    this.socket?.on('hand:updated', callback);
  }

  onActionAdded(callback: (data: any) => void) {
    this.socket?.on('action:added', callback);
  }
}

const socketClient = new SocketClient();
export default socketClient;
```

### 2. React 컴포넌트에서 사용

**파일**: `packages/frontend/src/App.tsx`

```typescript
import { useEffect, useState } from 'react';
import socketClient from './services/socket';

function App() {
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    // WebSocket 연결
    socketClient.connect('http://localhost:3000');
    setWsConnected(true);

    // 핸드 생성 이벤트 리스너
    socketClient.onHandCreated((data) => {
      console.log('Hand created:', data);
      // UI 업데이트 로직
    });

    // 핸드 업데이트 이벤트 리스너
    socketClient.onHandUpdated((data) => {
      console.log('Hand updated:', data);
      // UI 업데이트 로직
    });

    // 액션 추가 이벤트 리스너
    socketClient.onActionAdded((data) => {
      console.log('Action added:', data);
      // UI 업데이트 로직
    });

    // 정리
    return () => {
      socketClient.disconnect();
      setWsConnected(false);
    };
  }, []);

  return (
    <div>
      {/* 연결 상태 표시 */}
      <div className={wsConnected ? 'bg-green-400' : 'bg-red-400'}>
        {wsConnected ? '실시간 연결됨' : '연결 끊김'}
      </div>
    </div>
  );
}
```

---

## 📋 이벤트 목록

### Server → Client 이벤트

| 이벤트 | 페이로드 | 설명 |
|---|---|---|
| `hand:created` | `{ hand, timestamp }` | 새 핸드 생성됨 |
| `hand:updated` | `{ hand, timestamp }` | 핸드 업데이트됨 |
| `action:added` | `{ handId, action, timestamp }` | 액션 추가됨 |
| `hand:completed` | `{ handId, result, timestamp }` | 핸드 완료됨 |
| `table:updated` | `{ table, timestamp }` | 테이블 업데이트됨 |
| `user:joined` | `{ socketId, tableId, timestamp }` | 사용자 입장 |
| `user:left` | `{ socketId, tableId, timestamp }` | 사용자 퇴장 |

### Client → Server 이벤트

| 이벤트 | 페이로드 | 설명 |
|---|---|---|
| `table:join` | `tableId: string` | 테이블 룸 참가 |
| `table:leave` | `tableId: string` | 테이블 룸 떠나기 |

---

## 🧪 테스트

### 브라우저 콘솔에서 테스트

```javascript
// WebSocket 연결 확인
socketClient.isConnected(); // true

// 테이블 룸 참가
socketClient.joinTable('table-id-123');

// 핸드 생성 이벤트 리스너
socketClient.onHandCreated((data) => {
  console.log('Received hand created:', data);
});

// API로 핸드 생성 → WebSocket 이벤트 발생 확인
fetch('http://localhost:3000/api/hands', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ /* hand data */ })
});
```

### cURL로 테스트

```bash
# 핸드 생성 → WebSocket 이벤트 브로드캐스트
curl -X POST http://localhost:3000/api/hands \
  -H "Content-Type: application/json" \
  -d '{
    "tableId": "table-123",
    "handNumber": 1,
    "players": [...]
  }'

# 브라우저 콘솔에서 'hand:created' 이벤트 수신 확인
```

---

## 🐛 문제 해결

### 1. 연결 실패

**증상**: WebSocket 연결이 계속 실패

**해결**:
```typescript
// CORS 설정 확인
const socketService = new SocketIOServer(httpServer, {
  cors: {
    origin: 'http://localhost:5173',  // 프론트엔드 URL
    credentials: true
  }
});
```

### 2. 이벤트 수신 안됨

**증상**: 이벤트를 emit했지만 클라이언트가 수신하지 못함

**해결**:
```typescript
// 1. 룸 참가 확인
socketClient.joinTable(tableId);

// 2. 리스너 등록 확인
socketClient.onHandCreated((data) => {
  console.log('Received:', data);
});

// 3. 서버 로그 확인
fastify.log.info('Broadcasting to room:', tableId);
```

### 3. 재연결 실패

**증상**: 연결이 끊긴 후 재연결되지 않음

**해결**:
```typescript
// reconnection 옵션 확인
const socket = io(url, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});
```

---

## 📊 성능 고려사항

### 1. 룸 기반 브로드캐스트

```typescript
// ❌ 나쁜 예: 모든 클라이언트에게 브로드캐스트
this.io.emit('hand:created', hand);

// ✅ 좋은 예: 특정 테이블 룸에만 브로드캐스트
this.io.to(`table:${tableId}`).emit('hand:created', hand);
```

### 2. 이벤트 스로틀링

```typescript
import { throttle } from '@poker-logger/shared';

// 1초에 최대 1회만 브로드캐스트
const throttledBroadcast = throttle((data) => {
  this.io.to(`table:${tableId}`).emit('hand:updated', data);
}, 1000);
```

### 3. 페이로드 최소화

```typescript
// ❌ 나쁜 예: 전체 객체 전송
socketService.broadcastHandUpdated(tableId, fullHandObject);

// ✅ 좋은 예: 필요한 필드만 전송
socketService.broadcastHandUpdated(tableId, {
  id: hand.id,
  pot: hand.pot,
  street: hand.street
});
```

---

## 🔐 보안

### 1. 인증

```typescript
// JWT 토큰 검증
this.io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (verifyToken(token)) {
    next();
  } else {
    next(new Error('Authentication failed'));
  }
});
```

### 2. 권한 확인

```typescript
// 테이블 접근 권한 확인
socket.on('table:join', async (tableId) => {
  const hasAccess = await checkTableAccess(socket.userId, tableId);
  if (hasAccess) {
    socket.join(`table:${tableId}`);
  } else {
    socket.emit('error', { message: 'Access denied' });
  }
});
```

---

## 📚 참고 자료

- [Socket.io 공식 문서](https://socket.io/docs/)
- [Fastify Socket.io 플러그인](https://github.com/fastify/fastify-socket.io)
- [React with Socket.io](https://socket.io/how-to/use-with-react)

---

**작성일**: 2025-10-02
**작성자**: Claude Code
**버전**: v2.0

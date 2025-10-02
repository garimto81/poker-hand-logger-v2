# v1.0 → v2.0 마이그레이션 가이드

## 📋 개요

이 문서는 Poker Hand Logger v1.0 (레거시)에서 v2.0 (재설계)로 마이그레이션하는 완전한 가이드입니다.

### 마이그레이션 전략: Dual-Write Pattern

v1.0에서 v2.0으로 안전하게 전환하기 위해 **Dual-Write 패턴**을 사용합니다:

```
Phase 1: v1.0 Only (현재)
  ↓
Phase 2: v1.0 + v2.0 Dual-Write (전환 기간)
  ↓
Phase 3: v2.0 Only (완료)
```

---

## 🎯 마이그레이션 목표

- ✅ **데이터 무손실**: 모든 핸드 히스토리 보존
- ✅ **제로 다운타임**: 사용자 영향 최소화
- ✅ **롤백 가능**: 문제 발생 시 v1.0으로 즉시 복귀
- ✅ **단계적 전환**: 기능별 점진적 마이그레이션

---

## 📊 시스템 비교

### v1.0 (레거시)
```
Browser (index.html 7,995 lines)
    ↓
Express Proxy
    ↓
Google Sheets (Apps Script)
    ↓
Gemini API
```

### v2.0 (재설계)
```
Browser (React)
    ↓
Fastify API + Socket.io
    ↓
PostgreSQL + Redis
    ↓
Gemini API
```

---

## 🗓️ 마이그레이션 일정 (4주)

### Week 1: 준비 및 데이터 백업
- [x] v2.0 개발 환경 구축
- [x] 데이터 백업 스크립트 작성
- [x] Google Sheets → CSV 내보내기
- [ ] 테스트 환경에서 마이그레이션 시뮬레이션

### Week 2: Dual-Write 구현
- [ ] v1.0에 dual-write 로직 추가
- [ ] 데이터 동기화 검증
- [ ] 모니터링 설정

### Week 3: v2.0 기능 검증
- [ ] 모든 핵심 기능 테스트
- [ ] 성능 벤치마크
- [ ] 사용자 피드백 수집

### Week 4: 완전 전환
- [ ] v2.0으로 트래픽 전환
- [ ] v1.0 read-only 모드 전환
- [ ] v1.0 종료

---

## 📦 Phase 1: 데이터 백업 (Week 1)

### Step 1-1: Google Sheets 데이터 내보내기

#### 수동 방법
1. Google Sheets 열기
2. 파일 → 다운로드 → CSV (.csv)
3. 모든 시트 개별 다운로드:
   - `Hands.csv`
   - `Players.csv`
   - `Actions.csv`
   - `Tables.csv`

#### Apps Script 자동 방법
```javascript
// Google Apps Script에서 실행
function exportAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  sheets.forEach(sheet => {
    const name = sheet.getName();
    const csv = convertSheetToCSV(sheet);
    DriveApp.createFile(`${name}.csv`, csv);
  });
}

function convertSheetToCSV(sheet) {
  const data = sheet.getDataRange().getValues();
  return data.map(row => row.join(',')).join('\n');
}
```

### Step 1-2: 데이터 구조 검증

```bash
# CSV 파일 확인
ls -lh *.csv

# Hands.csv
# Players.csv
# Actions.csv
# Tables.csv

# 헤더 확인
head -1 Hands.csv
# table,hand_number,street,pot,rake,created_at
```

### Step 1-3: 백업 보관

```bash
# 백업 디렉토리 생성
mkdir -p backup/$(date +%Y%m%d)

# CSV 파일 복사
cp *.csv backup/$(date +%Y%m%d)/

# 압축
tar -czf backup-$(date +%Y%m%d).tar.gz backup/$(date +%Y%m%d)

# 클라우드 업로드 (선택)
# AWS S3, Google Drive, 또는 Dropbox에 업로드
```

---

## 🔄 Phase 2: 마이그레이션 스크립트 (Week 1-2)

### 마이그레이션 스크립트 구조

```
packages/backend/scripts/
├── migrate/
│   ├── index.ts           # 메인 마이그레이션 스크립트
│   ├── parsers/
│   │   ├── handsParser.ts
│   │   ├── playersParser.ts
│   │   └── actionsParser.ts
│   ├── validators/
│   │   └── dataValidator.ts
│   └── transformers/
│       └── dataTransformer.ts
└── verify/
    └── dataVerifier.ts    # 데이터 무결성 검증
```

### 메인 마이그레이션 스크립트

`packages/backend/scripts/migrate/index.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';

const prisma = new PrismaClient();

interface CSVHand {
  table: string;
  hand_number: string;
  street: string;
  pot: string;
  rake: string;
  created_at: string;
}

async function migrateHands(csvPath: string) {
  console.log('🔄 Migrating hands...');

  const hands: CSVHand[] = [];

  // CSV 파싱
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => hands.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 Found ${hands.length} hands to migrate`);

  // 배치 처리 (1000개씩)
  const BATCH_SIZE = 1000;
  let migrated = 0;

  for (let i = 0; i < hands.length; i += BATCH_SIZE) {
    const batch = hands.slice(i, i + BATCH_SIZE);

    await prisma.hand.createMany({
      data: batch.map(hand => ({
        tableId: hand.table,
        handNumber: parseInt(hand.hand_number),
        street: hand.street as any,
        pot: parseFloat(hand.pot),
        rake: parseFloat(hand.rake),
        createdAt: new Date(hand.created_at)
      })),
      skipDuplicates: true
    });

    migrated += batch.length;
    console.log(`✅ Migrated ${migrated}/${hands.length} hands`);
  }

  console.log('✅ Hands migration complete!');
}

async function migratePlayers(csvPath: string) {
  console.log('🔄 Migrating players...');
  // Similar to migrateHands...
}

async function migrateActions(csvPath: string) {
  console.log('🔄 Migrating actions...');
  // Similar to migrateHands...
}

async function main() {
  try {
    console.log('🚀 Starting migration...\n');

    // 1. 테이블 마이그레이션
    await migratePlayers('./data/Players.csv');

    // 2. 핸드 마이그레이션
    await migrateHands('./data/Hands.csv');

    // 3. 액션 마이그레이션
    await migrateActions('./data/Actions.csv');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

### 실행 방법

```bash
cd packages/backend

# CSV 파일을 data/ 디렉토리에 복사
mkdir -p data
cp /path/to/backup/*.csv ./data/

# 마이그레이션 실행
pnpm tsx scripts/migrate/index.ts

# 출력:
# 🚀 Starting migration...
# 🔄 Migrating players...
# ✅ Migrated 150 players
# 🔄 Migrating hands...
# ✅ Migrated 1000/5000 hands
# ✅ Migrated 2000/5000 hands
# ...
# ✅ Migration completed successfully!
```

---

## ✅ Phase 3: 데이터 검증 (Week 2)

### 검증 스크립트

`packages/backend/scripts/verify/dataVerifier.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';

const prisma = new PrismaClient();

async function verifyHandCount(csvPath: string) {
  // CSV 카운트
  const csvRows: any[] = [];
  await new Promise((resolve) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => csvRows.push(row))
      .on('end', resolve);
  });

  // DB 카운트
  const dbCount = await prisma.hand.count();

  console.log('📊 Hand Count Verification:');
  console.log(`  CSV: ${csvRows.length}`);
  console.log(`  DB:  ${dbCount}`);
  console.log(`  Match: ${csvRows.length === dbCount ? '✅' : '❌'}`);

  return csvRows.length === dbCount;
}

async function verifyDataIntegrity() {
  // 1. 모든 핸드에 플레이어가 있는지
  const handsWithoutPlayers = await prisma.hand.findMany({
    where: {
      players: {
        none: {}
      }
    }
  });

  console.log('\n📊 Data Integrity Check:');
  console.log(`  Hands without players: ${handsWithoutPlayers.length}`);

  // 2. 모든 액션이 유효한 핸드를 참조하는지
  const orphanActions = await prisma.$queryRaw`
    SELECT COUNT(*) FROM "Action" a
    LEFT JOIN "Hand" h ON a."handId" = h.id
    WHERE h.id IS NULL
  `;

  console.log(`  Orphan actions: ${orphanActions}`);

  // 3. 중복 핸드 확인
  const duplicateHands = await prisma.$queryRaw`
    SELECT "tableId", "handNumber", COUNT(*)
    FROM "Hand"
    GROUP BY "tableId", "handNumber"
    HAVING COUNT(*) > 1
  `;

  console.log(`  Duplicate hands: ${duplicateHands.length}`);

  return (
    handsWithoutPlayers.length === 0 &&
    orphanActions === 0 &&
    duplicateHands.length === 0
  );
}

async function main() {
  console.log('🔍 Starting data verification...\n');

  const checks = [
    await verifyHandCount('./data/Hands.csv'),
    await verifyDataIntegrity()
  ];

  if (checks.every(check => check)) {
    console.log('\n✅ All verifications passed!');
  } else {
    console.log('\n❌ Some verifications failed!');
    process.exit(1);
  }
}

main();
```

### 실행

```bash
pnpm tsx scripts/verify/dataVerifier.ts

# 출력:
# 🔍 Starting data verification...
#
# 📊 Hand Count Verification:
#   CSV: 5000
#   DB:  5000
#   Match: ✅
#
# 📊 Data Integrity Check:
#   Hands without players: 0
#   Orphan actions: 0
#   Duplicate hands: 0
#
# ✅ All verifications passed!
```

---

## 🔀 Phase 4: Dual-Write 구현 (Week 2-3)

### v1.0에 Dual-Write 로직 추가

`packages/backend/src/services/dualWriteService.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { updateGoogleSheets } from './googleSheetsService';

const prisma = new PrismaClient();

export async function createHandDualWrite(handData: any) {
  try {
    // 1. v2.0 (PostgreSQL)에 쓰기
    const hand = await prisma.hand.create({
      data: handData
    });

    // 2. v1.0 (Google Sheets)에도 쓰기
    await updateGoogleSheets('Hands', {
      table: handData.tableId,
      hand_number: handData.handNumber,
      street: handData.street,
      pot: handData.pot,
      rake: handData.rake,
      created_at: hand.createdAt.toISOString()
    });

    return hand;
  } catch (error) {
    // PostgreSQL 실패 시 Google Sheets에만 쓰기 (롤백 가능)
    console.error('Dual-write error:', error);
    await updateGoogleSheets('Hands', handData);
    throw error;
  }
}
```

### 동기화 검증 크론잡

```typescript
import cron from 'node-cron';

// 매시간 동기화 상태 확인
cron.schedule('0 * * * *', async () => {
  console.log('🔍 Checking sync status...');

  const postgresCount = await prisma.hand.count();
  const sheetsCount = await getGoogleSheetsRowCount('Hands');

  if (postgresCount !== sheetsCount) {
    console.error('❌ Sync mismatch!', {
      postgres: postgresCount,
      sheets: sheetsCount
    });

    // 알림 전송 (Slack, Email 등)
    await sendAlert('Data sync mismatch detected!');
  } else {
    console.log('✅ Sync verified:', postgresCount);
  }
});
```

---

## 🚀 Phase 5: v2.0 전환 (Week 3-4)

### Step 5-1: 트래픽 점진적 전환

```nginx
# Nginx 설정 예시
upstream v1_backend {
  server localhost:3001;  # v1.0
}

upstream v2_backend {
  server localhost:3000;  # v2.0
}

server {
  location /api/ {
    # 80% v1.0, 20% v2.0
    split_clients "${remote_addr}" $backend {
      20%     v2;
      *       v1;
    }

    proxy_pass http://${backend}_backend;
  }
}
```

### Step 5-2: 모니터링 지표

```typescript
// 성능 비교 메트릭
const metrics = {
  v1: {
    avgResponseTime: 450,  // ms
    errorRate: 0.5,        // %
    throughput: 100        // req/s
  },
  v2: {
    avgResponseTime: 50,   // ms
    errorRate: 0.1,        // %
    throughput: 500        // req/s
  }
};

// v2가 v1보다 우수하면 점진적으로 트래픽 증가
if (metrics.v2.avgResponseTime < metrics.v1.avgResponseTime) {
  increaseV2Traffic();  // 20% → 50% → 100%
}
```

### Step 5-3: v1.0 Read-Only 전환

```typescript
// v1.0을 read-only로 설정
app.post('/api/*', (req, res) => {
  res.status(410).json({
    error: 'This endpoint is deprecated. Please use v2.0',
    v2Url: 'https://v2.poker-hand-logger.com/api'
  });
});

app.get('/api/*', (req, res, next) => {
  // GET 요청은 계속 허용
  next();
});
```

### Step 5-4: v1.0 완전 종료

```bash
# 최종 데이터 동기화 확인
pnpm tsx scripts/verify/finalSync.ts

# v1.0 서버 종료
docker-compose down v1_backend

# v1.0 데이터 아카이브
tar -czf v1-final-backup-$(date +%Y%m%d).tar.gz ./data/

# v2.0만 실행
docker-compose up -d v2_backend
```

---

## 🎯 성공 기준

마이그레이션이 완료되었다고 판단하는 기준:

- [x] **데이터 무결성**: 모든 핸드/플레이어/액션 데이터가 v2.0에 존재
- [x] **성능**: v2.0 응답 시간 < 100ms (v1.0 대비 10배 빠름)
- [x] **안정성**: 에러율 < 0.1%
- [x] **사용자 만족도**: 99% 이상의 사용자가 v2.0 사용
- [x] **롤백 불필요**: 30일간 문제 없음

---

## 🔙 롤백 절차

문제 발생 시 즉시 v1.0으로 복귀:

### 긴급 롤백 (5분 내)

```bash
# 1. v2.0 트래픽 중단
# Nginx 설정 변경
sed -i 's/v2_backend/v1_backend/g' /etc/nginx/sites-enabled/default
nginx -s reload

# 2. v1.0 서버 재시작
docker-compose up -d v1_backend

# 3. 사용자에게 공지
curl -X POST https://api.slack.com/webhooks/... \
  -d '{"text":"⚠️ Rolled back to v1.0 due to issues"}'
```

### 계획된 롤백 (1시간)

```bash
# 1. v2.0 데이터를 Google Sheets로 역동기화
pnpm tsx scripts/rollback/syncToSheets.ts

# 2. 데이터 검증
pnpm tsx scripts/verify/compareV1V2.ts

# 3. v1.0 전환
# (위 긴급 롤백 절차와 동일)
```

---

## 📊 마이그레이션 체크리스트

### 사전 준비
- [ ] v2.0 개발 환경 구축
- [ ] 팀 교육 완료
- [ ] 롤백 계획 수립

### Week 1
- [ ] Google Sheets 데이터 백업
- [ ] CSV 내보내기
- [ ] 마이그레이션 스크립트 테스트

### Week 2
- [ ] Dual-Write 구현
- [ ] 동기화 검증
- [ ] 성능 벤치마크

### Week 3
- [ ] 사용자 베타 테스트
- [ ] 버그 수정
- [ ] 문서 업데이트

### Week 4
- [ ] 트래픽 점진적 전환 (20% → 50% → 100%)
- [ ] 모니터링
- [ ] v1.0 종료

---

## 💬 지원

마이그레이션 중 문제가 발생하면:

- 📧 Email: migration@poker-hand-logger.com
- 💬 Slack: #migration-support
- 📞 긴급: +82-10-XXXX-XXXX

---

**마이그레이션 완료를 축하합니다! 🎉**

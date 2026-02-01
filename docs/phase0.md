# Assemblier — Claude Code 지시문 (Phase 0: 기반 조성)

작업 루트: `C:\Users\Juyong\assemblier`
저장소: https://github.com/shopidream/assemblier (main 브랜치)

---

## 전제 조건

assemblier 폴더 안의 기존 파일은 모두 삭제한다. README.md만 남기고 전부 지운다.
`.git` 폴더는 삭제하지 않는다.

---

## 프로젝트 개요

- **프로젝트명:** Assemblier
- **목표:** 사용자가 최소 정보를 입력하면 Shopify 스토어를 자동 생성하는 SaaS 플랫폼
- **구조:** RivenAd와 동일한 패턴으로 구성
- **Node.js:** v20.20.0 (LTS) 고정

---

## 이번 단계의 목표

기능 구현은 하지 않는다. 아래만 완료한다.

- RivenAd와 동일한 폴더 구조 생성
- Frontend / Backend 분리
- TypeORM 기본 설정 (DB 연결은 하지 않음, 구조만)
- 개발을 바로 시작할 수 있는 안정적인 기반 조성

---

## 기술 스택 (고정, 변경 불가)

| 영역 | 기술 |
|------|------|
| Node.js | v20.20.0 (LTS) |
| Package Manager | npm |
| Frontend | Next.js 14 (App Router, TypeScript) |
| Backend | NestJS (TypeScript) |
| Database | PostgreSQL (연결은 하지 않음, 구조만) |
| ORM | TypeORM |
| Styling | Tailwind CSS (Frontend에만) |

---

## 디렉토리 구조 (정확히 이 구조로 생성)

```
assemblier/
├─ assemblier-backend/
│  ├─ src/
│  │  ├─ main.ts
│  │  ├─ app.module.ts
│  │  ├─ typeorm.config.ts      # DB 연결 설정
│  │  ├─ data-source.ts         # Migration용 DataSource
│  │  ├─ health/
│  │  │  ├─ health.module.ts
│  │  │  └─ health.controller.ts
│  │  └─ migrations/            # 빈 폴더 (Phase 1에서 사용)
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ nest-cli.json
│
├─ assemblier-frontend/
│  ├─ src/
│  │  └─ app/
│  │     ├─ layout.tsx
│  │     └─ page.tsx            # Landing placeholder
│  ├─ package.json
│  └─ tsconfig.json
│
├─ .gitignore
└─ README.md
```

---

## Backend (assemblier-backend)

`nest new assemblier-backend`로 생성한 후 아래로 구성한다.

### package.json

RivenAd 백엔드와 동일한 패턴으로 잡는다. 이 단계에서는 아래만 포함한다.

```json
{
  "name": "assemblier-backend",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "test": "jest",
    "typeorm": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js",
    "migration:run": "npm run typeorm migration:run -- -d src/typeorm.config.ts",
    "migration:revert": "npm run typeorm migration:revert -- -d src/typeorm.config.ts",
    "migration:generate": "npm run typeorm migration:generate -- -d src/typeorm.config.ts",
    "migration:create": "npm run typeorm migration:create"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/config": "^4.0.2",
    "@nestjs/core": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/typeorm": "^11.0.0",
    "dotenv": "^17.2.3",
    "pg": "^8.16.3",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.2",
    "typeorm": "^0.3.27"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.16",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@types/node": "^22.10.7",
    "eslint": "^9.18.0",
    "jest": "^30.0.0",
    "prettier": "^3.4.2",
    "ts-jest": "^29.2.5",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.3"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

### main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';

config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Assemblier backend running on port ${port}`);
}

bootstrap();
```

### typeorm.config.ts

RivenAd와 동일한 패턴. 이 단계에서는 entities와 migrations 경로만 잡는다.

```typescript
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();
const sslEnabled = configService.get('DATABASE_SSL') !== 'false';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST'),
  port: Number(configService.get('DATABASE_PORT')),
  username: configService.get('DATABASE_USERNAME'),
  password: configService.get('DATABASE_PASSWORD'),
  database: configService.get('DATABASE_NAME'),
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  entities: ['src/**/entities/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: false,
});
```

### data-source.ts

Migration CLI용. RivenAd와 동일.

```typescript
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false,
});
```

### app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: Number(configService.get('DATABASE_PORT')),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        ssl: configService.get('DATABASE_SSL') !== 'false'
          ? { rejectUnauthorized: false }
          : false,
        entities: [__dirname + '/**/entities/*.entity{.ts,.js}'],
        synchronize: false,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    HealthModule,
  ],
})
export class AppModule {}
```

### health/health.controller.ts

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return { status: 'ok' };
  }
}
```

### health/health.module.ts

```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

### .env (assemblier-backend/.env)

```env
# ─── Database ───
DATABASE_SSL=false
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=1234
DATABASE_NAME=assemblier

# ─── App ───
PORT=3001
```

### nest-cli.json

```json
{
  "$schema": "https://docs.nestjs.com/cli/options",
  "sourceRoot": "src"
}
```

---

## Frontend (assemblier-frontend)

`npx create-next-app@14 assemblier-frontend`로 생성한다. TypeScript, App Router, Tailwind CSS 옵션 선택.

생성 후 아래만 확인한다.

### page.tsx (src/app/page.tsx)

```tsx
export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold">Assemblier</h1>
    </div>
  );
}
```

### .env (assemblier-frontend/.env)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## .gitignore (루트)

```
node_modules
.env
.env.*
!.env.example
dist
.next
```

---

## DB 준비

`assemblier` 데이터베이스를 로컬 PostgreSQL에 생성한다.
RivenAd와 동일하게 `postgres` 유저, 비밀번호 `1234`로 사용한다.

pgAdmin 또는 psql에서:

```sql
CREATE DATABASE assemblier;
```

이 단계에서는 테이블을 생성하지 않는다. Phase 1에서 migration으로 만든다.

---

## 작업 완료 후 검증

```sh
# 백엔드
cd assemblier-backend
npm install
npm run start:dev
# → GET http://localhost:3001/health → { "status": "ok" }

# 프론트
cd assemblier-frontend
npm install
npm run dev
# → http://localhost:3000 접근 가능
```

---

## 작업 완료 후

커밋 메시지:

```
chore: assemblier phase 0 — foundation setup
```

GitHub main에 푸시한다.
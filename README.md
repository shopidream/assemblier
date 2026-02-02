# Assemblier

Shopify 스토어 자동 생성 SaaS 플랫폼

## 기술 스택

- **Frontend**: Next.js 14 (App Router, TypeScript, Tailwind CSS)
- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Node.js**: v20.20.0 (LTS)

## 프로젝트 구조

```
assemblier/
├─ assemblier-backend/   # NestJS 백엔드
├─ assemblier-frontend/  # Next.js 프론트엔드
└─ README.md
```

## 개발 환경 설정

### Backend

```bash
cd assemblier-backend
npm install
npm run start:dev
```

### Frontend

```bash
cd assemblier-frontend
npm install
npm run dev
```

## 환경 변수

각 프로젝트 디렉토리에 `.env` 파일을 생성하여 환경 변수를 설정합니다.

## 데이터베이스

PostgreSQL 데이터베이스 `assemblier`가 필요합니다.

```sql
CREATE DATABASE assemblier;
```



```````````````````````````````````````````````````````````````````````

- 스토어 자동제작 시스템 자세한 기획서
    
    # Shopify Store Assembly System — 기획서
    
    **작성일** 2026.02.01
    **작성자** Juyong
    **버전** v1.0
    
    ---
    
    ## 1. 프로젝트 정의
    
    ### 1.1 한 줄 요약
    
    사용자가 최소 정보를 입력하면, Shopify 스토어가 자동으로 완성되는 SaaS 플랫폼.
    
    ### 1.2 무엇이 아닌가
    
    - 디자인 빌더가 아님
    - 테마 커스터마이저가 아님
    - 드래그·드롭 페이지 메이커가 아님
    
    ### 1.3 무엇인가
    
    입력 → 해석 → 스토어 완성 시스템.
    사용자는 질문에 답하고, 시스템이 구조·문구·섹션·정책까지 자동으로 생성한다.
    
    ---
    
    ## 2. 비즈니스 모델
    
    ### 2.1 수익 구조
    
    | 항목 | 누가 결정 | 누가 결제 |
    | --- | --- | --- |
    | Shopify 플랜 비용 | Shopify | 사용자 직접 결제 |
    | SaaS 구독료 (스토어 생성 + 유지) | 당신 | 사용자 → 당신 |
    
    두 비용은 완전히 분리된다. 이것이 핵심.
    
    ### 2.2 왜 이렇게 분리하냐
    
    - Shopify 비용을 대신 내면 현금 흐름 위험이 폭증
    - 악성 사용자 / 연체 시 리스크가 당신에게 집중
    - 분리하면: 깔끔, 확장 가능, 인수 대상 되기 쉬운 구조
    
    ---
    
    ## 3. 소유권 & 파트너 구조
    
    ### 3.1 전체 구조 (정답)
    
    `생성: 당신의 파트너 계정
    소유권: 사용자 (생성 직후 이전)
    결제/세금: 사용자
    자동화/디자인/운영: 당신의 SaaS 구독`
    
    당신은 "스토어 주인"이 아니라 "스토어를 만들어주는 인프라"다.
    
    ### 3.2 파트너 계정 분리 여부
    
    - 파트너 계정 1개로 시작
    - Shopify 정책상 수백 개 스토어 생성 가능
    - 문제 생기면 나중에 2~3개로 분리
    - 초기부터 나눌 필요 없음
    
    ### 3.3 소유권 이전 타이밍
    
    스토어 생성 완료 직후 → 사용자 이메일로 즉시 이전.
    이전 후에도 당신은 파트너로서 앱 권한과 관리자 접근을 유지한다.
    
    ---
    
    ## 4. 사용자 입력 구조 (CSL Flow)
    
    ### 4.1 원칙
    
    - 스텝을 나누는 게 목적이 아님
    - 입력량 최소 + 결과 최대
    - AI가 기본값을 대신 결정
    - 사용자는 선택·판단·고민 안 함
    
    ### 4.2 UI상 스텝 (3단계만)
    
    **Step 1 — 브랜드 & 국가**
    
    - 브랜드명
    - 회사명
    - 회사주소
    - 이메일
    - 전화번호
    - 타겟시장
    - 언어
    - 통화
    
    → 이것으로 Footer / About / Contact / 정책 페이지가 자동 생성된다.
    
    **Step 2 — 상품**
    
    - 상품명
    - 썸네일
    - 가격
    - 옵션
    
    → 최소 1개만 있으면 스토어가 성립한다. 홈 / PDP / 컬렉션 / 네비 자동 완성.
    
    **Step 3 — 생성**
    
    - 자동 생성 요약 리뷰
    - 생성 버튼
    
    → 여기서 끝. 이 순간 스토어는 "완성" 상태.
    
    ### 4.3 내부 처리 스텝 (사용자 안 본다)
    
    사용자가 보는 것과 내부 처리는 분리된다.
    
    - 업종 → 섹션 조합 결정 (AI)
    - 국가 → 통화 / 정책 문구 / 언어 자동 적용
    - 회사 형태 → 이용약관 / 개인정보처리방침 자동 생성
    - Style Skin → 기본값 적용 (생성 후 사용자가 교체 가능)
    
    ### 4.4 생성 이후 (After Creation)
    
    스토어 생성 후에도 추가 기능은 천천히 제공한다.
    
    - Style Skin 교체
    - 섹션 추가
    - 문구 고급화
    - 국가 확장 / 번역
    
    이건 전부 구독 기간 내에서 천천히.
    
    ---
    
    ## 5. 시스템 아키텍처
    
    ### 5.1 레이어 구조
    
    `Layer 1: User Input (CSL Flow)
        ↓
    Layer 2: App Backend (NestJS) ← 핵심 엔진
        ↓
    Layer 3: Shopify Store (사용자 소유)
        ↓
    Layer 4: License Control (앱 서버 판단)`
    
    **중요: Layer 2와 Layer 4는 반드시 백엔드에 있어야 한다.**
    프론트는 상태를 받아서 렌더하는 소비자일 뿐이다.
    
    ### 5.2 백엔드가 하는 일
    
    - Shopify Partner API 호출 (스토어 생성)
    - 소유권 이전 실행
    - 앱 설치 및 권한 관리
    - 라이선스 상태 판단
    - AI Content Gen 트리거 (OpenAI)
    - Stripe 구독 상태 관리
    
    ### 5.3 프론트가 하는 일
    
    - CSL Input UI 표시
    - 백엔드에서 받은 상태만 렌더
    - 생성 진행 상황 표시
    - 구독 관리 UI
    
    프론트에 Partner API / License 판단 / 스토어 생성 로직이 있으면 안 된다.
    
    ---
    
    ## 6. Dawn & App Section 구조
    
    ### 6.1 Dawn을 쓰는 이유
    
    Dawn은 "예쁜 테마"가 아니라 Shopify 표준 구조 엔진이다.
    당신은 Dawn 위에 자동 생성 로직을 얹는 것이다.
    
    ### 6.2 구조 분리
    
    | 구성 요소 | 역할 | 구독 중단 시 |
    | --- | --- | --- |
    | Dawn Theme | 중립 베이스 구조 | 유지 (비상용만) |
    | App Section | 핵심 가치 (Hero · Header · PDP · CTA) | 무력화 |
    | App-injected CSS/JS | 디자인 & 기능 강화 | 정지 |
    | Auto Pages | 정책 · Contact 등 | 유지 |
    
    ### 6.3 쇼핑몰 vs 회사 사이트
    
    같은 구조로 가되, "무력화 대상"이 달라진다.
    
    **쇼핑몰의 핵심 (잠그는 것)**
    
    - PDP 구조 (가격 · 구매 버튼 · 옵션)
    - 구독 중단 시 → 상품은 있는데 안 팔림
    
    **회사 사이트의 핵심 (잠그는 것)**
    
    - Landing Flow (Hero · CTA · 문의폼)
    - 구독 중단 시 → 페이지는 열린다, 회사 소개서 수준으로 퇴화
    
    ---
    
    ## 7. 라이선스 & 구독 제어
    
    ### 7.1 핵심 원칙
    
    스토어를 멈추게 할 생각 말고, "쓸 이유를 없애는 구조"를 만든다.
    
    ### 7.2 판단은 반드시 앱 서버
    
    `Shopify Store
      └─ App Section
            └─ fetch → App Backend
                  └─ license_status 반환`
    
    섹션 자체가 라이선스를 판단하는 것은 안 된다.
    섹션은 서버에서 받은 결과만 소비한다.
    이건 심사·확장·보안 모두에서 중요하다.
    
    ### 7.3 구독 만료 시 동작
    
    **되는 것**
    
    - App Section은 남아있음 (삭제 아님)
    - 렌더는 하지만 기능 정지
    - Hero → 배경 흐림, CTA 비활성화
    - PDP → 가격·구매 버튼·옵션 숨김
    - 회사 사이트 → 문의폼 제출 불가
    - 관리자 화면에서만 경고 배너 표시
    
    **하면 안 되는 것**
    
    - 테마 삭제 / 깨뜨리기
    - 결제 차단
    - 상품 비활성화
    - 스토어 프론트 강제 차단
    - 에러 throw
    
    ### 7.4 라이선스 체크 주기
    
    - 앱 로드 시
    - 페이지 로드 시 (캐시 고려)
    - 주기적 검증 (6~12시간)
    
    ### 7.5 체감상 효과
    
    구독 중단 후 사용자의 체감:
    
    - "스토어는 살아있는데, 쓸 수 없음"
    - 다시 쓰려면 거의 새로 세팅해야 함
    - 강제 파괴 아니라 기능 회수
    
    이건 협박이 아니고, 정상적인 구독 SaaS 아키텍처이다.
    
    ---
    
    ## 8. 개발 계획
    
    ### Phase 1 — Foundation (3~4주)
    
    - 파트너 계정 세팅 & Shopify Partner API 연동
    - Next.js 기본 앱 구조
    - 사용자 인증 (OAuth / 이메일)
    - Stripe 구독 결제 연동
    - DB 설계 (스토어 · 사용자 · 구독)
    
    ### Phase 2 — Store Generator Core (4~5주)
    
    - CSL Input Flow UI (Step 1~3)
    - Shopify Partner API로 스토어 생성
    - 소유권 이전 자동화
    - Dawn 테마 기본 배포
    - 상품 생성 & 컬렉션 자동 구성
    - AI 기본값 생성 (About · Footer · 정책 페이지)
    
    ### Phase 3 — App Sections & Layout (4~5주)
    
    - App Section 개발 (Hero · Header · PDP · CTA · Contact)
    - Layout Preset 엔진 (쇼핑몰 / 회사 사이트 분기)
    - AI Content Gen (상품 설명 · 마케팅 문구)
    - Nav & Footer 자동 생성
    - Style Skin (CSS 레이어) 구현
    
    ### Phase 4 — License Control & Polish (2~3주)
    
    - 백엔드 라이선스 체크 시스템
    - 구독 만료 시 App Section 무력화 로직
    - 관리자 배너 & Paywall UI
    - 전체 E2E 테스트
    - 성능 최적화 & 배포
    
    **총 예상 기간: 13~17주 (MVP 기준, 혼자 개발 시)**
    
    ---
    
    ## 9. Tech Stack
    
    | 영역 | 기술 |
    | --- | --- |
    | Frontend | Next.js 14+, React, Tailwind CSS |
    | Backend | NestJS (기존 패턴 재사용), Node.js, PostgreSQL |
    | Shopify | Partner API, App Section, Dawn Theme |
    | 결제 | Stripe (구독 관리) |
    | AI | OpenAI (콘텐츠 생성) |
    | 배포 | Vercel |
    
    RivenAd와 동일한 스택을 재사용하면 Phase 1에서 시간을 크게 줄일 수 있다.
    
    ---
    
    ## 10. 핵심 결정 사항 요약
    
    | 질문 | 답 |
    | --- | --- |
    | 파트너 계정 개수? | 1개로 시작, 필요시 분리 |
    | 스토어 소유권? | 생성 후 사용자로 즉시 이전 |
    | Shopify 플랜 비용? | 사용자 직접 결제 |
    | 구독 중단 시? | App Section 무력화 (삭제 아님) |
    | 테마 구조? | Dawn 기반 + App Section 레이어 |
    | 회사 사이트 지원? | PDP 대신 Landing Flow로 동일 구조 적용 |
    | 라이선스 판단 위치? | 반드시 백엔드 (프론트 아님) |
    | CSL 스텝 수? | UI 3단계, 내부 처리는 별도 |
    
    ---
    
    ## 11. 다음 단계
    
    1. Phase 1 환경 세팅 시작
    2. Shopify Partner 계정 생성 및 API 테스트
    3. DB 스키마 확정
    4. Stripe 구독 플랜 설계 (무엇을 어떤 가격으로)







    ====================================================================
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

================================================================================

Assemblier — Claude Code 지시문 (Phase 1: Foundation)
작업 루트: C:\Users\Juyong\assemblier
저장소: https://github.com/shopidream/assemblier (main 브랜치)

전제 조건
docs/ 폴더는 절대 삭제하지 않는다. 이 폴더는 지시문 저장소이다.

Phase 0 완료 상태를 가정한다. 아래가 작동해야 이 단계를 시작할 수 있다.
shcd assemblier-backend
npm install
npm run start:dev
# → GET http://localhost:3001/health → { "status": "ok" }

cd ../assemblier-frontend
npm install
npm run dev
# → http://localhost:3000 접근 가능
기존 구조:

assemblier-backend/ — NestJS, TypeORM, HealthController
assemblier-backend/src/typeorm.config.ts — DataSource 설정
assemblier-backend/src/data-source.ts — Migration용 DataSource
assemblier-frontend/ — Next.js 14 (App Router, TypeScript, Tailwind)
로컬 PostgreSQL — postgres/1234, assemblier 데이터베이스 생성 완료


이번 단계의 목표
Phase 1은 **"스토어를 만들기 위한 백엔드 기본 인프라"**를 완성하는 단계이다.
아래만 완료한다.

DB 스키마 및 Migration — TypeORM Entity 작성 + migration 실행으로 실제 테이블 생성
사용자 인증 — 이메일/비밀번호 기반 회원가입·로그인 (백엔드 API + 프론트 UI)
Stripe 구독 연동 — 구독 생성·관리·웹훅 처리 (백엔드만, UI는 최소)
Shopify Partner API 연동 — 스토어 생성·소유권 이전 API 호출 가능한 서비스 레이어 구성 (실제 스토어 생성 UI는 Phase 2)


제약 조건 (반드시 준수)

CSL UI 구현 금지 — Phase 2의 일
스토어 자동 생성 플로 구현 금지 — API 호출 가능한 서비스 레이어까지만
라이선스 체크 로직 구현 금지 — Phase 4의 일
프론트에 비즈니스 로직 금지 — 백엔드 API를 호출하고 결과만 렌더
과도한 추상화 금지 — 지금 필요한 것만


1. DB 스키마 및 Migration
1.1 Entity 작성
아래 Entity를 각각 생성한다.
src/users/entities/user.entity.ts
typescriptimport {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Shop } from '../../shops/entities/shop.entity';
import { Subscription } from '../../subscription/entities/subscription.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Shop, (shop) => shop.user)
  shops: Shop[];

  @OneToOne(() => Subscription, (subscription) => subscription.user)
  subscription: Subscription;
}
src/shops/entities/shop.entity.ts
typescriptimport {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ShopStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('shops')
export class Shop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  shopifyDomain: string;

  @Column({ unique: true })
  shopifyId: string;

  @Column({ type: 'enum', enum: ShopStatus, default: ShopStatus.ACTIVE })
  status: ShopStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.shops)
  @JoinColumn({ name: 'userId' })
  user: User;
}
src/subscription/entities/subscription.entity.ts
typescriptimport {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SubscriptionPlan {
  STARTER = 'STARTER',
  PRO = 'PRO',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ unique: true })
  stripeCustomerId: string;

  @Column({ unique: true })
  stripeSubId: string;

  @Column({ type: 'enum', enum: SubscriptionPlan })
  plan: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp' })
  currentPeriodEnd: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.subscription)
  @JoinColumn({ name: 'userId' })
  user: User;
}
1.2 Migration 생성 및 실행
Entity를 작성한 후 아래 순서로 실행한다.
shcd assemblier-backend
npm run migration:generate -- --name CreateInitialSchema
npm run migration:run
1.3 app.module.ts Entity 등록
app.module.ts의 TypeOrmModule 설정에 Entity를 추가한다.
typescriptimport { User } from './users/entities/user.entity';
import { Shop } from './shops/entities/shop.entity';
import { Subscription } from './subscription/entities/subscription.entity';

// TypeOrmModule.forRootAsync의 useFactory 안에:
entities: [User, Shop, Subscription],

2. 사용자 인증
2.1 설계 원칙

백엔드가 모든 인증 로직을 소유한다. 프론트는 API를 호출하고 응답만 처리한다.
JWT 기반. httpOnly cookie로 토큰을 전달한다.
비밀번호는 bcrypt로 해싱한다.
RivenAd의 auth 구조와 동일한 패턴을 따른다.

2.2 백엔드 패키지 설치
shcd assemblier-backend
npm install bcrypt @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/bcrypt @types/passport-jwt
```

### 2.3 백엔드 구조
```
src/
├─ auth/
│  ├─ auth.module.ts
│  ├─ auth.controller.ts
│  ├─ auth.service.ts
│  └─ jwt.strategy.ts
├─ users/
│  ├─ users.module.ts
│  ├─ users.service.ts
│  └─ entities/
│     └─ user.entity.ts
```

**auth.controller.ts — 엔드포인트:**
```
POST /auth/register
  Request:  { email: string, password: string }
  Response: 201 { id, email, createdAt }
  - email 중복 시 409
  - password 최소 8자

POST /auth/login
  Request:  { email: string, password: string }
  Response: 200 { id, email }
  - 성공 시 access_token을 httpOnly cookie로 세팅
    (path=/, HttpOnly, SameSite=Lax)
  - 실패 시 401

POST /auth/logout
  Response: 200 {}
  - cookie를 만료시킨다 (maxAge=0)

GET /auth/me  (보호 라우트 — JwtAuthGuard 적용)
  Response: 200 { id, email, createdAt }
jwt.strategy.ts:
cookie에서 토큰을 추출하여 검증한다.
typescriptimport { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: (req: Request) => {
        return req.cookies?.access_token || null;
      },
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { id: string }) {
    return this.usersService.findById(payload.id);
  }
}
2.4 .env 추가
assemblier-backend/.env에 추가:
envJWT_SECRET=assemblier_jwt_secret_local_2025
```

### 2.5 프론트 — Auth Pages
```
assemblier-frontend/src/
├─ app/
│  ├─ login/
│  │  └─ page.tsx
│  ├─ register/
│  │  └─ page.tsx
│  └─ dashboard/
│     └─ page.tsx
└─ lib/
   └─ auth.ts             # API 호출 함수 (login, register, logout, getMe)

폼 디자인은 최소한다. Tailwind 기본 클래스만.
로그인 후 /dashboard로 리다이렉트.
/dashboard는 GET /auth/me를 호출하여 확인. 응답 없으면 /login으로 리다이렉트.
cookie는 백엔드가 세팅하므로 프론트에서 직접 다루지 않는다.


3. Stripe 구독 연동
3.1 설계 원칙

백엔드만 Stripe와 통신한다. 프론트는 백엔드 API를 호출하는 것뿐이다.
Stripe Customer는 구독 생성 시 자동으로 생성한다.
웹훅으로 구독 상태 변경을 감지한다.
RivenAd의 subscription 구조와 동일한 패턴을 따른다.

3.2 백엔드 패키지 설치
shcd assemblier-backend
npm install stripe
```

### 3.3 백엔드 구조
```
src/
├─ stripe/
│  ├─ stripe.module.ts
│  ├─ stripe.service.ts
│  └─ stripe.controller.ts       # POST /stripe/webhook
├─ subscription/
│  ├─ subscription.module.ts
│  ├─ subscription.controller.ts
│  ├─ subscription.service.ts
│  └─ entities/
│     └─ subscription.entity.ts
```

**subscription.controller.ts — 엔드포인트:**
```
POST /subscription/create  (보호 라우트)
  Request:  { plan: "STARTER" | "PRO" }
  Response: 201 { subscriptionId, plan, status, currentPeriodEnd }
  - 이미 구독 중인 경우 409
  - Stripe Customer가 없으면 자동 생성 후 진행

DELETE /subscription/cancel  (보호 라우트)
  Response: 200 { status: "CANCELED", currentPeriodEnd }
  - 현재 주기 끝에서 취소 (cancel_at_period_end)
  - DB 업데이트는 웹훅에서 처리

GET /subscription/status  (보호 라우트)
  Response: 200 { plan, status, currentPeriodEnd } | 404
```

**stripe.controller.ts — 웹훅:**
```
POST /stripe/webhook  (공개 라우트, 인증 없음)
  - Stripe 시그니처로 검증 (stripe.webhooks.constructEvent)
  - 처리할 이벤트:
    customer.subscription.updated  → status 업데이트
    customer.subscription.deleted  → status를 CANCELED로
    invoice.payment_failed         → status를 PAST_DUE로

주의: webhook 라우트는 body를 raw string으로 받아야 한다.
stripe.webhooks.constructEvent에 raw body가 필요하기 때문이다.

3.4 .env 추가
assemblier-backend/.env에 추가:
env# ─── Stripe ───
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret_here
STRIPE_PRICE_STARTER=prod_Ttnqn0sBiIiVwc
STRIPE_PRICE_PRO=prod_TtnqWIhvix1OpB

STRIPE_WEBHOOK_SECRET는 Stripe CLI로 포워딩할 때 터미널에 표시된다:
shstripe listen --forward-to localhost:3001/stripe/webhook

3.5 프론트 — 구독 UI (최소)
assemblier-frontend/src/app/dashboard/page.tsx에 구독 상태 표시 및 구독 시작/취소 버튼 추가.

GET /subscription/status 호출 후 상태 표시
"구독 시작" 버튼 → POST /subscription/create 호출
"구독 취소" 버튼 → DELETE /subscription/cancel 호출
디자인은 최소한다.


4. Shopify Partner API 연동
4.1 설계 원칙

백엔드에만 Partner API 로직이 있다. 프론트는 이 단계에서 Partner API와 관련된 것을 보지 못한다.
실제 스토어 생성 플로는 Phase 2에서 구현한다. 이 단계는 **"호출할 수 있는 상태"**까지만 만든다.

4.2 백엔드 패키지 설치
shcd assemblier-backend
npm install @nestjs/axios axios
```

### 4.3 백엔드 구조
```
src/
├─ shopify/
│  ├─ shopify.module.ts
│  ├─ shopify.service.ts
│  └─ shopify.service.spec.ts
컨트롤러는 만들지 않는다. Phase 2에서 다른 서비스가 이 메서드를 호출하는 구조이다.
shopify.service.ts — 메서드:
typescript// 스토어 생성
async createShop(params: {
  shopName: string;
  email: string;
}): Promise<{ shopId: string; shopDomain: string }>;

// 소유권 이전
async transferOwnership(params: {
  shopId: string;
  newOwnerEmail: string;
}): Promise<{ transferred: boolean }>;

HttpService (@nestjs/axios)로 호출한다.
Base URL: https://partners.shopify.com/api/2024-01
인증: X-Shopify-Access-Token 헤더

4.4 단위 테스트
shopify.service.spec.ts에 Shopify API를 mock하여 테스트한다.

createShop — 성공 케이스, API 실패 시 error throw
transferOwnership — 성공 케이스, API 실패 시 error throw

4.5 .env 추가
assemblier-backend/.env에 추가:
env# ─── Shopify ───
SHOPIFY_APP_CLIENT_ID=your_shopify_client_id_here
SHOPIFY_APP_CLIENT_SECRET=shpss_your_shopify_client_secret_here
```

---

## 디렉토리 구조 (Phase 1 완료 후)
```
assemblier/
├─ assemblier-backend/
│  └─ src/
│     ├─ main.ts
│     ├─ app.module.ts
│     ├─ typeorm.config.ts
│     ├─ data-source.ts
│     ├─ health/
│     ├─ auth/
│     │  ├─ auth.module.ts
│     │  ├─ auth.controller.ts
│     │  ├─ auth.service.ts
│     │  └─ jwt.strategy.ts
│     ├─ users/
│     │  ├─ users.module.ts
│     │  ├─ users.service.ts
│     │  └─ entities/
│     │     └─ user.entity.ts
│     ├─ shops/
│     │  └─ entities/
│     │     └─ shop.entity.ts
│     ├─ stripe/
│     │  ├─ stripe.module.ts
│     │  ├─ stripe.service.ts
│     │  └─ stripe.controller.ts
│     ├─ subscription/
│     │  ├─ subscription.module.ts
│     │  ├─ subscription.controller.ts
│     │  ├─ subscription.service.ts
│     │  └─ entities/
│     │     └─ subscription.entity.ts
│     ├─ shopify/
│     │  ├─ shopify.module.ts
│     │  ├─ shopify.service.ts
│     │  └─ shopify.service.spec.ts
│     └─ migrations/
│        └─ [timestamp]CreateInitialSchema.ts
│
├─ assemblier-frontend/
│  └─ src/
│     ├─ app/
│     │  ├─ layout.tsx
│     │  ├─ page.tsx
│     │  ├─ login/
│     │  │  └─ page.tsx
│     │  ├─ register/
│     │  │  └─ page.tsx
│     │  └─ dashboard/
│     │     └─ page.tsx
│     └─ lib/
│        └─ auth.ts
└─ ...

작업 완료 후 검증
sh# 1. 백엔드
cd assemblier-backend
npm install
npm run migration:generate -- --name CreateInitialSchema
npm run migration:run
npm run start:dev       # localhost:3001

# 2. 프론트
cd ../assemblier-frontend
npm install
npm run dev             # localhost:3000

# 3. 인증 검증
POST http://localhost:3001/auth/register   → 201
POST http://localhost:3001/auth/login      → 200 + cookie
GET  http://localhost:3001/auth/me         → 200 { id, email }
POST http://localhost:3001/auth/logout     → 200

# 4. 구독 검증
POST http://localhost:3001/subscription/create  → 201
GET  http://localhost:3001/subscription/status  → 200
DELETE http://localhost:3001/subscription/cancel → 200

# 5. Shopify 테스트
npm test                → ShopifyService 테스트 통과

# 6. 프론트 검증
localhost:3000/register   → 회원가입 폼 작동
localhost:3000/login      → 로그인 폼 작동
localhost:3000/dashboard  → 로그인 후 접근 가능, 구독 상태 표시
```

---

## 작업 완료 후

커밋 메시지:
```
feat: assemblier phase 1 — auth, stripe, shopify service, db
GitHub main에 푸시한다.


## 자동 응답 규칙

설치 중 프롬프트가 나오면 아래와 같이 응답한다.
모든 y/n, yes/no 프롬프트는 **yes**로 응답한다.
"yes to all" 옵션이 있으면 그것을 선택한다.
중간에 확인 질문을 하지 않는다. 그냥 진행한다.



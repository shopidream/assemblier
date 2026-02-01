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
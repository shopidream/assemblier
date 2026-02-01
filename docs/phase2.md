Assemblier — Claude Code 지시문 (Phase 2: Store Generator Core)
작업 루트: C:\Users\Juyong\assemblier
저장소: https://github.com/shopidream/assemblier (main 브랜치)

자동 응답 규칙
설치 중 프롬프트가 나오면 아래와 같이 응답한다.
모든 y/n, yes/no 프롬프트는 yes로 응답한다.
"yes to all" 옵션이 있으면 그것을 선택한다.
중간에 확인 질문을 하지 않는다. 그냥 진행한다.

제약 조건 (반드시 준수)

docs/ 폴더는 절대 삭제하지 않는다. 이 폴더는 지시문 저장소이다.
App Section 개발 금지 — Phase 3의 일
라이선스 체크 로직 구현 금지 — Phase 4의 일
프론트에 비즈니스 로직 금지 — 백엔드 API를 호출하고 결과만 렌더
과도한 추상화 금지 — 지금 필요한 것만


전제 조건
Phase 1 완료 상태를 가정한다.
기존 구조:

assemblier-backend/src/auth/ — JWT 인증
assemblier-backend/src/users/ — User Entity + Service
assemblier-backend/src/shops/ — Shop Entity
assemblier-backend/src/subscription/ — Stripe 구독
assemblier-backend/src/shopify/ — ShopifyService (createShop, transferOwnership)
assemblier-frontend/src/app/ — login, register, dashboard


이번 단계의 목표

CSL Input Flow — 사용자 입력 UI (3단계)
Store Generator — 백엔드에서 스토어 생성 전체 플로 자동화
앱 설치 및 Admin API token 발급
Dawn 테마 배포
상품 및 컬렉션 생성
AI 콘텐츠 생성 및 페이지 배포


.env (assemblier-backend/.env)
기존 내용에 아래를 추가한다.
env# ─── Shopify ───
SHOPIFY_APP_CLIENT_ID=your_shopify_app_client_id_here
SHOPIFY_APP_CLIENT_SECRET=your_shopify_app_client_secret_here

# ─── OpenAI ───
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# ─── Stripe ───
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PRICE_STARTER=prod_Ttnqn0sBiIiVwc
STRIPE_PRICE_PRO=prod_TtnqWIhvix1OpB
```

---

## 1. CSL Input Flow (Frontend)

### 1.1 구조
```
assemblier-frontend/src/app/
└─ create/
   └─ page.tsx          # 3단계 스텝을 하나의 페이지에서 관리
```

### 1.2 Step 구성

**Step 1 — 브랜드 & 국가**

필드:
- 브랜드명 (required)
- 회사명 (required)
- 회사주소
- 이메일 (required)
- 전화번호
- 타겟시장 (드롭다운 — 국가 선택)
- 언어 (드롭다운)
- 통화 (드롭다운 — 타겟시장에 따라 자동 선택, 수동 변경 가능)

**Step 2 — 상품**

필드 (최소 1개):
- 상품명 (required)
- 가격 (required)
- 옵션 (텍스트, 선택사항)

상품은 "+" 버튼으로 추가 가능. 최소 1개만 있으면 진행 가능.
썸네일은 이 단계에서는 제외한다.

**Step 3 — 생성**

- Step 1, 2 입력 내용 요약 표시
- "스토어 생성" 버튼
- 생성 진행 상황 표시 (polling으로 `GET /stores/status/:shopId` 호출)
- 생성 완료 시 스토어 URL 표시

### 1.3 규칙

- 백엔드 API를 호출하고 결과만 렌더한다.
- 폼 디자인은 최소한다. Tailwind 기본 클래스만.
- Step 간 이동은 "Next" / "Back" 버튼으로.
- Step 1, 2에서 필수 필드가 빈 경우 Next 클릭 불가.
- 구독이 활성화되지 않은 사용자는 `/create` 접근 시 `/dashboard`로 리다이렉트.

---

## 2. Store Generator (Backend)

### 2.1 백엔드 구조
```
src/
├─ stores/
│  ├─ stores.module.ts
│  ├─ stores.controller.ts
│  ├─ stores.service.ts
│  └─ dto/
│     └─ generate-store.dto.ts
```

### 2.2 엔드포인트

**POST /stores/generate** (보호 라우트)
```
Request: {
  brand: {
    brandName: string,
    companyName: string,
    address?: string,
    email: string,
    phone?: string,
    targetMarket: string,   // 국가 코드 (KR, US, JP...)
    language: string,       // 언어 코드 (ko, en, ja...)
    currency: string        // 통화 코드 (KRW, USD, JPY...)
  },
  products: [
    {
      name: string,
      price: number,
      options?: string
    }
  ]
}

Response: 201 {
  shopId: string,
  shopDomain: string,
  status: "GENERATING"
}
```

- 구독 미활성화 시 403
- 이미 스토어가 있는 경우 409

**GET /stores/status/:shopId** (보호 라우트)
```
Response: 200 {
  shopId: string,
  shopDomain: string,
  status: "GENERATING" | "COMPLETED" | "FAILED",
  progress: number,         // 0~100
  currentStep: string,
  error?: string
}
```

### 2.3 생성 플로 (stores.service.ts)

순차적으로 실행한다. 각 단계 실패 시 `generationStep`을 `FAILED`로, `generationError`에 에러 메시지를 저장한다.
```
Step 1: Shopify 스토어 생성
  → ShopifyService.createShop({ shopName, email })
  → progress: 10

Step 2: 소유권 이전
  → ShopifyService.transferOwnership({ shopId, newOwnerEmail })
  → progress: 20

Step 3: 앱 설치 및 Admin API token 발급
  → ShopifyAppService.installApp({ shopDomain })
  → token을 DB의 Shop 레코드에 저장
  → progress: 40

Step 4: Dawn 테마 배포
  → ShopifyThemeService.installDawnTheme({ shopDomain, token })
  → progress: 60

Step 5: 상품 및 컬렉션 생성
  → ShopifyProductService.createProducts({ shopDomain, token, products })
  → progress: 80

Step 6: AI 콘텐츠 생성 및 페이지 배포
  → AiService.generateStoreContent({ brand, products })
  → ShopifyProductService.createPages({ shopDomain, token, pages })
  → progress: 100, status: COMPLETED
```

---

## 3. 앱 설치 및 Admin API Token (ShopifyAppService)

### 3.1 구조
```
src/shopify/
└─ shopify-app.service.ts
3.2 메서드
typescriptasync installApp(params: {
  shopDomain: string;
}): Promise<{ token: string }>;

Partner가 생성한 스토어에 앱을 자동 설치한다.
Shopify Partner API의 application_installations 엔드포인트를 사용한다.
설치 완료 후 Admin API Access Token을 반환한다.
반환된 token은 Shop 레코드의 adminToken 필드에 저장한다.

3.3 Shop Entity에 adminToken 추가
typescript@Column({ type: 'text', nullable: true })
adminToken: string;
Migration:
shnpm run migration:generate -- --name AddAdminTokenToShop
npm run migration:run
```

---

## 4. Dawn 테마 배포 (ShopifyThemeService)

### 4.1 구조
```
src/shopify/
└─ shopify-theme.service.ts
4.2 메서드
typescriptasync installDawnTheme(params: {
  shopDomain: string;
  token: string;          // Admin API token
}): Promise<{ themeId: string }>;
```

- Shopify Admin API의 `themes` 엔드포인트를 사용한다.
- Dawn은 Shopify 공식 테마이므로 테마 ID로 직접 설치 가능하다.
- 설치 후 `main` 테마로 설정한다.

---

## 5. 상품 및 페이지 생성 (ShopifyProductService)

### 5.1 구조
```
src/shopify/
└─ shopify-product.service.ts
5.2 메서드
typescript// 상품 생성
async createProducts(params: {
  shopDomain: string;
  token: string;
  products: Array<{
    name: string;
    price: number;
    options?: string;
  }>;
}): Promise<{ createdProducts: Array<{ id: string; title: string }> }>;

// 페이지 생성 (About, Contact, 정책 페이지)
async createPages(params: {
  shopDomain: string;
  token: string;
  pages: Array<{
    title: string;
    handle: string;       // URL slug
    body: string;         // AI로 생성된 HTML 콘텐츠
  }>;
}): Promise<{ createdPages: Array<{ id: string; handle: string }> }>;

Shopify Admin API의 products, pages 엔드포인트를 사용한다.
컬렉션은 All 기본 컬렉션을 사용한다.


6. AI 콘텐츠 생성 (AiService)
6.1 백엔드 패키지 설치
shcd assemblier-backend
npm install openai
```

### 6.2 구조
```
src/ai/
├─ ai.module.ts
└─ ai.service.ts
6.3 메서드
typescriptasync generateStoreContent(params: {
  brand: {
    brandName: string;
    companyName: string;
    address?: string;
    email: string;
    phone?: string;
    targetMarket: string;
    language: string;
  };
  products: Array<{ name: string; price: number }>;
}): Promise<{
  aboutPage: { title: string; body: string };
  contactPage: { title: string; body: string };
  privacyPolicy: { title: string; body: string };
  termsOfService: { title: string; body: string };
}>;
```

- OpenAI API를 호출한다.
- 생성된 콘텐츠의 언어는 `brand.language`로 결정된다.
- 각 페이지는 독립적으로 생성한다.

---

## 디렉토리 구조 (Phase 2 완료 후)
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
│     ├─ users/
│     ├─ shops/
│     │  └─ entities/
│     │     └─ shop.entity.ts       # adminToken, generationStep 추가
│     ├─ stripe/
│     ├─ subscription/
│     ├─ shopify/
│     │  ├─ shopify.module.ts
│     │  ├─ shopify.service.ts          # (기존)
│     │  ├─ shopify-app.service.ts      # 앱 설치 및 token 발급
│     │  ├─ shopify-theme.service.ts    # Dawn 테마 배포
│     │  └─ shopify-product.service.ts  # 상품, 페이지 생성
│     ├─ stores/
│     │  ├─ stores.module.ts
│     │  ├─ stores.controller.ts
│     │  ├─ stores.service.ts
│     │  └─ dto/
│     │     └─ generate-store.dto.ts
│     ├─ ai/
│     │  ├─ ai.module.ts
│     │  └─ ai.service.ts
│     └─ migrations/
│
├─ assemblier-frontend/
│  └─ src/
│     ├─ app/
│     │  ├─ layout.tsx
│     │  ├─ page.tsx
│     │  ├─ login/
│     │  ├─ register/
│     │  ├─ dashboard/
│     │  └─ create/
│     │     └─ page.tsx
│     └─ lib/
│        ├─ auth.ts
│        └─ store.ts
└─ docs/

작업 완료 후 검증
sh# 1. 백엔드
cd assemblier-backend
npm install
npm run migration:generate -- --name AddGenerationFieldsToShop
npm run migration:generate -- --name AddAdminTokenToShop
npm run migration:run
npm run start:dev       # localhost:3001

# 2. 프론트
cd ../assemblier-frontend
npm install
npm run dev             # localhost:3000

# 3. 검증
localhost:3000/register   → 회원가입
localhost:3000/login      → 로그인
localhost:3000/dashboard  → 구독 시작
localhost:3000/create     → Step 1, 2, 3 폼 작동 및 스토어 생성
```

---

## 작업 완료 후

커밋 메시지:
```
feat: assemblier phase 2 — store generator core
GitHub main에 푸시한다.
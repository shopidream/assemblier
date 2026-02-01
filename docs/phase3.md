Assemblier — Claude Code 지시문 (Phase 3: App Sections & Layout)
작업 루트: C:\Users\Juyong\assemblier
저장소: https://github.com/shopidream/assemblier (main 브랜치)

자동 응답 규칙
설치 중 프롬프트가 나오면 아래와 같이 응답한다.
모든 y/n, yes/no 프롬프트는 yes로 응답한다.
"yes to all" 옵션이 있으면 그것을 선택한다.
중간에 확인 질문을 하지 않는다. 그냥 진행한다.

제약 조건 (반드시 준수)

docs/ 폴더는 절대 삭제하지 않는다. 이 폴더는 지시문 저장소이다.
라이선스 체크 로직 구현 금지 — Phase 4의 일. App Section에 license 관련 코드를 넣지 않는다.
프론트에 비즈니스 로직 금지 — 백엔드 API를 호출하고 결과만 렌더
과도한 추상화 금지 — 지금 필요한 것만
API 키를 docs/ 파일에 실제 값으로 넣지 않는다. placeholder만 사용한다.


전제 조건
Phase 2 완료 상태를 가정한다.
기존 구조:

assemblier-backend/src/shopify/ — ShopifyService, ShopifyAppService, ShopifyThemeService, ShopifyProductService
assemblier-backend/src/stores/ — StoresService (6단계 생성 플로)
assemblier-backend/src/ai/ — AiService (About, Contact, Privacy, Terms 페이지 생성)
Dawn 테마가 생성된 스토어에 배포됨
상품·페이지가 스토어에 생성됨


이번 단계의 목표
Phase 3는 **"Dawn 위에 App Section을 덮어씩으로, 스토어가 실제로 쓰이는 형태가 되는 단계"**이다.
기획서의 6장(Dawn & App Section 구조)이 여기서 구현된다.

App Section 개발 — Hero, Header, PDP, CTA, Contact, Footer
Layout Preset 엔진 — 쇼핑몰 / 회사 사이트 분기
AI Content Gen 확장 — 상품 설명·마케팅 문구 생성
Nav & Footer 자동 생성
Style Skin (CSS 레이어) 구현


1. App Section 개발
1.1 App Section이 무엇인가
Shopify의 Dawn 테마 위에 앱이 주입하는 섹션이다.
Dawn은 중립 베이스 구조이고, App Section이 실제 가치를 제공한다.
기획서 6.2에서 정의한 구조:
구성 요소역할구독 중단 시Dawn Theme중립 베이스 구조유지 (비상용만)App Section핵심 가치 (Hero · Header · PDP · CTA)무력화 (Phase 4)App-injected CSS/JS디자인 & 기능 강화정지 (Phase 4)Auto Pages정책 · Contact 등유지
이 단계에서는 라이선스 체크를 넣지 않는다. Phase 4의 일이다.
이 단계는 App Section을 **"작동하는 상태"**로 만드는 것까지만한다.
1.2 개발할 섹션 목록
src/shopify/
└─ sections/
   ├─ app-hero.liquid           # Hero 섹션
   ├─ app-header.liquid         # Header (네비게이션)
   ├─ app-pdp.liquid            # Product Detail Page 핵심 구조
   ├─ app-cta.liquid            # CTA (Call to Action)
   ├─ app-contact.liquid        # 문의폼
   └─ app-footer.liquid         # Footer
1.3 각 섹션 상세
app-hero.liquid
- 배경 이미지 또는 색상
- 브랜드명 표시
- 타겟 마케팅 문구 (AI로 생성)
- CTA 버튼 (컬렉션 페이지로 이동)
app-header.liquid
- 로고 (텍스트 기본, 이미지 교체 가능)
- 네비게이션 링크 (홈, 컬렉션, About, Contact)
- 모바일 햄버거 메뉴
app-pdp.liquid
- 상품명
- 가격
- 옵션 셀렉트
- 구매 버튼 (Add to Cart)
- 상품 설명 (AI로 생성된 것)
app-cta.liquid
- 마케팅 문구
- 버튼 (컬렉션 또는 특정 상품으로 이동)
app-contact.liquid
- 문의폼 (이름, 이메일, 메시지)
- 폼 제출은 Shopify의 기본 폼 처리 사용
app-footer.liquid
- 회사명
- 연락처 (이메일, 전화번호)
- 정책 페이지 링크 (Privacy Policy, Terms of Service)
- 소셜 링크 (선택사항, 빈 경우 숨김)
1.4 섹션 배포
생성된 섹션 파일들은 스토어 생성 플로의 Step 7로 추가된다.
stores.service.ts의 생성 플로에 추가:
(기존) Step 6: AI 콘텐츠 생성 및 페이지 배포 → progress: 100
(추가) Step 7: App Section 배포
  → ShopifySectionService.deploySections({ shopDomain, token, layout })
  → progress: 100, status: COMPLETED
백엔드에 새로운 서비스를 추가한다:
src/shopify/
└─ shopify-section.service.ts   # App Section 파일을 스토어에 배포
typescriptasync deploySections(params: {
  shopDomain: string;
  token: string;
  layout: 'ecommerce' | 'business';   // Layout Preset 타입
}): Promise<{ deployedSections: string[] }>;
```

- Shopify Admin API의 `assets` 엔드포인트로 섹션 파일을 업로드한다.
- `layout` 타입에 따라 배포할 섹션 조합이 달라진다. (2단계에서 상세)

---

## 2. Layout Preset 엔진

### 2.1 설계 원칙

기획서 6.3에서 정의한 것과 동일하다.
같은 섹션을 사용하되, **조합과 무력화 대상이 달라진다.**

사용자는 CSL Flow의 Step 1에서 타겟시장을 선택할 때 이미 정보를 줬다.
이 정보로부터 AI가 `ecommerce` 또는 `business` 레이아웃을 결정한다.

### 2.2 레이아웃 분기

**ecommerce (쇼핑몰)**
```
배포할 섹션:
  - app-header
  - app-hero
  - app-pdp
  - app-cta
  - app-footer

핵심 섹션 (Phase 4에서 무력화 대상):
  - app-pdp (가격·구매 버튼·옵션)
```

**business (회사 사이트)**
```
배포할 섹션:
  - app-header
  - app-hero
  - app-cta
  - app-contact
  - app-footer

핵심 섹션 (Phase 4에서 무력화 대상):
  - app-hero (배경·CTA)
  - app-contact (문의폼)
2.3 레이아웃 결정 로직
백엔드의 AiService에 메서드를 추가한다.
typescriptasync determineLayout(params: {
  brand: {
    brandName: string;
    targetMarket: string;
  };
  products: Array<{ name: string; price: number }>;
}): Promise<{ layout: 'ecommerce' | 'business' }>;

OpenAI로 사용자 입력을 분석하여 레이아웃을 결정한다.
상품이 있고 가격이 있으면 기본적으로 ecommerce.
상품이 없거나 가격이 0이면 business.

Shop Entity에 layout 필드를 추가한다:
typescript@Column({ type: 'varchar', nullable: true })
layout: string;   // 'ecommerce' | 'business'
Migration:
shnpm run migration:generate -- --name AddLayoutToShop
npm run migration:run

3. AI Content Gen 확장
3.1 무엇을 추가하는가
Phase 2에서는 About, Contact, Privacy, Terms 페이지를 생성했다.
이 단계에서는 아래를 추가한다:

상품 설명 — 각 상품별 AI 생성
마케팅 문구 — Hero 섹션과 CTA 섹션에 넣을 문구
Footer 콘텐츠 — 회사명·연락처 정리

3.2 AiService 확장
기존 ai.service.ts에 아래 메서드를 추가한다.
typescript// 상품 설명 생성
async generateProductDescriptions(params: {
  brand: { brandName: string; language: string };
  products: Array<{ name: string; price: number; options?: string }>;
}): Promise<Array<{ productName: string; description: string }>>;

// 마케팅 문구 생성 (Hero + CTA)
async generateMarketingCopy(params: {
  brand: { brandName: string; targetMarket: string; language: string };
  layout: 'ecommerce' | 'business';
}): Promise<{
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  ctaButtonLabel: string;
}>;
```

- 생성된 상품 설명은 Phase 2의 `ShopifyProductService.createProducts`에서 상품 생성 시 함께 넣는다.
- 마케팅 문구는 App Section 배포 시 섹션 파일에 주입한다.

### 3.3 생성 플로에서의 위치

`stores.service.ts`의 생성 플로:
```
Step 5: 상품 생성
  → AI로 상품 설명 생성
  → 상품 설명과 함께 Shopify에 상품 생성

Step 6: AI 콘텐츠 생성
  → 페이지 콘텐츠 생성 (기존)
  → 마케팅 문구 생성 (추가)

Step 7: App Section 배포
  → 마케팅 문구를 섹션 파일에 주입하여 배포
```

---

## 4. Nav & Footer 자동 생성

### 4.1 Nav (네비게이션)

`app-header.liquid`의 네비게이션 링크는 스토어의 페이지 구조에 따라 자동으로 구성된다.

기본 Nav 구조:
```
ecommerce: 홈 → 컬렉션 → About → Contact
business:  홈 → About → Contact
```

백엔드에서 섹션 파일을 생성할 때 `layout` 타입에 따라 Nav 링크를 주입한다.

### 4.2 Footer

`app-footer.liquid`는 Step 1에서 받은 회사정보로 자동 구성된다.
```
회사명: brand.companyName
이메일: brand.email
전화번호: brand.phone (없으면 숨김)
정책 링크: Privacy Policy, Terms of Service (Phase 2에서 생성된 페이지)
```

백엔드에서 섹션 배포 시 이 정보를 `app-footer.liquid`에 주입한다.

---

## 5. Style Skin (CSS 레이어)

### 5.1 설계 원칙

- Style Skin은 Dawn 위에 덮어씩는 **CSS 레이어**이다.
- 초기에는 기본 Skin 1개만 제공한다.
- 생성 후 사용자가 교체할 수 있는 구조로 잡는다 (실제 교체 UI는 Phase 4 이후).

### 5.2 구조
```
src/shopify/
└─ skins/
   └─ default.css              # 기본 Style Skin
default.css는 다음을 정의한다:
css/* ─── 색상 변수 ─── */
:root {
  --skin-primary: #1a1a1a;
  --skin-secondary: #ffffff;
  --skin-accent: #000000;
  --skin-bg: #f5f5f5;
  --skin-text: #333333;
  --skin-font-family: 'Inter', sans-serif;
}

/* ─── App Section 기본 스타일 ─── */
.app-hero { ... }
.app-header { ... }
.app-pdp { ... }
.app-cta { ... }
.app-contact { ... }
.app-footer { ... }
```

### 5.3 배포

Style Skin CSS는 App Section과 함께 스토어에 배포한다.
`ShopifySectionService.deploySections`에서 CSS 파일도 함께 업로드한다.

Dawn 테마의 `layout/theme.liquid`에 CSS 파일을 `<link>` 태그로 참조 추가한다.

---

## 디렉토리 구조 (Phase 3 완료 후)
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
│     │     └─ shop.entity.ts       # layout 필드 추가
│     ├─ stripe/
│     ├─ subscription/
│     ├─ shopify/
│     │  ├─ shopify.module.ts
│     │  ├─ shopify.service.ts
│     │  ├─ shopify-app.service.ts
│     │  ├─ shopify-theme.service.ts
│     │  ├─ shopify-product.service.ts
│     │  ├─ shopify-section.service.ts   # (추가) App Section 배포
│     │  ├─ sections/                    # (추가) Liquid 섹션 파일
│     │  │  ├─ app-hero.liquid
│     │  │  ├─ app-header.liquid
│     │  │  ├─ app-pdp.liquid
│     │  │  ├─ app-cta.liquid
│     │  │  ├─ app-contact.liquid
│     │  │  └─ app-footer.liquid
│     │  └─ skins/                       # (추가) Style Skin CSS
│     │     └─ default.css
│     ├─ stores/
│     │  ├─ stores.module.ts
│     │  ├─ stores.controller.ts
│     │  ├─ stores.service.ts            # Step 7 추가
│     │  └─ dto/
│     ├─ ai/
│     │  ├─ ai.module.ts
│     │  └─ ai.service.ts                # 상품 설명, 마케팅 문구 생성 추가
│     └─ migrations/
│
├─ assemblier-frontend/
│  └─ src/
│     └─ app/
│        ├─ login/
│        ├─ register/
│        ├─ dashboard/
│        └─ create/
└─ docs/

작업 완료 후 검증
sh# 1. 백엔드
cd assemblier-backend
npm install
npm run migration:generate -- --name AddLayoutToShop
npm run migration:run
npm run start:dev       # localhost:3001

# 2. 프론트
cd ../assemblier-frontend
npm run dev             # localhost:3000

# 3. 검증
# 전체 플로 실행:
localhost:3000/register   → 회원가입
localhost:3000/login      → 로그인
localhost:3000/dashboard  → 구독 시작
localhost:3000/create     → Step 1, 2, 3 폼 작동 및 스토어 생성

# 생성된 스토어에서 확인:
# - Dawn 테마 위에 App Section이 렌더되는지
# - Hero, Header, PDP, CTA, Footer가 정상 표시되는지
# - AI 생성된 마케팅 문구가 Hero/CTA에 표시되는지
# - AI 생성된 상품 설명이 PDP에 표시되는지
# - ecommerce / business 레이아웃 분기가 올바르게 적용되는지
# - Style Skin CSS가 적용되는지
```

---

## 작업 완료 후

커밋 메시지:
```
feat: assemblier phase 3 — app sections, layout preset, style skin
GitHub main에 푸시한다.
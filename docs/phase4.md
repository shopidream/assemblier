Assemblier — Claude Code 지시문 (Phase 4: License Control & Polish)
작업 루트: C:\Users\Juyong\assemblier
저장소: https://github.com/shopidream/assemblier (main 브랜치)

자동 응답 규칙
설치 중 프롬프트가 나오면 아래와 같이 응답한다.
모든 y/n, yes/no 프롬프트는 yes로 응답한다.
"yes to all" 옵션이 있으면 그것을 선택한다.
중간에 확인 질문을 하지 않는다. 그냥 진행한다.

제약 조건 (반드시 준수)

docs/ 폴더는 절대 삭제하지 않는다. 이 폴더는 지시문 저장소이다.
프론트에 비즈니스 로직 금지 — 백엔드 API를 호출하고 결과만 렌더
과도한 추상화 금지 — 지금 필요한 것만
API 키를 docs/ 파일에 실제 값으로 넣지 않는다. placeholder만 사용한다.
스토어를 멈추거나 파괴하는 로직 금지 — 기획서 7.3 "하면 안 되는 것"을 반드시 준수한다.


전제 조건
Phase 3 완료 상태를 가정한다.
기존 구조:

assemblier-backend/src/shopify/sections/ — 6개 App Section (Liquid)
assemblier-backend/src/shopify/skins/ — default.css (Style Skin)
assemblier-backend/src/shopify/shopify-section.service.ts — 섹션 배포
assemblier-backend/src/ai/ — 레이아웃 결정, 상품 설명, 마케팅 문구 생성
assemblier-backend/src/stores/ — 7단계 생성 플로
Shop Entity에 layout 필드 포함
ecommerce / business 레이아웃 분기 완료


이번 단계의 목표
Phase 4는 **"구독 만료 시 App Section이 무력화되는 라이선스 체크 시스템"**과 **전체 E2E 테스트 및 배포까지 완성하는 마지막 단계"**이다.
기획서의 7장(라이선스 & 구독 제어)이 여기서 구현된다.

백엔드 라이선스 체크 API — App Section이 호출하여 라이선스 상태를 받음
App Section 무력화 로직 — 구독 만료 시 섹션별 동작 변경
관리자 배너 & Paywall UI — 백엔드에서 경고 상태를 받아 프론트 대시보드에 표시
E2E 테스트
성능 최적화 & 배포 (Vercel)


1. 백엔드 라이선스 체크 API
1.1 설계 원칙
기획서 7.2에서 정의한 것과 동일하다.
Shopify Store
  └─ App Section
        └─ fetch → App Backend
              └─ license_status 반환
섹션 자체가 라이선스를 판단하지 않는다.
백엔드에서 받은 결과만 소비한다.
1.2 엔드포인트
GET /license/status (공개 라우트, 인증 없음)
App Section에서 호출하는 것이므로 JWT 인증을 사용할 수 없는다.
shopDomain으로 스토어를 식별한다.
Query: ?shopDomain=example.myshopify.com

Response: 200 {
  shopDomain: string,
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED",
  layout: "ecommerce" | "business",
  expiresAt: string (ISO date)
}

ACTIVE — 구독 정상. 모든 섹션 작동.
PAST_DUE — 결제 실패. 섹션은 작동하지만 경고 배너 표시.
CANCELED — 구독 취소됨. 현재 주기 끝까지는 ACTIVE.
EXPIRED — 구독 만료. 섹션 무력화.

1.3 백엔드 구조
src/
├─ license/
│  ├─ license.module.ts
│  ├─ license.controller.ts     # GET /license/status
│  └─ license.service.ts        # 구독 상태 → license status 변환 로직
license.service.ts:
typescriptasync getLicenseStatus(shopDomain: string): Promise<LicenseStatus> {
  // 1. shopDomain으로 Shop 레코드 조회
  // 2. Shop.userId로 Subscription 레코드 조회
  // 3. Subscription.status와 currentPeriodEnd로 license status 결정
  //    - ACTIVE && currentPeriodEnd > now → ACTIVE
  //    - PAST_DUE → PAST_DUE
  //    - CANCELED && currentPeriodEnd > now → ACTIVE (현재 주기까지)
  //    - CANCELED && currentPeriodEnd <= now → EXPIRED
  // 4. 결과 반환
}
1.4 캐시
기획서 7.4에서 정의한 체크 주기:

앱 로드 시
페이지 로드 시
주기적 검증 (6~12시간)

백엔드에서는 App Section이 매번 호출하면 DB 조회가 발생한다.
이를 줄이기 위해 in-memory 캐시를 추가한다.
typescript// license.service.ts
private cache = new Map<string, { status: LicenseStatus; cachedAt: Date }>();
private CACHE_TTL = 6 * 60 * 60 * 1000;  // 6시간

async getLicenseStatus(shopDomain: string): Promise<LicenseStatus> {
  const cached = this.cache.get(shopDomain);
  if (cached && (Date.now() - cached.cachedAt.getTime()) < this.CACHE_TTL) {
    return cached.status;
  }
  // DB 조회 후 캐시 저장
  ...
}

2. App Section 무력화 로직
2.1 설계 원칙
기획서 7.3을 정확히 따른다.
되는 것:

App Section은 남아있음 (삭제 아님)
렌더는 하지만 기능 정지
Hero → 배경 흐림, CTA 비활성화
PDP → 가격·구매 버튼·옵션 숨김
회사 사이트 → 문의폼 제출 불가

하면 안 되는 것:

테마 삭제 / 깨뜨리기
결제 차단
상품 비활성화
스토어 프론트 강제 차단
에러 throw

2.2 섹션별 무력화 구현
각 App Section의 Liquid 파일에 아래 패턴을 추가한다.
liquid{% comment %}
  라이선스 체크 — 백엔드에서 받은 결과만 사용한다.
  섹션 자체가 판단하지 않는다.
{% endcomment %}

{% assign license_url = 'https://' | append: request.host | append: '/license/status?shopDomain=' | append: request.host %}
{% assign license = license_url | fetch %}
{% assign license_status = license.status %}
app-hero.liquid (무력화 시):
liquid{% if license_status == 'EXPIRED' %}
  {# 배경 흐림 적용, CTA 버튼 숨김 #}
  <div class="app-hero app-hero--expired">
    <div class="app-hero__overlay"></div>
    {# 배경과 텍스트만 유지, 버튼 제거 #}
  </div>
{% else %}
  {# 정상 렌더 #}
{% endif %}
app-pdp.liquid (무력화 시):
liquid{% if license_status == 'EXPIRED' %}
  {# 가격·구매 버튼·옵션 숨김 #}
  <div class="app-pdp app-pdp--expired">
    <h1>{{ product.title }}</h1>
    <div class="app-pdp__description">{{ product.description }}</div>
    {# 가격, 옵션, Add to Cart 모두 숨김 #}
  </div>
{% else %}
  {# 정상 렌더 #}
{% endif %}
app-contact.liquid (무력화 시):
liquid{% if license_status == 'EXPIRED' %}
  {# 폼 표시하지만 제출 불가 #}
  <div class="app-contact app-contact--expired">
    <form class="app-contact__form app-contact__form--disabled">
      {# 필드는 렌더되지만 disabled 상태, submit 버튼 숨김 #}
    </form>
  </div>
{% else %}
  {# 정상 렌더 #}
{% endif %}
app-cta.liquid (무력화 시):
liquid{% if license_status == 'EXPIRED' %}
  {# CTA 버튼 비활성화 #}
  <div class="app-cta app-cta--expired">
    <p>{{ cta_text }}</p>
    {# 버튼 숨김 #}
  </div>
{% else %}
  {# 정상 렌더 #}
{% endif %}
2.3 무력화별 레이아웃 분기
기획서 6.3과 동일하다.
ecommerce — 핵심 무력화 대상:

app-pdp — 가격·구매 버튼·옵션 숨김
결과: "상품은 있는데 안 팔림"

business — 핵심 무력화 대상:

app-hero — 배경 흐림, CTA 비활성화
app-contact — 문의폼 제출 불가
결과: "페이지는 열린다, 회사 소개서 수준으로 퇴화"

2.4 무력화 CSS (Style Skin 추가)
default.css에 무력화용 스타일을 추가한다.
css/* ─── 무력화 스타일 ─── */
.app-hero--expired {
  position: relative;
}
.app-hero--expired .app-hero__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1;
}

.app-pdp--expired .app-pdp__price,
.app-pdp--expired .app-pdp__options,
.app-pdp--expired .app-pdp__add-to-cart {
  display: none;
}

.app-contact--expired .app-contact__form--disabled {
  opacity: 0.4;
  pointer-events: none;
}

.app-cta--expired .app-cta__button {
  display: none;
}
```

---

## 3. 관리자 배너 & Paywall UI

### 3.1 백엔드

기존 `GET /subscription/status`가 이미 있다.
프론트의 대시보드에서 이 API를 호출하여 구독 상태를 표시한다.

추가 엔드포인트는 필요 없다.

### 3.2 프론트 — 대시보드 경고 배너

`assemblier-frontend/src/app/dashboard/page.tsx`에 아래를 추가한다.

구독 상태별 배너:
```
ACTIVE    → 배너 없음
PAST_DUE  → 경고 배너: "결제가 실패했습니다. 결제 방법을 업데이트하세요."
CANCELED  → 정보 배너: "구독이 [날짜]에 종료됩니다."
EXPIRED   → Paywall 배너: "구독이 만료되었습니다. 스토어가 제한됨. 재구독하여 복원하세요."
```

**Paywall 배너는 대시보드 최상위에 고정된다.** 다른 콘텐츠 위에 항상 표시.

재구독 버튼은 `POST /subscription/create`를 호출한다.

### 3.3 프론트 구조
```
assemblier-frontend/src/
└─ app/
   └─ dashboard/
      └─ page.tsx          # 구독 상태 배너 추가
```

---

## 4. E2E 테스트

### 4.1 테스트 범위

전체 플로를 하나의 시나리오로 테스트한다.
```
Scenario 1: 정상 플로
  1. 회원가입
  2. 로그인
  3. 구독 시작 (STARTER)
  4. 스토어 생성 (ecommerce)
  5. 생성된 스토어에서 App Section 확인
     - Hero, Header, PDP, CTA, Footer 정상 렌더
     - AI 생성 콘텐츠 표시
  6. License API 호출 → ACTIVE

Scenario 2: 구독 만료 플로
  1. Scenario 1 완료 상태에서
  2. Stripe 테스트 모드로 구독 취소 시뮬레이션
  3. License API 호출 → EXPIRED
  4. 생성된 스토어에서 App Section 확인
     - ecommerce: PDP에서 가격·구매 버튼·옵션 숨김
     - Hero, CTA 정상 렌더 (ecommerce에서는 무력화 대상 아님)
  5. 대시보드에서 Paywall 배너 확인

Scenario 3: business 레이아웃 + 구독 만료
  1. 스토어 생성 (business)
  2. 구독 취소 시뮬레이션
  3. 생성된 스토어에서 확인
     - Hero: 배경 흐림, CTA 비활성화
     - Contact: 폼 제출 불가
  4. 대시보드에서 Paywall 배너 확인
4.2 테스트 실행
백엔드 단위 테스트:
shcd assemblier-backend
npm test
```

테스트 파일:
```
src/license/license.service.spec.ts    # 라이선스 상태 변환 로직 테스트
typescript// license.service.spec.ts
describe('LicenseService', () => {
  it('should return ACTIVE when subscription is active and not expired');
  it('should return PAST_DUE when subscription status is PAST_DUE');
  it('should return ACTIVE when canceled but currentPeriodEnd is in the future');
  it('should return EXPIRED when canceled and currentPeriodEnd is in the past');
  it('should cache results and return cached value within TTL');
  it('should refresh cache after TTL expires');
});

5. 성능 최적화 & 배포
5.1 백엔드 최적화

License API의 in-memory 캐시 (1단계에서 구현됨)
GET /license/status는 경량 엔드포인트. DB 조회가 캐시로 줄어듦.

5.2 프론트 최적화

대시보드에서 구독 상태를 페이지 로드 시 한 번만 조회
/create 페이지에서 생성 진행 상황 폴링 간격: 3초

5.3 배포
프론트 — Vercel
sh# Vercel CLI로 배포
cd assemblier-frontend
vercel deploy --prod
.env.local (프론트):
envNEXT_PUBLIC_API_URL=https://assemblier-backend.your-domain.com
백엔드 — Vercel Serverless 또는 별도 호스팅
백엔드는 NestJS이므로 Vercel Serverless에는 맞지 않는다.
Render, Railway, Fly.io 중 하나를 사용한다.
배포 환경의 .env:
env# ─── Database ───
DATABASE_HOST=your_production_db_host
DATABASE_PORT=5432
DATABASE_USERNAME=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=assemblier
DATABASE_SSL=true

# ─── JWT ───
JWT_SECRET=your_production_jwt_secret

# ─── Stripe ───
STRIPE_SECRET_KEY=sk_live_your_production_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
STRIPE_PRICE_STARTER=price_your_production_starter
STRIPE_PRICE_PRO=price_your_production_pro

# ─── Shopify ───
SHOPIFY_APP_CLIENT_ID=your_client_id
SHOPIFY_APP_CLIENT_SECRET=your_client_secret

# ─── OpenAI ───
OPENAI_API_KEY=your_production_openai_key
OPENAI_MODEL=gpt-4o-mini

주의: 배포 시 모든 키값은 placeholder로 남긴다. 실제 키는 호스팅 플랫폼의 환경 변수로 설정한다.

5.4 CORS 설정
백엔드의 main.ts에 CORS를 설정한다.
typescript// main.ts
import { CorsMiddleware } from '@nestjs/common/middleware';

app.enableCors({
  origin: process.env.FRONTEND_URL,  // Vercel 배포 URL
  credentials: true,                  // httpOnly cookie 전달을 위해
});
.env에 추가:
envFRONTEND_URL=https://your-assemblier-frontend.vercel.app
```

---

## 디렉토리 구조 (Phase 4 완료 후)
```
assemblier/
├─ assemblier-backend/
│  └─ src/
│     ├─ main.ts                     # CORS 설정 추가
│     ├─ app.module.ts
│     ├─ typeorm.config.ts
│     ├─ data-source.ts
│     ├─ health/
│     ├─ auth/
│     ├─ users/
│     ├─ shops/
│     ├─ stripe/
│     ├─ subscription/
│     ├─ shopify/
│     │  ├─ sections/               # App Section (무력화 로직 추가)
│     │  │  ├─ app-hero.liquid
│     │  │  ├─ app-header.liquid
│     │  │  ├─ app-pdp.liquid
│     │  │  ├─ app-cta.liquid
│     │  │  ├─ app-contact.liquid
│     │  │  └─ app-footer.liquid
│     │  └─ skins/
│     │     └─ default.css          # 무력화 CSS 추가
│     ├─ stores/
│     ├─ ai/
│     ├─ license/                   # (추가)
│     │  ├─ license.module.ts
│     │  ├─ license.controller.ts
│     │  ├─ license.service.ts
│     │  └─ license.service.spec.ts
│     └─ migrations/
│
├─ assemblier-frontend/
│  └─ src/
│     └─ app/
│        ├─ login/
│        ├─ register/
│        ├─ dashboard/
│        │  └─ page.tsx             # 구독 상태 배너 추가
│        └─ create/
└─ docs/

작업 완료 후 검증
sh# 1. 백엔드
cd assemblier-backend
npm install
npm run start:dev       # localhost:3001

# 2. 프론트
cd ../assemblier-frontend
npm install
npm run dev             # localhost:3000

# 3. 단위 테스트
cd ../assemblier-backend
npm test                → LicenseService 테스트 통과

# 4. E2E 검증
localhost:3000/register   → 회원가입
localhost:3000/login      → 로그인
localhost:3000/dashboard  → 구독 시작
localhost:3000/create     → 스토어 생성 (ecommerce)

# 생성된 스토어에서:
GET /license/status?shopDomain=xxx.myshopify.com → ACTIVE
# → App Section 정상 렌더 확인

# Stripe 테스트 모드로 구독 취소 후:
GET /license/status?shopDomain=xxx.myshopify.com → EXPIRED
# → PDP: 가격·구매 버튼 숨김 확인
# → 대시보드: Paywall 배너 확인
```

---

## 작업 완료 후

커밋 메시지:
```
feat: assemblier phase 4 — license control, e2e test, deploy
GitHub main에 푸시한다.
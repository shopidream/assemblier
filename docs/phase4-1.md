Assemblier — Claude Code 지시문 (Phase 4-1: Store Localization)
작업 루트: assemblier-backend/, assemblier-frontend/
저장소: https://github.com/shopidream/assemblier (main 브랜치)

이번 단계의 목표
Phase 2~3에서 빠진 스토어 생성 시 로컬화 부분을 보완한다.
구체적으로 네 가지를 구현한다.

shopName → domain 변환 로직 — brandName을 깔끔한 myshopify.com 주소로 변환
스토어 언어 설정 — Shopify Admin API로 primary_locale 설정
스토어 통화 설정 — Shopify Admin API로 currency 설정 (언어와 동시)
Shop entity 로컬화 필드 — language, currency, targetMarket을 DB에 저장

기존 Generation Flow의 진행 퍼센트와 단계 순서가 바뀌며, 새로운 Step 4.5가 추가된다.

제약 조건 (반드시 준수)

기존 Phase 0~4 구현을 깨지 않는다. 기존 서비스·컨트롤러·엔티티 구조를 유지한다.
백엔드에 비즈니스 로직이 있는다. 프론트엔드는 API 호출과 결과 렌더링만 한다.
TypeORM + NestJS 패턴 유지 (RivenAd와 동일 구조)
Migration은 npm run migration:generate -- --name=... 패턴으로 생성한다.
.env 키는 새로 추가하지 않는다. 기존 SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET와 Admin API token(Shop.adminToken)만 사용한다.


1. shopName 변환 유틸리티
1.1 파일 위치
assemblier-backend/src/stores/
├── stores.service.ts          # (기존) 생성 플로우 — Step 1 수정
└── shop-name.util.ts          # NEW — 변환 로직
1.2 변환 규칙 (shop-name.util.ts)
함수 시그니처:
typescriptexport function generateShopName(brandName: string): string
단계별 변환:

앞뒤 공백 제거 (trim)
영문자(a-z A-Z)와 숫자(0-9)만 남기기 — 한글, 특수문자, 공백 모두 제거
소문자로 변환
앞부분에 숫자만 있으면 앞에 shop 붙임 (예: 123brand → shop123brand)
빈 문자열이면 fallback: shop + 랜덤 6자리 숫자 (예: shop482917)
최대 24자로 자른다 (Shopify myshopify.com 도메인 안전 길이)

변환 예시:
입력출력Piki Assempikiassem피키 assemblierassemblierMy Brand!mybrand123Shopshop123shop`` (빈문자열)shop482917한글만shop839201 (영문 없으면 fallback)
1.3 중복 재시도 로직 (stores.service.ts)
createShop이 409 (domain 중복)을 반환하면, 끝에 숫자를 붙여 최대 3회 재시도한다.
typescriptasync createShopWithRetry(baseName: string, email: string) {
  let name = baseName;
  for (let i = 0; i < 3; i++) {
    try {
      return await this.shopifyService.createShop({ shopName: name, email });
    } catch (e) {
      if (e.response?.status === 409 && i < 2) {
        name = baseName + Math.floor(Math.random() * 900 + 100); // 3자리 숫자 추가
        continue;
      }
      throw e;
    }
  }
}
1.4 단위 테스트 (shop-name.util.spec.ts)
assemblier-backend/src/stores/
└── shop-name.util.spec.ts     # NEW
테스트 케이스:

영문만 → 소문자로 변환
공백 포함 → 공백 제거
한글 포함 → 한글만 제거, 영문 남김
특수문자 포함 → 특수문자 제거
숫자로 시작 → shop 접두사 추가
빈 문자열 → shop + 숫자 (정규식 검증)
24자 초과 → 24자로 잘림


2 & 3. 스토어 언어·통화 설정
2.1 파일 위치
assemblier-backend/src/shopify/
├── shopify-store.service.ts   # NEW — Admin API로 스토어 설정 변경
└── shopify.service.ts         # (기존) Partner API — 수정 없음
기존에도 ShopifyAppService, ShopifyThemeService, ShopifyProductService 등이 있었으므로, 동일한 패턴으로 ShopifyStoreService를 추가한다.
2.2 ShopifyStoreService
typescript@Injectable()
export class ShopifyStoreService {
  // 스토어의 언어와 통화를 동시에 설정
  async configureStore(params: {
    shopDomain: string;
    token: string;        // Shop.adminToken
    language: string;     // 예: "ko"
    currency: string;     // 예: "KRW"
  }): Promise<{ configured: boolean }>;
}
내부 구현:

Admin API 엔드포인트: PUT https://{shopDomain}/admin/api/2024-01/shop.json
헤더: X-Shopify-Access-Token: {token}
본문:

json{
  "shop": {
    "primary_locale": "{language}",
    "currency": "{currency}"
  }
}

성공 시 { configured: true } 반환
실패 시 error throw (Generation Flow에서 catch하여 generationError로 저장)

2.3 언어 코드 유효성 검증
Shopify는 제한된 locale 목록만 지원한다. CSL input에서 받은 language 코드가 Shopify 지원 목록에 있는지 검증한다.
shop-name.util.ts 옆에 별도 파일로 구현:
assemblier-backend/src/stores/
└── locale.util.ts             # NEW
typescript// Shopify 지원 locale 목록 (주요 언어만)
export const SHOPIFY_SUPPORTED_LOCALES: Record<string, string> = {
  en: 'en',
  ko: 'ko',
  ja: 'ja',
  zh: 'zh-CN',
  fr: 'fr',
  de: 'de',
  es: 'es',
  pt: 'pt-BR',
  it: 'it',
  nl: 'nl',
  ru: 'ru',
  ar: 'ar',
  hi: 'hi',
  th: 'th',
  vi: 'vi',
  id: 'id',
  ms: 'ms',
  tr: 'tr',
  pl: 'pl',
  sv: 'sv',
  nb: 'nb',
  da: 'da',
  fi: 'fi',
  cs: 'cs',
  ro: 'ro',
  el: 'el',
  uk: 'uk',
  he: 'he',
};

// CSL input의 language 코드 → Shopify locale 코드로 변환
// 지원하지 않으면 'en'으로 fallback
export function toShopifyLocale(language: string): string {
  return SHOPIFY_SUPPORTED_LOCALES[language] || 'en';
}
2.4 통화 코드
통화 코드는 ISO 4217 표준이므로 CSL input에서 받은 값(예: KRW, USD, JPY)을 그대로 Shopify에 넘긴다. 별도 변환 불필요.

4. Shop Entity 필드 추가 및 Migration
4.1 Shop Entity 수정
typescript// assemblier-backend/src/shops/shop.entity.ts (기존 파일)
// 아래 세 필드 추가

@Column({ nullable: true })
language: string;           // 예: "ko"

@Column({ nullable: true })
currency: string;           // 예: "KRW"

@Column({ nullable: true })
targetMarket: string;       // 예: "KR"
nullable: true로 설정하면 기존 데이터에 영향 없음.
4.2 Migration 생성 및 실행
shcd assemblier-backend
npm run migration:generate -- --name=AddLocalizationFieldsToShop
npm run migration:run
4.3 stores.service.ts에서 저장
스토어 생성 시 CSL input의 language, currency, targetMarket을 Shop에 저장한다.
기존 generateStore 메서드에서 Shop 생성/업데이트 시점에 이 세 필드를 추가로 넘긴다.
4.4 license/status endpoint 반환값 확장
기존: { shopDomain, status, layout, expiresAt }
변경: { shopDomain, status, layout, language, currency, targetMarket, expiresAt }
LicenseService와 LicenseController에서 Shop entity의 새 필드를 포함하여 반환하도록 수정.

Generation Flow 변경 (stores.service.ts)
기존 7단계의 진행율과 단계 구조를 아래와 같이 변경한다.
단계작업progressStep 1generateShopName(brandName) → createShopWithRetry(cleanName, email)10Step 2transferOwnership20Step 3installApp → adminToken 저장35Step 4installDawnTheme45Step 4.5configureStore(language, currency) ← NEW50Step 5createProducts70Step 6AI content → createPages85Step 7deploySections100
Step 4.5는 adminToken이 필요하므로 반드시 Step 3 이후에 실행한다.
Step 4.5가 실패하면 generationError로 저장하고 FAILED로 상태 변경한다.

작업 완료 후 검증
sh# 백엔드 테스트
cd assemblier-backend
npm run test    # shop-name.util.spec.ts 포함 전체 테스트 통과 확인

# Migration 확인
npm run migration:run
# Shop 테이블에 language, currency, targetMarket 컬럼 생성 확인

# 수동 검증 (curl)
# 1. register + login
# 2. subscribe
# 3. POST /stores/generate 호출 시 brandName="Test Brand"
# 4. GET /stores/status/:shopId → shopDomain이 "testbrand.myshopify.com" 형태인지 확인
# 5. GET /license/status?shopDomain=testbrand.myshopify.com → language, currency, targetMarket 반환 확인

작업 완료 후
커밋 메시지:
feat: assemblier phase 4-1 — store localization (domain, language, currency)
GitHub main에 푸시한다.
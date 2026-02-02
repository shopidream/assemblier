# Assemblier — Claude Code 지시문 (Phase 4-2: Templates & Navigation)

작업 루트: `C:\Users\Juyong\assemblier`
저장소: https://github.com/shopidream/assemblier (main 브랜치)

---

## 자동 응답 규칙

설치 중 프롬프트가 나오면 아래와 같이 응답한다.
- 모든 y/n, yes/no 프롬프트는 **yes**로 응답한다.
- "yes to all" 옵션이 있으면 그것을 선택한다.
- 중간에 확인 질문을 하지 않는다. 그냥 진행한다.

---

## 제약 조건 (반드시 준수)

- `docs/` 폴더는 절대 삭제하지 않는다. 이 폴더는 지시문 저장소이다.
- 라이선스 체크 로직 구현 금지 — Phase 5의 일
- 프론트에 비즈니스 로직 금지 — 백엔드 API를 호출하고 결과만 렌더
- 과도한 추상화 금지 — 지금 필요한 것만

---

## 전제 조건

Phase 4-1 완료 상태를 가정한다.

기존 구조:
- `assemblier-backend/src/shopify/` — ShopifyService, ShopifyAppService, ShopifyThemeService, ShopifyProductService, ShopifySectionService, ShopifyStoreService
- `assemblier-backend/src/stores/` — StoresService (8단계 생성 플로), shop-name.util, locale.util
- `assemblier-backend/src/shops/` — Shop entity (language, currency, targetMarket 필드 포함)
- `assemblier-backend/src/shopify/sections/` — 6개 Liquid 섹션 파일
- `assemblier-backend/src/shopify/skins/` — default.css
- `assemblier-frontend/app/create/page.tsx` — CSL Flow (Step 1~3)

---

## 이번 단계의 목표

Phase 4-2는 **"스토어가 실제로 홈페이지에서 보이고, 메뉴가 작동하는 상태"**로 만드는 단계이다.

1. `templates/index.liquid` 생성 — layout별 App Section 렌더 순서 정의, Dawn 기본 index 덮어쓰기
2. Navigation/Menu 생성 — `ShopifyNavigationService` 추가, main-menu 생성
3. `app-header.liquid` 교체 — 하코딩된 링크를 Shopify menu object 참조로 변경
4. `weight_unit` 추가 — CSL 폼 + `configureStore` + Shop entity + migration
5. 생성 완료 후 스토어 URL 표시 — `create/page.tsx` Step 3에서 shopDomain 표시
6. Generation Flow Step 8 추가 및 progress 재조정

---

## 1. templates/index.liquid 생성

### 1.1 파일 위치
```
assemblier-backend/src/shopify/templates/
└── index.liquid
```

새 폴더 `templates/`를 만들고 그 안에 `index.liquid` 파일을 생성한다.

### 1.2 내용

layout별로 App Section 호출 순서를 정의한다. Dawn 테마의 기본 `index.liquid`를 덮어쓴다.

**ecommerce layout:**
```liquid
{% comment %}
  Assemblier — E-commerce Homepage
  Auto-generated template
{% endcomment %}

{% render 'app-header' %}
{% render 'app-hero' %}
{% render 'app-cta' %}
{% render 'app-footer' %}
```

**business layout:**
```liquid
{% comment %}
  Assemblier — Business Homepage
  Auto-generated template
{% endcomment %}

{% render 'app-header' %}
{% render 'app-hero' %}
{% render 'app-cta' %}
{% render 'app-contact' %}
{% render 'app-footer' %}
```

참고: PDP는 상품 상세 페이지이므로 `templates/product.liquid`에서 별도로 호출한다. 홈페이지에는 포함하지 않는다.

### 1.3 deploySections에서 업로드

`ShopifySectionService.deploySections()`에서 `templates/index.liquid`를 업로드하도록 수정한다.
```typescript
// layout 타입에 따라 적절한 index.liquid 선택하여 업로드
const indexTemplate = layout === 'ecommerce' 
  ? fs.readFileSync(path.join(__dirname, 'templates/index-ecommerce.liquid'), 'utf8')
  : fs.readFileSync(path.join(__dirname, 'templates/index-business.liquid'), 'utf8');

// Admin API로 업로드
const asset = {
  key: 'templates/index.liquid',
  value: indexTemplate
};

await this.httpService.put(
  `https://${shopDomain}/admin/api/2024-01/themes/${themeId}/assets.json`,
  { asset },
  { headers: { 'X-Shopify-Access-Token': token } }
).toPromise();
```

파일은 두 개로 분리한다:
- `src/shopify/templates/index-ecommerce.liquid`
- `src/shopify/templates/index-business.liquid`

---

## 2. Navigation/Menu 생성

### 2.1 ShopifyNavigationService 추가
```
assemblier-backend/src/shopify/
└── shopify-navigation.service.ts
```
```typescript
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ShopifyNavigationService {
  constructor(private httpService: HttpService) {}

  async createNavigation(params: {
    shopDomain: string;
    token: string;
    layout: 'ecommerce' | 'business';
  }): Promise {
    const { shopDomain, token, layout } = params;

    // layout에 따라 메뉴 항목 결정
    const menuItems = layout === 'ecommerce'
      ? [
          { title: 'Home', url: '/', type: 'http' },
          { title: 'Collections', url: '/collections/all', type: 'collections' },
          { title: 'About', url: '/pages/about-us', type: 'page' },
          { title: 'Contact', url: '/pages/contact-us', type: 'page' }
        ]
      : [
          { title: 'Home', url: '/', type: 'http' },
          { title: 'About', url: '/pages/about-us', type: 'page' },
          { title: 'Contact', url: '/pages/contact-us', type: 'page' }
        ];

    // Shopify Navigation API로 메뉴 생성
    const url = `https://${shopDomain}/admin/api/2024-01/navigation.json`;
    
    const response = await firstValueFrom(
      this.httpService.post(
        url,
        {
          navigation: {
            handle: 'main-menu',
            title: 'Main Menu',
            links: menuItems
          }
        },
        {
          headers: {
            'X-Shopify-Access-Token': token,
            'Content-Type': 'application/json'
          }
        }
      )
    );

    return { menuId: response.data.navigation.id };
  }
}
```

### 2.2 shopify.module.ts에 등록
```typescript
import { ShopifyNavigationService } from './shopify-navigation.service';

@Module({
  imports: [HttpModule],
  providers: [
    ShopifyService,
    ShopifyAppService,
    ShopifyThemeService,
    ShopifyProductService,
    ShopifySectionService,
    ShopifyStoreService,
    ShopifyNavigationService  // 추가
  ],
  exports: [
    ShopifyService,
    ShopifyAppService,
    ShopifyThemeService,
    ShopifyProductService,
    ShopifySectionService,
    ShopifyStoreService,
    ShopifyNavigationService  // 추가
  ]
})
export class ShopifyModule {}
```

---

## 3. app-header.liquid 교체

기존 하코딩된 링크를 Shopify menu object 참조로 변경한다.

### 3.1 기존 코드 (제거할 부분)
```liquid

  Home
  {% if section.settings.show_collections %}
    Collections
  {% endif %}
  About
  Contact

```

### 3.2 새 코드 (교체)
```liquid

  {% assign main_menu = linklists['main-menu'] %}
  {% for link in main_menu.links %}
    {{ link.title }}
  {% endfor %}

```

참고: `linklists['main-menu']`는 Shopify가 제공하는 전역 객체이다. Navigation API로 생성한 `main-menu`를 자동으로 참조한다.

---

## 4. weight_unit 추가

### 4.1 CSL 폼 수정 (assemblier-frontend/app/create/page.tsx)

`brand` state에 `weightUnit` 추가:
```typescript
const [brand, setBrand] = useState({
  brandName: '',
  companyName: '',
  address: '',
  email: '',
  phone: '',
  targetMarket: 'US',
  language: 'en',
  currency: 'USD',
  weightUnit: 'lb'  // 추가
});
```

Step 1 폼에서 Currency 선택 아래에 추가:
```tsx

  
    Weight Unit
  
  <select
    value={brand.weightUnit}
    onChange={(e) =>
      setBrand({ ...brand, weightUnit: e.target.value })
    }
    className="w-full px-3 py-2 border rounded"
  >
    Pounds (lb)
    Kilograms (kg)
  

```

### 4.2 백엔드 — generate-store.dto.ts 수정
```typescript
export class BrandDto {
  brandName: string;
  companyName: string;
  address?: string;
  email: string;
  phone?: string;
  targetMarket: string;
  language: string;
  currency: string;
  weightUnit: string;  // 추가
}
```

### 4.3 ShopifyStoreService — configureStore 수정

`weight_unit`을 추가한다:
```typescript
async configureStore(params: {
  shopDomain: string;
  token: string;
  language: string;
  currency: string;
  weightUnit: string;  // 추가
}): Promise {
  const { shopDomain, token, language, currency, weightUnit } = params;

  const url = `https://${shopDomain}/admin/api/2024-01/shop.json`;
  
  await firstValueFrom(
    this.httpService.put(
      url,
      {
        shop: {
          primary_locale: language,
          currency: currency,
          weight_unit: weightUnit  // 추가
        }
      },
      {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json'
        }
      }
    )
  );

  return { configured: true };
}
```

### 4.4 Shop entity — weightUnit 필드 추가
```typescript
@Column({ nullable: true })
weightUnit: string;
```

### 4.5 Migration 생성 및 실행
```sh
cd assemblier-backend
npm run migration:generate -- --name=AddWeightUnitToShop
npm run migration:run
```

### 4.6 stores.service.ts — generateStore 수정

Step 4.5에서 `configureStore` 호출 시 `weightUnit` 추가:
```typescript
await this.shopifyStoreService.configureStore({
  shopDomain: shop.shopifyDomain,
  token: shop.adminToken,
  language: toShopifyLocale(brand.language),
  currency: brand.currency,
  weightUnit: brand.weightUnit  // 추가
});
```

Shop 레코드 저장 시에도 추가:
```typescript
shop.weightUnit = brand.weightUnit;
await this.shopRepository.save(shop);
```

---

## 5. 생성 완료 후 스토어 URL 표시

### 5.1 create/page.tsx — Step 3 수정

`progress === 100`일 때 `shopDomain`을 표시하고 새 탭 열기 버튼을 추가한다.
```tsx
{progress === 100 && shopDomain && (
  
    Store generated successfully! 🎉
    Your store URL:
    
      
        https://{shopDomain}
      
      
        href={`https://${shopDomain}`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Open Store
      
    
  
)}
```

### 5.2 pollStatus에서 shopDomain 저장

`getStoreStatus` 응답에서 `shopDomain`을 state로 저장한다:
```tsx
const [shopDomain, setShopDomain] = useState('');

const pollStatus = async (id: string) => {
  const interval = setInterval(async () => {
    try {
      const status = await getStoreStatus(id);
      setProgress(status.progress);
      setCurrentStepText(status.currentStep);
      setShopDomain(status.shopDomain);  // 추가

      if (status.status === 'COMPLETED') {
        clearInterval(interval);
        setGenerating(false);
      } else if (status.status === 'FAILED') {
        clearInterval(interval);
        setGenerating(false);
        setError(status.error || 'Store generation failed');
      }
    } catch (err: any) {
      console.error('Polling error:', err);
    }
  }, 2000);
};
```

---

## 6. Generation Flow Step 8 추가 및 progress 재조정

### 6.1 stores.service.ts — generateStore 수정

Step 8을 추가하고, 각 단계의 progress를 재조정한다.
```typescript
// Step 1 (10%)
shop.generationStep = 'Creating shop';
shop.generationProgress = 10;
await this.shopRepository.save(shop);
const cleanName = generateShopName(brand.brandName);
const { shopId, shopDomain } = await this.createShopWithRetry(cleanName, brand.email);

// Step 2 (18%)
shop.generationStep = 'Transferring ownership';
shop.generationProgress = 18;
await this.shopRepository.save(shop);
await this.shopifyService.transferOwnership({ shopId, newOwnerEmail: brand.email });

// Step 3 (30%)
shop.generationStep = 'Installing app';
shop.generationProgress = 30;
await this.shopRepository.save(shop);
const { token } = await this.shopifyAppService.installApp({ shopDomain });
shop.adminToken = token;
await this.shopRepository.save(shop);

// Step 4 (40%)
shop.generationStep = 'Installing Dawn theme';
shop.generationProgress = 40;
await this.shopRepository.save(shop);
await this.shopifyThemeService.installDawnTheme({ shopDomain, token });

// Step 4.5 (48%)
shop.generationStep = 'Configuring store settings';
shop.generationProgress = 48;
await this.shopRepository.save(shop);
await this.shopifyStoreService.configureStore({
  shopDomain,
  token,
  language: toShopifyLocale(brand.language),
  currency: brand.currency,
  weightUnit: brand.weightUnit
});

// Step 5 (60%)
shop.generationStep = 'Creating products';
shop.generationProgress = 60;
await this.shopRepository.save(shop);
const productDescriptions = await this.aiService.generateProductDescriptions({
  brand: { brandName: brand.brandName, language: brand.language },
  products
});
await this.shopifyProductService.createProducts({
  shopDomain,
  token,
  products: products.map((p, i) => ({
    ...p,
    description: productDescriptions[i]?.description || ''
  }))
});

// Step 6 (72%)
shop.generationStep = 'Generating AI content';
shop.generationProgress = 72;
await this.shopRepository.save(shop);
const content = await this.aiService.generateStoreContent({ brand, products });
const marketingCopy = await this.aiService.generateMarketingCopy({
  brand,
  layout: shop.layout
});
await this.shopifyProductService.createPages({
  shopDomain,
  token,
  pages: [content.aboutPage, content.contactPage, content.privacyPolicy, content.termsOfService]
});

// Step 7 (88%)
shop.generationStep = 'Deploying sections';
shop.generationProgress = 88;
await this.shopRepository.save(shop);
await this.shopifySectionService.deploySections({
  shopDomain,
  token,
  layout: shop.layout,
  marketingCopy
});

// Step 8 (100%) — NEW
shop.generationStep = 'Creating navigation';
shop.generationProgress = 100;
await this.shopRepository.save(shop);
await this.shopifyNavigationService.createNavigation({
  shopDomain,
  token,
  layout: shop.layout
});

// 완료
shop.generationStatus = 'COMPLETED';
await this.shopRepository.save(shop);
```

---

## 디렉토리 구조 (Phase 4-2 완료 후)
```
assemblier/
├─ assemblier-backend/
│  └─ src/
│     ├─ shopify/
│     │  ├─ shopify.module.ts
│     │  ├─ shopify-navigation.service.ts    # NEW
│     │  ├─ shopify-store.service.ts         # configureStore에 weightUnit 추가
│     │  ├─ sections/
│     │  │  ├─ app-header.liquid             # menu object 참조로 교체
│     │  │  └─ ... (나머지 5개)
│     │  └─ templates/                       # NEW
│     │     ├─ index-ecommerce.liquid
│     │     └─ index-business.liquid
│     ├─ shops/
│     │  └─ entities/
│     │     └─ shop.entity.ts                # weightUnit 필드 추가
│     ├─ stores/
│     │  ├─ stores.service.ts                # Step 8 추가, progress 재조정
│     │  └─ dto/
│     │     └─ generate-store.dto.ts         # BrandDto에 weightUnit 추가
│     └─ migrations/
│        └─ [timestamp]AddWeightUnitToShop.ts
│
├─ assemblier-frontend/
│  └─ app/
│     └─ create/
│        └─ page.tsx                         # weightUnit 필드 추가, shopDomain 표시
└─ docs/
   └─ phase4-2.md                            # 이 지시문
```

---

## 작업 완료 후 검증
```sh
# 1. 백엔드
cd assemblier-backend
npm install
npm run migration:generate -- --name=AddWeightUnitToShop
npm run migration:run
npm run start:dev       # localhost:3001

# 2. 프론트
cd ../assemblier-frontend
npm run dev             # localhost:3000

# 3. 검증
# - localhost:3000/register → 회원가입
# - localhost:3000/login → 로그인
# - localhost:3000/dashboard → 구독 시작
# - localhost:3000/create
#   - Step 1: Weight Unit 선택지 확인
#   - Step 2: 상품 입력
#   - Step 3: Generate Store
#   - progress 100% 후 스토어 URL 표시 확인
#   - "Open Store" 버튼으로 새 탭에서 스토어 열기
#
# 4. 생성된 스토어 확인
# - 홈페이지에서 App Section이 렌더되는지 확인
# - Header 메뉴가 작동하는지 확인 (menu object 참조)
# - About, Contact 페이지로 이동되는지 확인
# - ecommerce layout이면 Collections 링크도 확인
```

---

## 작업 완료 후

커밋 메시지:
```
feat: assemblier phase 4-2 — templates, navigation, weight unit, store url display
```

GitHub main에 푸시한다.
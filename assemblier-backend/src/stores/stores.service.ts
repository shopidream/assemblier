import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop, GenerationStep } from '../shops/entities/shop.entity';
import { User } from '../users/entities/user.entity';
import { SubscriptionService } from '../subscription/subscription.service';
import { ShopifyService } from '../shopify/shopify.service';
import { ShopifyAppService } from '../shopify/shopify-app.service';
import { ShopifyThemeService } from '../shopify/shopify-theme.service';
import { ShopifyProductService } from '../shopify/shopify-product.service';
import { AiService } from '../ai/ai.service';
import { GenerateStoreDto } from './dto/generate-store.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
    private subscriptionService: SubscriptionService,
    private shopifyService: ShopifyService,
    private shopifyAppService: ShopifyAppService,
    private shopifyThemeService: ShopifyThemeService,
    private shopifyProductService: ShopifyProductService,
    private aiService: AiService,
  ) {}

  async generateStore(
    user: User,
    dto: GenerateStoreDto,
  ): Promise<{ shopId: string; shopDomain: string; status: string }> {
    // 구독 확인
    const subscription = await this.subscriptionService.findByUserId(user.id);
    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new ForbiddenException('Active subscription required');
    }

    // 기존 스토어 확인
    const existingShop = await this.shopRepository.findOne({
      where: { userId: user.id },
    });
    if (existingShop) {
      throw new ConflictException('User already has a store');
    }

    // Step 1: Shopify 스토어 생성
    const { shopId, shopDomain } = await this.shopifyService.createShop({
      shopName: dto.brand.brandName,
      email: dto.brand.email,
    });

    // Shop 레코드 생성
    const shop = this.shopRepository.create({
      shopifyId: shopId,
      shopifyDomain: shopDomain,
      userId: user.id,
      generationStep: GenerationStep.GENERATING,
      generationProgress: 10,
      currentStep: 'Store created',
    });
    await this.shopRepository.save(shop);

    // 백그라운드에서 나머지 스텝 실행
    this.continueGeneration(shop.id, dto).catch((error) => {
      console.error('Store generation failed:', error);
      this.updateShopStatus(shop.id, GenerationStep.FAILED, error.message);
    });

    return {
      shopId: shop.id,
      shopDomain,
      status: 'GENERATING',
    };
  }

  private async continueGeneration(
    shopId: string,
    dto: GenerateStoreDto,
  ): Promise<void> {
    const shop = await this.shopRepository.findOne({ where: { id: shopId } });
    if (!shop) return;

    try {
      // Step 2: 소유권 이전
      await this.shopifyService.transferOwnership({
        shopId: shop.shopifyId,
        newOwnerEmail: dto.brand.email,
      });
      shop.generationProgress = 20;
      shop.currentStep = 'Ownership transferred';
      await this.shopRepository.save(shop);

      // Step 3: 앱 설치 및 Admin API token 발급
      const { token } = await this.shopifyAppService.installApp({
        shopDomain: shop.shopifyDomain,
      });
      shop.adminToken = token;
      shop.generationProgress = 40;
      shop.currentStep = 'App installed';
      await this.shopRepository.save(shop);

      // Step 4: Dawn 테마 배포
      await this.shopifyThemeService.installDawnTheme({
        shopDomain: shop.shopifyDomain,
        token,
      });
      shop.generationProgress = 60;
      shop.currentStep = 'Theme installed';
      await this.shopRepository.save(shop);

      // Step 5: 상품 생성
      await this.shopifyProductService.createProducts({
        shopDomain: shop.shopifyDomain,
        token,
        products: dto.products,
      });
      shop.generationProgress = 80;
      shop.currentStep = 'Products created';
      await this.shopRepository.save(shop);

      // Step 6: AI 콘텐츠 생성 및 페이지 배포
      const content = await this.aiService.generateStoreContent({
        brand: dto.brand,
        products: dto.products,
      });

      await this.shopifyProductService.createPages({
        shopDomain: shop.shopifyDomain,
        token,
        pages: [
          {
            title: content.aboutPage.title,
            handle: 'about',
            body: content.aboutPage.body,
          },
          {
            title: content.contactPage.title,
            handle: 'contact',
            body: content.contactPage.body,
          },
          {
            title: content.privacyPolicy.title,
            handle: 'privacy-policy',
            body: content.privacyPolicy.body,
          },
          {
            title: content.termsOfService.title,
            handle: 'terms-of-service',
            body: content.termsOfService.body,
          },
        ],
      });

      shop.generationStep = GenerationStep.COMPLETED;
      shop.generationProgress = 100;
      shop.currentStep = 'Completed';
      await this.shopRepository.save(shop);
    } catch (error) {
      await this.updateShopStatus(
        shopId,
        GenerationStep.FAILED,
        error.message,
      );
    }
  }

  private async updateShopStatus(
    shopId: string,
    status: GenerationStep,
    error?: string,
  ): Promise<void> {
    await this.shopRepository.update(shopId, {
      generationStep: status,
      generationError: error,
    });
  }

  async getStatus(shopId: string, userId: string): Promise<{
    shopId: string;
    shopDomain: string;
    status: string;
    progress: number;
    currentStep: string;
    error?: string;
  }> {
    const shop = await this.shopRepository.findOne({
      where: { id: shopId, userId },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return {
      shopId: shop.id,
      shopDomain: shop.shopifyDomain,
      status: shop.generationStep,
      progress: shop.generationProgress,
      currentStep: shop.currentStep || '',
      error: shop.generationError,
    };
  }
}

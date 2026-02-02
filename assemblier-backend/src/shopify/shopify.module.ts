import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ShopifyService } from './shopify.service';
import { ShopifyAppService } from './shopify-app.service';
import { ShopifyThemeService } from './shopify-theme.service';
import { ShopifyProductService } from './shopify-product.service';
import { ShopifySectionService } from './shopify-section.service';
import { ShopifyStoreService } from './shopify-store.service';

@Module({
  imports: [HttpModule],
  providers: [
    ShopifyService,
    ShopifyAppService,
    ShopifyThemeService,
    ShopifyProductService,
    ShopifySectionService,
    ShopifyStoreService,
  ],
  exports: [
    ShopifyService,
    ShopifyAppService,
    ShopifyThemeService,
    ShopifyProductService,
    ShopifySectionService,
    ShopifyStoreService,
  ],
})
export class ShopifyModule {}

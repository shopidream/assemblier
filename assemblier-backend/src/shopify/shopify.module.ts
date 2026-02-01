import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ShopifyService } from './shopify.service';
import { ShopifyAppService } from './shopify-app.service';
import { ShopifyThemeService } from './shopify-theme.service';
import { ShopifyProductService } from './shopify-product.service';

@Module({
  imports: [HttpModule],
  providers: [
    ShopifyService,
    ShopifyAppService,
    ShopifyThemeService,
    ShopifyProductService,
  ],
  exports: [
    ShopifyService,
    ShopifyAppService,
    ShopifyThemeService,
    ShopifyProductService,
  ],
})
export class ShopifyModule {}

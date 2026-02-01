import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ShopifyService } from './shopify.service';

@Module({
  imports: [HttpModule],
  providers: [ShopifyService],
  exports: [ShopifyService],
})
export class ShopifyModule {}

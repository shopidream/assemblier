import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop } from '../shops/entities/shop.entity';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { SubscriptionModule } from '../subscription/subscription.module';
import { ShopifyModule } from '../shopify/shopify.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shop]),
    SubscriptionModule,
    ShopifyModule,
    AiModule,
  ],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}

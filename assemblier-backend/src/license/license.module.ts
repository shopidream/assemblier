import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicenseController } from './license.controller';
import { LicenseService } from './license.service';
import { Shop } from '../shops/entities/shop.entity';
import { Subscription } from '../subscription/entities/subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Shop, Subscription])],
  controllers: [LicenseController],
  providers: [LicenseService],
  exports: [LicenseService],
})
export class LicenseModule {}

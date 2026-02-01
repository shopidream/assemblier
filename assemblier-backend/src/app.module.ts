import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StripeModule } from './stripe/stripe.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ShopifyModule } from './shopify/shopify.module';
import { StoresModule } from './stores/stores.module';
import { AiModule } from './ai/ai.module';
import { User } from './users/entities/user.entity';
import { Shop } from './shops/entities/shop.entity';
import { Subscription } from './subscription/entities/subscription.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: Number(configService.get('DATABASE_PORT')),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        ssl: configService.get('DATABASE_SSL') !== 'false'
          ? { rejectUnauthorized: false }
          : false,
        entities: [User, Shop, Subscription],
        synchronize: false,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    StripeModule,
    SubscriptionModule,
    ShopifyModule,
    StoresModule,
    AiModule,
  ],
})
export class AppModule {}

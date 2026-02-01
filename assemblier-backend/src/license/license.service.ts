import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop } from '../shops/entities/shop.entity';
import { Subscription } from '../subscription/entities/subscription.entity';

export type LicenseStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';

export interface LicenseStatusResponse {
  shopDomain: string;
  status: LicenseStatus;
  layout: string;
  expiresAt: string;
}

@Injectable()
export class LicenseService {
  private cache = new Map<
    string,
    { status: LicenseStatusResponse; cachedAt: Date }
  >();
  private CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

  constructor(
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async getLicenseStatus(
    shopDomain: string,
  ): Promise<LicenseStatusResponse> {
    // Check cache first
    const cached = this.cache.get(shopDomain);
    if (cached && Date.now() - cached.cachedAt.getTime() < this.CACHE_TTL) {
      return cached.status;
    }

    // 1. Find shop by domain
    const shop = await this.shopRepository.findOne({
      where: { shopifyDomain: shopDomain },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // 2. Find subscription by userId
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId: shop.userId },
    });

    if (!subscription) {
      // No subscription = expired
      const result: LicenseStatusResponse = {
        shopDomain,
        status: 'EXPIRED',
        layout: shop.layout || 'ecommerce',
        expiresAt: new Date().toISOString(),
      };
      this.cacheResult(shopDomain, result);
      return result;
    }

    // 3. Determine license status based on subscription
    const now = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);
    let licenseStatus: LicenseStatus;

    switch (subscription.status) {
      case 'ACTIVE':
        licenseStatus = periodEnd > now ? 'ACTIVE' : 'EXPIRED';
        break;

      case 'PAST_DUE':
        licenseStatus = 'PAST_DUE';
        break;

      case 'CANCELED':
        // Canceled but still in current period = ACTIVE
        // Canceled and period ended = EXPIRED
        licenseStatus = periodEnd > now ? 'ACTIVE' : 'EXPIRED';
        break;

      default:
        licenseStatus = 'EXPIRED';
    }

    const result: LicenseStatusResponse = {
      shopDomain,
      status: licenseStatus,
      layout: shop.layout || 'ecommerce',
      expiresAt: subscription.currentPeriodEnd.toISOString(),
    };

    // Cache the result
    this.cacheResult(shopDomain, result);

    return result;
  }

  private cacheResult(
    shopDomain: string,
    result: LicenseStatusResponse,
  ): void {
    this.cache.set(shopDomain, {
      status: result,
      cachedAt: new Date(),
    });
  }

  // Clear cache for a specific shop (useful for webhook updates)
  clearCache(shopDomain: string): void {
    this.cache.delete(shopDomain);
  }

  // Clear all cache (useful for testing)
  clearAllCache(): void {
    this.cache.clear();
  }
}

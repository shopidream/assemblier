import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LicenseService } from './license.service';
import { Shop } from '../shops/entities/shop.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { NotFoundException } from '@nestjs/common';

describe('LicenseService', () => {
  let service: LicenseService;
  let shopRepository: Repository<Shop>;
  let subscriptionRepository: Repository<Subscription>;

  const mockShopRepository = {
    findOne: jest.fn(),
  };

  const mockSubscriptionRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicenseService,
        {
          provide: getRepositoryToken(Shop),
          useValue: mockShopRepository,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
      ],
    }).compile();

    service = module.get<LicenseService>(LicenseService);
    shopRepository = module.get<Repository<Shop>>(getRepositoryToken(Shop));
    subscriptionRepository = module.get<Repository<Subscription>>(
      getRepositoryToken(Subscription),
    );

    // Clear cache before each test
    service.clearAllCache();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLicenseStatus', () => {
    it('should return ACTIVE when subscription is active and not expired', async () => {
      const shopDomain = 'test.myshopify.com';
      const mockShop = {
        id: '1',
        shopifyDomain: shopDomain,
        userId: 'user1',
        layout: 'ecommerce',
      };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const mockSubscription = {
        id: '1',
        userId: 'user1',
        status: 'ACTIVE',
        currentPeriodEnd: futureDate,
      };

      mockShopRepository.findOne.mockResolvedValue(mockShop);
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.getLicenseStatus(shopDomain);

      expect(result.status).toBe('ACTIVE');
      expect(result.shopDomain).toBe(shopDomain);
      expect(result.layout).toBe('ecommerce');
    });

    it('should return PAST_DUE when subscription status is PAST_DUE', async () => {
      const shopDomain = 'test.myshopify.com';
      const mockShop = {
        id: '1',
        shopifyDomain: shopDomain,
        userId: 'user1',
        layout: 'business',
      };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const mockSubscription = {
        id: '1',
        userId: 'user1',
        status: 'PAST_DUE',
        currentPeriodEnd: futureDate,
      };

      mockShopRepository.findOne.mockResolvedValue(mockShop);
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.getLicenseStatus(shopDomain);

      expect(result.status).toBe('PAST_DUE');
      expect(result.layout).toBe('business');
    });

    it('should return ACTIVE when canceled but currentPeriodEnd is in the future', async () => {
      const shopDomain = 'test.myshopify.com';
      const mockShop = {
        id: '1',
        shopifyDomain: shopDomain,
        userId: 'user1',
        layout: 'ecommerce',
      };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockSubscription = {
        id: '1',
        userId: 'user1',
        status: 'CANCELED',
        currentPeriodEnd: futureDate,
      };

      mockShopRepository.findOne.mockResolvedValue(mockShop);
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.getLicenseStatus(shopDomain);

      expect(result.status).toBe('ACTIVE');
    });

    it('should return EXPIRED when canceled and currentPeriodEnd is in the past', async () => {
      const shopDomain = 'test.myshopify.com';
      const mockShop = {
        id: '1',
        shopifyDomain: shopDomain,
        userId: 'user1',
        layout: 'ecommerce',
      };

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockSubscription = {
        id: '1',
        userId: 'user1',
        status: 'CANCELED',
        currentPeriodEnd: pastDate,
      };

      mockShopRepository.findOne.mockResolvedValue(mockShop);
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.getLicenseStatus(shopDomain);

      expect(result.status).toBe('EXPIRED');
    });

    it('should return EXPIRED when no subscription exists', async () => {
      const shopDomain = 'test.myshopify.com';
      const mockShop = {
        id: '1',
        shopifyDomain: shopDomain,
        userId: 'user1',
        layout: 'ecommerce',
      };

      mockShopRepository.findOne.mockResolvedValue(mockShop);
      mockSubscriptionRepository.findOne.mockResolvedValue(null);

      const result = await service.getLicenseStatus(shopDomain);

      expect(result.status).toBe('EXPIRED');
    });

    it('should throw NotFoundException when shop does not exist', async () => {
      const shopDomain = 'nonexistent.myshopify.com';

      mockShopRepository.findOne.mockResolvedValue(null);

      await expect(service.getLicenseStatus(shopDomain)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should cache results and return cached value within TTL', async () => {
      const shopDomain = 'test.myshopify.com';
      const mockShop = {
        id: '1',
        shopifyDomain: shopDomain,
        userId: 'user1',
        layout: 'ecommerce',
      };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const mockSubscription = {
        id: '1',
        userId: 'user1',
        status: 'ACTIVE',
        currentPeriodEnd: futureDate,
      };

      mockShopRepository.findOne.mockResolvedValue(mockShop);
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      // First call - should hit DB
      const result1 = await service.getLicenseStatus(shopDomain);
      expect(mockShopRepository.findOne).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await service.getLicenseStatus(shopDomain);
      expect(mockShopRepository.findOne).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(result2).toEqual(result1);
    });

    it('should refresh cache after clearing', async () => {
      const shopDomain = 'test.myshopify.com';
      const mockShop = {
        id: '1',
        shopifyDomain: shopDomain,
        userId: 'user1',
        layout: 'ecommerce',
      };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const mockSubscription = {
        id: '1',
        userId: 'user1',
        status: 'ACTIVE',
        currentPeriodEnd: futureDate,
      };

      mockShopRepository.findOne.mockResolvedValue(mockShop);
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      // First call
      await service.getLicenseStatus(shopDomain);
      expect(mockShopRepository.findOne).toHaveBeenCalledTimes(1);

      // Clear cache
      service.clearCache(shopDomain);

      // Second call after clearing - should hit DB again
      await service.getLicenseStatus(shopDomain);
      expect(mockShopRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should return EXPIRED when active subscription period has ended', async () => {
      const shopDomain = 'test.myshopify.com';
      const mockShop = {
        id: '1',
        shopifyDomain: shopDomain,
        userId: 'user1',
        layout: 'ecommerce',
      };

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockSubscription = {
        id: '1',
        userId: 'user1',
        status: 'ACTIVE',
        currentPeriodEnd: pastDate,
      };

      mockShopRepository.findOne.mockResolvedValue(mockShop);
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.getLicenseStatus(shopDomain);

      expect(result.status).toBe('EXPIRED');
    });
  });
});

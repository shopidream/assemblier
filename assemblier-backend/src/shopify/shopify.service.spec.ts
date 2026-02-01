import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ShopifyService } from './shopify.service';
import { of, throwError } from 'rxjs';

describe('ShopifyService', () => {
  let service: ShopifyService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopifyService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ShopifyService>(ShopifyService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('createShop', () => {
    it('should create a shop successfully', async () => {
      const mockResponse = {
        data: {
          development_store: {
            id: 'shop123',
            domain: 'test-shop.myshopify.com',
          },
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse) as any);

      const result = await service.createShop({
        shopName: 'Test Shop',
        email: 'test@example.com',
      });

      expect(result).toEqual({
        shopId: 'shop123',
        shopDomain: 'test-shop.myshopify.com',
      });
    });

    it('should throw error when API fails', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => new Error('API Error')) as any);

      await expect(
        service.createShop({
          shopName: 'Test Shop',
          email: 'test@example.com',
        }),
      ).rejects.toThrow('Failed to create shop');
    });
  });

  describe('transferOwnership', () => {
    it('should transfer ownership successfully', async () => {
      const mockResponse = { data: { success: true } };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse) as any);

      const result = await service.transferOwnership({
        shopId: 'shop123',
        newOwnerEmail: 'newowner@example.com',
      });

      expect(result).toEqual({ transferred: true });
    });

    it('should throw error when API fails', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => new Error('API Error')) as any);

      await expect(
        service.transferOwnership({
          shopId: 'shop123',
          newOwnerEmail: 'newowner@example.com',
        }),
      ).rejects.toThrow('Failed to transfer ownership');
    });
  });
});

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ShopifyService {
  private readonly baseURL = 'https://partners.shopify.com/api/2024-01';

  constructor(private httpService: HttpService) {}

  async createShop(params: {
    shopName: string;
    email: string;
  }): Promise<{ shopId: string; shopDomain: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseURL}/development_stores.json`,
          {
            development_store: {
              name: params.shopName,
              email: params.email,
            },
          },
          {
            headers: {
              'X-Shopify-Access-Token': process.env.SHOPIFY_APP_CLIENT_SECRET,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return {
        shopId: response.data.development_store.id,
        shopDomain: response.data.development_store.domain,
      };
    } catch (error) {
      throw new Error(`Failed to create shop: ${error.message}`);
    }
  }

  async transferOwnership(params: {
    shopId: string;
    newOwnerEmail: string;
  }): Promise<{ transferred: boolean }> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.baseURL}/development_stores/${params.shopId}/transfer.json`,
          {
            transfer: {
              email: params.newOwnerEmail,
            },
          },
          {
            headers: {
              'X-Shopify-Access-Token': process.env.SHOPIFY_APP_CLIENT_SECRET,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return { transferred: true };
    } catch (error) {
      throw new Error(`Failed to transfer ownership: ${error.message}`);
    }
  }
}

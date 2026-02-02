import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ShopifyStoreService {
  constructor(private httpService: HttpService) {}

  /**
   * Configure store language, currency, and weight unit settings
   * Uses Shopify Admin API to set primary_locale, currency, and weight_unit
   *
   * @param params - Configuration parameters
   * @returns Success status
   */
  async configureStore(params: {
    shopDomain: string;
    token: string;
    language: string;
    currency: string;
    weightUnit: string;
  }): Promise<{ configured: boolean }> {
    const { shopDomain, token, language, currency, weightUnit } = params;

    try {
      await firstValueFrom(
        this.httpService.put(
          `https://${shopDomain}/admin/api/2024-01/shop.json`,
          {
            shop: {
              primary_locale: language,
              currency: currency,
              weight_unit: weightUnit,
            },
          },
          {
            headers: {
              'X-Shopify-Access-Token': token,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return { configured: true };
    } catch (error) {
      console.error('Failed to configure store:', error.message);
      throw new Error(
        `Failed to configure store language/currency: ${error.message}`,
      );
    }
  }
}

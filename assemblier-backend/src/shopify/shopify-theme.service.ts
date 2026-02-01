import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ShopifyThemeService {
  constructor(private httpService: HttpService) {}

  async installDawnTheme(params: {
    shopDomain: string;
    token: string;
  }): Promise<{ themeId: string }> {
    try {
      // Dawn 테마 설치
      const createResponse = await firstValueFrom(
        this.httpService.post(
          `https://${params.shopDomain}/admin/api/2024-01/themes.json`,
          {
            theme: {
              name: 'Dawn',
              src: 'https://github.com/Shopify/dawn/archive/refs/heads/main.zip',
              role: 'main',
            },
          },
          {
            headers: {
              'X-Shopify-Access-Token': params.token,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return {
        themeId: createResponse.data.theme.id,
      };
    } catch (error) {
      throw new Error(`Failed to install Dawn theme: ${error.message}`);
    }
  }
}

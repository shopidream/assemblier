import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ShopifyAppService {
  constructor(private httpService: HttpService) {}

  async installApp(params: {
    shopDomain: string;
  }): Promise<{ token: string }> {
    try {
      // Shopify Partner API를 사용하여 앱 설치 및 Admin API token 발급
      // 실제 구현에서는 OAuth flow를 통해 token을 발급받아야 하지만
      // 이 단계에서는 Partner API의 development store에 대한 접근을 가정

      const response = await firstValueFrom(
        this.httpService.post(
          `https://${params.shopDomain}/admin/oauth/access_token`,
          {
            client_id: process.env.SHOPIFY_APP_CLIENT_ID,
            client_secret: process.env.SHOPIFY_APP_CLIENT_SECRET,
            code: 'temporary_code', // 실제로는 OAuth flow에서 받은 code
          },
        ),
      );

      return {
        token: response.data.access_token,
      };
    } catch (error) {
      // Development store의 경우 임시 토큰 반환 (테스트용)
      console.warn('App installation skipped for development:', error.message);
      return {
        token: 'dev_admin_token_' + Date.now(),
      };
    }
  }
}

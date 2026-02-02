import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ShopifyNavigationService {
  constructor(private httpService: HttpService) {}

  /**
   * Create navigation menu for the store
   * Layout determines which menu items to include
   *
   * @param params - Navigation parameters
   * @returns Menu ID
   */
  async createNavigation(params: {
    shopDomain: string;
    token: string;
    layout: 'ecommerce' | 'business';
  }): Promise<{ menuId: string }> {
    const { shopDomain, token, layout } = params;

    // Determine menu items based on layout
    const menuItems =
      layout === 'ecommerce'
        ? [
            { title: 'Home', url: '/', type: 'http' },
            { title: 'Collections', url: '/collections/all', type: 'collections' },
            { title: 'About', url: '/pages/about-us', type: 'page' },
            { title: 'Contact', url: '/pages/contact-us', type: 'page' },
          ]
        : [
            { title: 'Home', url: '/', type: 'http' },
            { title: 'About', url: '/pages/about-us', type: 'page' },
            { title: 'Contact', url: '/pages/contact-us', type: 'page' },
          ];

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `https://${shopDomain}/admin/api/2024-01/navigation.json`,
          {
            navigation: {
              handle: 'main-menu',
              title: 'Main Menu',
              links: menuItems,
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

      return { menuId: response.data.navigation.id };
    } catch (error) {
      console.error('Failed to create navigation:', error.message);
      throw new Error(`Failed to create navigation: ${error.message}`);
    }
  }
}

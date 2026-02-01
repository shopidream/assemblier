import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface Product {
  name: string;
  price: number;
  options?: string;
}

interface Page {
  title: string;
  handle: string;
  body: string;
}

@Injectable()
export class ShopifyProductService {
  constructor(private httpService: HttpService) {}

  async createProducts(params: {
    shopDomain: string;
    token: string;
    products: Product[];
  }): Promise<{ createdProducts: Array<{ id: string; title: string }> }> {
    const createdProducts: Array<{ id: string; title: string }> = [];

    for (const product of params.products) {
      try {
        const response = await firstValueFrom(
          this.httpService.post(
            `https://${params.shopDomain}/admin/api/2024-01/products.json`,
            {
              product: {
                title: product.name,
                variants: [
                  {
                    price: product.price.toString(),
                    inventory_management: 'shopify',
                    inventory_quantity: 100,
                  },
                ],
                options: product.options
                  ? [{ name: 'Option', values: [product.options] }]
                  : undefined,
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

        createdProducts.push({
          id: response.data.product.id,
          title: response.data.product.title,
        });
      } catch (error) {
        console.error(`Failed to create product ${product.name}:`, error.message);
      }
    }

    return { createdProducts };
  }

  async createPages(params: {
    shopDomain: string;
    token: string;
    pages: Page[];
  }): Promise<{ createdPages: Array<{ id: string; handle: string }> }> {
    const createdPages: Array<{ id: string; handle: string }> = [];

    for (const page of params.pages) {
      try {
        const response = await firstValueFrom(
          this.httpService.post(
            `https://${params.shopDomain}/admin/api/2024-01/pages.json`,
            {
              page: {
                title: page.title,
                handle: page.handle,
                body_html: page.body,
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

        createdPages.push({
          id: response.data.page.id,
          handle: response.data.page.handle,
        });
      } catch (error) {
        console.error(`Failed to create page ${page.title}:`, error.message);
      }
    }

    return { createdPages };
  }
}

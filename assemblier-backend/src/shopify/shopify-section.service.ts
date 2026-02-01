import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ShopifySectionService {
  constructor(private httpService: HttpService) {}

  async deploySections(params: {
    shopDomain: string;
    token: string;
    layout: 'ecommerce' | 'business';
    marketingCopy?: {
      heroTitle: string;
      heroSubtitle: string;
      ctaText: string;
      ctaButtonLabel: string;
    };
    brandInfo?: {
      companyName: string;
      email: string;
      phone?: string;
      address?: string;
    };
  }): Promise<{ deployedSections: string[] }> {
    const { shopDomain, token, layout, marketingCopy, brandInfo } = params;
    const deployedSections: string[] = [];

    // Define which sections to deploy based on layout
    const sectionsToDeploy =
      layout === 'ecommerce'
        ? [
            'app-header',
            'app-hero',
            'app-pdp',
            'app-cta',
            'app-footer',
          ]
        : [
            'app-header',
            'app-hero',
            'app-cta',
            'app-contact',
            'app-footer',
          ];

    // Get theme ID (assume we're using the main theme for now)
    const themeId = await this.getMainThemeId(shopDomain, token);

    // Deploy each section
    for (const sectionName of sectionsToDeploy) {
      try {
        let sectionContent = this.readSectionFile(sectionName);

        // Inject marketing copy and brand info into sections
        sectionContent = this.injectDynamicContent(
          sectionContent,
          sectionName,
          marketingCopy,
          brandInfo,
        );

        await this.uploadAsset(
          shopDomain,
          token,
          themeId,
          `sections/${sectionName}.liquid`,
          sectionContent,
        );

        deployedSections.push(sectionName);
      } catch (error) {
        console.error(`Failed to deploy section ${sectionName}:`, error.message);
      }
    }

    // Deploy style skin CSS
    try {
      const cssContent = this.readSkinFile('default');
      await this.uploadAsset(
        shopDomain,
        token,
        themeId,
        'assets/app-skin.css',
        cssContent,
      );
      deployedSections.push('app-skin.css');

      // Add CSS reference to theme.liquid
      await this.addCssToTheme(shopDomain, token, themeId);
    } catch (error) {
      console.error('Failed to deploy style skin:', error.message);
    }

    return { deployedSections };
  }

  private async getMainThemeId(
    shopDomain: string,
    token: string,
  ): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://${shopDomain}/admin/api/2024-01/themes.json`,
          {
            headers: {
              'X-Shopify-Access-Token': token,
            },
          },
        ),
      );

      // Find the main/published theme
      const mainTheme = response.data.themes.find(
        (theme: any) => theme.role === 'main',
      );

      if (!mainTheme) {
        throw new Error('No main theme found');
      }

      return mainTheme.id;
    } catch (error) {
      console.error('Failed to get theme ID:', error.message);
      throw error;
    }
  }

  private async uploadAsset(
    shopDomain: string,
    token: string,
    themeId: string,
    assetKey: string,
    assetValue: string,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.put(
          `https://${shopDomain}/admin/api/2024-01/themes/${themeId}/assets.json`,
          {
            asset: {
              key: assetKey,
              value: assetValue,
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
    } catch (error) {
      console.error(`Failed to upload asset ${assetKey}:`, error.message);
      throw error;
    }
  }

  private readSectionFile(sectionName: string): string {
    const filePath = path.join(
      __dirname,
      'sections',
      `${sectionName}.liquid`,
    );
    return fs.readFileSync(filePath, 'utf-8');
  }

  private readSkinFile(skinName: string): string {
    const filePath = path.join(__dirname, 'skins', `${skinName}.css`);
    return fs.readFileSync(filePath, 'utf-8');
  }

  private injectDynamicContent(
    sectionContent: string,
    sectionName: string,
    marketingCopy?: {
      heroTitle: string;
      heroSubtitle: string;
      ctaText: string;
      ctaButtonLabel: string;
    },
    brandInfo?: {
      companyName: string;
      email: string;
      phone?: string;
      address?: string;
    },
  ): string {
    let content = sectionContent;

    // Inject marketing copy into hero and CTA sections
    if (sectionName === 'app-hero' && marketingCopy) {
      content = content.replace(
        '"default": "Welcome to Our Store"',
        `"default": "${this.escapeJson(marketingCopy.heroTitle)}"`,
      );
      content = content.replace(
        '"default": "Discover amazing products"',
        `"default": "${this.escapeJson(marketingCopy.heroSubtitle)}"`,
      );
      content = content.replace(
        '"default": "Shop Now"',
        `"default": "${this.escapeJson(marketingCopy.ctaButtonLabel)}"`,
      );
    }

    if (sectionName === 'app-cta' && marketingCopy) {
      content = content.replace(
        '"default": "Ready to Get Started?"',
        `"default": "${this.escapeJson(marketingCopy.ctaText)}"`,
      );
      content = content.replace(
        '"default": "Shop Now"',
        `"default": "${this.escapeJson(marketingCopy.ctaButtonLabel)}"`,
      );
    }

    // Inject brand info into header and footer
    if (sectionName === 'app-header' && brandInfo) {
      content = content.replace(
        '"default": "Store Name"',
        `"default": "${this.escapeJson(brandInfo.companyName)}"`,
      );
    }

    if (sectionName === 'app-footer' && brandInfo) {
      content = content.replace(
        '"default": "Company Name"',
        `"default": "${this.escapeJson(brandInfo.companyName)}"`,
      );
      if (brandInfo.email) {
        content = content.replace(
          '"contact_email",',
          `"contact_email",\n      "default": "${this.escapeJson(brandInfo.email)}"`,
        );
      }
      if (brandInfo.phone) {
        content = content.replace(
          '"contact_phone",',
          `"contact_phone",\n      "default": "${this.escapeJson(brandInfo.phone)}"`,
        );
      }
      if (brandInfo.address) {
        content = content.replace(
          '"contact_address",',
          `"contact_address",\n      "default": "${this.escapeJson(brandInfo.address)}"`,
        );
      }
    }

    return content;
  }

  private escapeJson(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  private async addCssToTheme(
    shopDomain: string,
    token: string,
    themeId: string,
  ): Promise<void> {
    try {
      // Get current theme.liquid
      const response = await firstValueFrom(
        this.httpService.get(
          `https://${shopDomain}/admin/api/2024-01/themes/${themeId}/assets.json?asset[key]=layout/theme.liquid`,
          {
            headers: {
              'X-Shopify-Access-Token': token,
            },
          },
        ),
      );

      let themeContent = response.data.asset.value;

      // Check if CSS link already exists
      if (!themeContent.includes('app-skin.css')) {
        // Add CSS link before </head>
        const cssLink =
          '\n  {{ \'app-skin.css\' | asset_url | stylesheet_tag }}\n';
        themeContent = themeContent.replace('</head>', `${cssLink}</head>`);

        // Upload modified theme.liquid
        await this.uploadAsset(
          shopDomain,
          token,
          themeId,
          'layout/theme.liquid',
          themeContent,
        );
      }
    } catch (error) {
      console.error('Failed to add CSS to theme:', error.message);
      // Non-critical error, don't throw
    }
  }
}

import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

interface BrandInfo {
  brandName: string;
  companyName: string;
  address?: string;
  email: string;
  phone?: string;
  targetMarket: string;
  language: string;
}

interface Product {
  name: string;
  price: number;
  options?: string;
}

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateStoreContent(params: {
    brand: BrandInfo;
    products: Product[];
  }): Promise<{
    aboutPage: { title: string; body: string };
    contactPage: { title: string; body: string };
    privacyPolicy: { title: string; body: string };
    termsOfService: { title: string; body: string };
  }> {
    const { brand, products } = params;

    const [aboutPage, contactPage, privacyPolicy, termsOfService] =
      await Promise.all([
        this.generateAboutPage(brand, products),
        this.generateContactPage(brand),
        this.generatePrivacyPolicy(brand),
        this.generateTermsOfService(brand),
      ]);

    return {
      aboutPage,
      contactPage,
      privacyPolicy,
      termsOfService,
    };
  }

  private async generateAboutPage(
    brand: BrandInfo,
    products: Product[],
  ): Promise<{ title: string; body: string }> {
    const prompt = `Generate an "About Us" page for an e-commerce store.

Brand Name: ${brand.brandName}
Company Name: ${brand.companyName}
Products: ${products.map((p) => p.name).join(', ')}
Target Market: ${brand.targetMarket}
Language: ${brand.language}

Write a professional and engaging "About Us" page in ${brand.language}.
The content should be in HTML format with proper tags (p, h2, ul, etc.).
Do not include the page title in the HTML content.`;

    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return {
      title: 'About Us',
      body: response.choices[0].message.content || '',
    };
  }

  private async generateContactPage(
    brand: BrandInfo,
  ): Promise<{ title: string; body: string }> {
    const prompt = `Generate a "Contact Us" page for an e-commerce store.

Brand Name: ${brand.brandName}
Company Name: ${brand.companyName}
Email: ${brand.email}
Phone: ${brand.phone || 'Not provided'}
Address: ${brand.address || 'Not provided'}
Language: ${brand.language}

Write a professional "Contact Us" page in ${brand.language}.
Include the contact information provided above.
The content should be in HTML format with proper tags.
Do not include the page title in the HTML content.`;

    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return {
      title: 'Contact Us',
      body: response.choices[0].message.content || '',
    };
  }

  private async generatePrivacyPolicy(
    brand: BrandInfo,
  ): Promise<{ title: string; body: string }> {
    const prompt = `Generate a "Privacy Policy" page for an e-commerce store.

Company Name: ${brand.companyName}
Target Market: ${brand.targetMarket}
Language: ${brand.language}

Write a comprehensive privacy policy in ${brand.language}.
The content should be in HTML format with proper tags.
Do not include the page title in the HTML content.
Include sections about data collection, usage, and user rights.`;

    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    });

    return {
      title: 'Privacy Policy',
      body: response.choices[0].message.content || '',
    };
  }

  private async generateTermsOfService(
    brand: BrandInfo,
  ): Promise<{ title: string; body: string }> {
    const prompt = `Generate "Terms of Service" page for an e-commerce store.

Company Name: ${brand.companyName}
Target Market: ${brand.targetMarket}
Language: ${brand.language}

Write comprehensive terms of service in ${brand.language}.
The content should be in HTML format with proper tags.
Do not include the page title in the HTML content.
Include sections about purchases, returns, and liability.`;

    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    });

    return {
      title: 'Terms of Service',
      body: response.choices[0].message.content || '',
    };
  }

  async determineLayout(params: {
    brand: {
      brandName: string;
      targetMarket: string;
    };
    products: Array<{ name: string; price: number }>;
  }): Promise<{ layout: 'ecommerce' | 'business' }> {
    const { brand, products } = params;

    // Simple logic: if products exist and have prices, it's ecommerce
    // Otherwise, it's a business site
    const hasProducts = products && products.length > 0;
    const hasPrices = products.some((p) => p.price > 0);

    if (hasProducts && hasPrices) {
      return { layout: 'ecommerce' };
    }

    return { layout: 'business' };
  }

  async generateProductDescriptions(params: {
    brand: { brandName: string; language: string };
    products: Array<{ name: string; price: number; options?: string }>;
  }): Promise<Array<{ productName: string; description: string }>> {
    const { brand, products } = params;

    const descriptions = await Promise.all(
      products.map(async (product) => {
        const prompt = `Generate a compelling product description for an e-commerce product.

Brand Name: ${brand.brandName}
Product Name: ${product.name}
Price: ${product.price}
Options: ${product.options || 'None'}
Language: ${brand.language}

Write a professional and engaging product description in ${brand.language}.
The description should be 2-3 paragraphs in HTML format with <p> tags.
Do not include the product name as a heading.`;

        const response = await this.openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        });

        return {
          productName: product.name,
          description: response.choices[0].message.content || '',
        };
      }),
    );

    return descriptions;
  }

  async generateMarketingCopy(params: {
    brand: { brandName: string; targetMarket: string; language: string };
    layout: 'ecommerce' | 'business';
  }): Promise<{
    heroTitle: string;
    heroSubtitle: string;
    ctaText: string;
    ctaButtonLabel: string;
  }> {
    const { brand, layout } = params;

    const prompt = `Generate marketing copy for a ${layout} website.

Brand Name: ${brand.brandName}
Target Market: ${brand.targetMarket}
Language: ${brand.language}
Layout Type: ${layout}

Generate the following in ${brand.language}:
1. Hero Title: A catchy main headline (max 60 characters)
2. Hero Subtitle: A supporting tagline (max 120 characters)
3. CTA Text: Call-to-action section text (1-2 sentences)
4. CTA Button Label: Button text (max 20 characters)

${layout === 'ecommerce' ? 'Focus on products and shopping.' : 'Focus on services and contact.'}

Return the response in JSON format:
{
  "heroTitle": "...",
  "heroSubtitle": "...",
  "ctaText": "...",
  "ctaButtonLabel": "..."
}`;

    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);

    return {
      heroTitle: parsed.heroTitle || brand.brandName,
      heroSubtitle: parsed.heroSubtitle || `Welcome to ${brand.brandName}`,
      ctaText: parsed.ctaText || 'Get started today',
      ctaButtonLabel: parsed.ctaButtonLabel || 'Shop Now',
    };
  }
}

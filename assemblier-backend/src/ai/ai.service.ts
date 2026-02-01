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
}

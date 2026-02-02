export class GenerateStoreDto {
  brand: {
    brandName: string;
    companyName: string;
    address?: string;
    email: string;
    phone?: string;
    targetMarket: string;
    language: string;
    currency: string;
    weightUnit: string;
  };

  products: Array<{
    name: string;
    price: number;
    options?: string;
  }>;
}

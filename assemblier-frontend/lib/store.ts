const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface StoreData {
  brand: {
    brandName: string;
    companyName: string;
    address?: string;
    email: string;
    phone?: string;
    targetMarket: string;
    language: string;
    currency: string;
  };
  products: Array<{
    name: string;
    price: number;
    options?: string;
  }>;
}

export async function generateStore(data: StoreData) {
  const res = await fetch(`${API_URL}/stores/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Store generation failed');
  }

  return res.json();
}

export async function getStoreStatus(shopId: string) {
  const res = await fetch(`${API_URL}/stores/status/${shopId}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to get store status');
  }

  return res.json();
}

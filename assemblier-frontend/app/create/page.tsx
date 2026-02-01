'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, getSubscriptionStatus } from '@/lib/auth';
import { generateStore, getStoreStatus, StoreData } from '@/lib/store';

export default function CreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [shopId, setShopId] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('');
  const [error, setError] = useState('');

  // Form data
  const [brand, setBrand] = useState({
    brandName: '',
    companyName: '',
    address: '',
    email: '',
    phone: '',
    targetMarket: 'US',
    language: 'en',
    currency: 'USD',
  });

  const [products, setProducts] = useState([
    { name: '', price: 0, options: '' },
  ]);

  useEffect(() => {
    async function checkAuth() {
      const user = await getMe();
      if (!user) {
        router.push('/login');
        return;
      }

      const subscription = await getSubscriptionStatus();
      if (!subscription || subscription.status !== 'ACTIVE') {
        router.push('/dashboard');
        return;
      }

      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const addProduct = () => {
    setProducts([...products, { name: '', price: 0, options: '' }]);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: string, value: any) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setProducts(newProducts);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!brand.brandName || !brand.companyName || !brand.email) {
        setError('Please fill in all required fields');
        return;
      }
    } else if (step === 2) {
      if (products.length === 0 || !products[0].name || !products[0].price) {
        setError('Please add at least one product');
        return;
      }
    }

    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');

    try {
      const data: StoreData = {
        brand,
        products: products.filter((p) => p.name && p.price),
      };

      const result = await generateStore(data);
      setShopId(result.shopId);

      // Start polling for status
      pollStatus(result.shopId);
    } catch (err: any) {
      setError(err.message);
      setGenerating(false);
    }
  };

  const pollStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await getStoreStatus(id);
        setProgress(status.progress);
        setCurrentStepText(status.currentStep);

        if (status.status === 'COMPLETED') {
          clearInterval(interval);
          setGenerating(false);
        } else if (status.status === 'FAILED') {
          clearInterval(interval);
          setGenerating(false);
          setError(status.error || 'Store generation failed');
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Create Store</h1>

          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    s <= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-24 h-1 ${s < step ? 'bg-blue-600' : 'bg-gray-300'}`}
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Step 1: Brand & Country */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Step 1: Brand & Country
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    value={brand.brandName}
                    onChange={(e) =>
                      setBrand({ ...brand, brandName: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={brand.companyName}
                    onChange={(e) =>
                      setBrand({ ...brand, companyName: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={brand.email}
                    onChange={(e) =>
                      setBrand({ ...brand, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={brand.phone}
                    onChange={(e) =>
                      setBrand({ ...brand, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={brand.address}
                    onChange={(e) =>
                      setBrand({ ...brand, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Target Market
                  </label>
                  <select
                    value={brand.targetMarket}
                    onChange={(e) =>
                      setBrand({ ...brand, targetMarket: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="US">United States</option>
                    <option value="KR">South Korea</option>
                    <option value="JP">Japan</option>
                    <option value="GB">United Kingdom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Language
                  </label>
                  <select
                    value={brand.language}
                    onChange={(e) =>
                      setBrand({ ...brand, language: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="en">English</option>
                    <option value="ko">Korean</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Currency
                  </label>
                  <select
                    value={brand.currency}
                    onChange={(e) =>
                      setBrand({ ...brand, currency: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="USD">USD</option>
                    <option value="KRW">KRW</option>
                    <option value="JPY">JPY</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Products */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Step 2: Products</h2>

              {products.map((product, index) => (
                <div key={index} className="mb-4 p-4 border rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Product {index + 1}</h3>
                    {products.length > 1 && (
                      <button
                        onClick={() => removeProduct(index)}
                        className="text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) =>
                          updateProduct(index, 'name', e.target.value)
                        }
                        className="w-full px-3 py-2 border rounded"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Price *
                      </label>
                      <input
                        type="number"
                        value={product.price}
                        onChange={(e) =>
                          updateProduct(index, 'price', parseFloat(e.target.value))
                        }
                        className="w-full px-3 py-2 border rounded"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Options
                      </label>
                      <input
                        type="text"
                        value={product.options}
                        onChange={(e) =>
                          updateProduct(index, 'options', e.target.value)
                        }
                        className="w-full px-3 py-2 border rounded"
                        placeholder="e.g., Size, Color"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addProduct}
                className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                + Add Product
              </button>
            </div>
          )}

          {/* Step 3: Summary & Generate */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Step 3: Generate Store
              </h2>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Brand Information</h3>
                <p>Brand: {brand.brandName}</p>
                <p>Company: {brand.companyName}</p>
                <p>Email: {brand.email}</p>
                <p>Target Market: {brand.targetMarket}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Products</h3>
                <ul className="list-disc list-inside">
                  {products
                    .filter((p) => p.name && p.price)
                    .map((p, i) => (
                      <li key={i}>
                        {p.name} - ${p.price}
                      </li>
                    ))}
                </ul>
              </div>

              {generating && (
                <div className="mb-6">
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress: {progress}%</span>
                      <span>{currentStepText}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {progress === 100 && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  Store generated successfully!
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 && !generating && (
              <button
                onClick={handleBack}
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Back
              </button>
            )}

            {step < 3 && (
              <button
                onClick={handleNext}
                className="ml-auto px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Next
              </button>
            )}

            {step === 3 && !generating && progress !== 100 && (
              <button
                onClick={handleGenerate}
                className="ml-auto px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Generate Store
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

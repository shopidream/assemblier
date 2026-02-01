'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getMe,
  logout,
  getSubscriptionStatus,
  createSubscription,
  cancelSubscription,
} from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      const userData = await getMe();
      if (!userData) {
        router.push('/login');
        return;
      }

      setUser(userData);

      const subData = await getSubscriptionStatus();
      setSubscription(subData);
      setLoading(false);
    }

    loadData();
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleCreateSubscription = async (plan: 'STARTER' | 'PRO') => {
    setError('');
    try {
      await createSubscription(plan);
      const subData = await getSubscriptionStatus();
      setSubscription(subData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancelSubscription = async () => {
    setError('');
    try {
      await cancelSubscription();
      const subData = await getSubscriptionStatus();
      setSubscription(subData);
    } catch (err: any) {
      setError(err.message);
    }
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Subscription Status</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {subscription ? (
            <div>
              <div className="mb-4">
                <p>
                  <span className="font-semibold">Plan:</span>{' '}
                  {subscription.plan}
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{' '}
                  {subscription.status}
                </p>
                <p>
                  <span className="font-semibold">Current Period End:</span>{' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Cancel Subscription
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-4">You don't have an active subscription.</p>
              <div className="space-x-4">
                <button
                  onClick={() => handleCreateSubscription('STARTER')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Subscribe to Starter
                </button>
                <button
                  onClick={() => handleCreateSubscription('PRO')}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Subscribe to Pro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

  // Determine banner to show based on subscription status
  const getBanner = () => {
    if (!subscription) return null;

    const now = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);

    switch (subscription.status) {
      case 'PAST_DUE':
        return (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
            <strong>⚠ Payment Failed</strong>
            <p>Your payment method could not be charged. Please update your payment method to avoid service interruption.</p>
          </div>
        );

      case 'CANCELED':
        return (
          <div className="mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-800 rounded">
            <strong>ℹ Subscription Canceled</strong>
            <p>Your subscription will end on {periodEnd.toLocaleDateString()}. You can continue using the service until then.</p>
          </div>
        );

      default:
        // Check if subscription is expired (period ended)
        if (now > periodEnd) {
          return (
            <div className="mb-6 p-6 bg-red-600 text-white rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-2">🚫 Subscription Expired</h2>
              <p className="mb-4">
                Your subscription has expired. Your store features are currently limited.
                Resubscribe to restore full functionality.
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => handleCreateSubscription('STARTER')}
                  className="px-6 py-3 bg-white text-red-600 font-bold rounded hover:bg-gray-100"
                >
                  Resubscribe to Starter
                </button>
                <button
                  onClick={() => handleCreateSubscription('PRO')}
                  className="px-6 py-3 bg-white text-red-600 font-bold rounded hover:bg-gray-100"
                >
                  Resubscribe to Pro
                </button>
              </div>
            </div>
          );
        }
        return null;
    }
  };

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

        {/* Subscription Status Banner */}
        {getBanner()}

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

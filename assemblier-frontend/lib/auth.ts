const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function register(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Registration failed');
  }

  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Login failed');
  }

  return res.json();
}

export async function logout() {
  const res = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Logout failed');
  }

  return res.json();
}

export async function getMe() {
  const res = await fetch(`${API_URL}/auth/me`, {
    credentials: 'include',
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export async function getSubscriptionStatus() {
  const res = await fetch(`${API_URL}/subscription/status`, {
    credentials: 'include',
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export async function createSubscription(plan: 'STARTER' | 'PRO') {
  const res = await fetch(`${API_URL}/subscription/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ plan }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Subscription creation failed');
  }

  return res.json();
}

export async function cancelSubscription() {
  const res = await fetch(`${API_URL}/subscription/cancel`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Subscription cancellation failed');
  }

  return res.json();
}

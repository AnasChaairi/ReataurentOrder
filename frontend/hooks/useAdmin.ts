"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function useAdmin() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Not logged in — send to login page, replace history so back button doesn't loop
      router.replace('/auth/login');
      return;
    }

    if (user.role !== 'ADMIN' && user.role !== 'RESTAURANT_OWNER' && user.role !== 'WAITER') {
      // Logged in but not staff — send home
      router.replace('/');
    }
  }, [user, isLoading, router]);

  return {
    isAdmin: user?.role === 'ADMIN',
    isOwner: user?.role === 'RESTAURANT_OWNER',
    isWaiter: user?.role === 'WAITER',
    user,
    isLoading,
  };
}

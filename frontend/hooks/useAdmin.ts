"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, User } from '@/services/auth.service';

export function useAdmin() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const currentUser = await authService.checkAuthStatus();

      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      if (currentUser.role !== 'ADMIN' && currentUser.role !== 'RESTAURANT_OWNER') {
        router.push('/');
        return;
      }

      setUser(currentUser);
      setIsAdmin(currentUser.role === 'ADMIN');
      setIsOwner(currentUser.role === 'RESTAURANT_OWNER');
      setIsLoading(false);
    };

    checkAdmin();
  }, [router]);

  return { isAdmin, isOwner, user, isLoading };
}

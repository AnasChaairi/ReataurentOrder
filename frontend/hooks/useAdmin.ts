"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';

export function useAdmin() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = () => {
      const user = authService.getCurrentUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      if (user.role !== 'ADMIN') {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      setIsLoading(false);
    };

    checkAdmin();
  }, [router]);

  return { isAdmin, isLoading };
}

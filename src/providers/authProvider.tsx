'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/use-auth.store';
import { TruckLoader } from '@/components/TruckLoader';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkSession, user, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!user && !isAuthenticated) {
      checkSession();
    }
  }, [checkSession, user, isAuthenticated]);

  if (isLoading) {
    return <TruckLoader variant="page" message="Cargando Corditrans..." />;
  }

  return <>{children}</>;
}
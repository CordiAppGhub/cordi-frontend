'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/use-auth.store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkSession, user } = useAuthStore();

  useEffect(() => {
    // Apenas carga la app, si no hay usuario en memoria, intentamos recuperarlo
    if (!user) {
      checkSession();
    }
  }, []);

  // Opcional: Puedes poner una pantalla de carga general mientras verifica el token
  // if (isCheckingAuth) return <div>Verificando sesión...</div>;

  return <>{children}</>;
}
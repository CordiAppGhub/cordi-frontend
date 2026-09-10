'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/use-auth.store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkSession, user, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!user && !isAuthenticated) {
      checkSession();
    }
  }, [checkSession, user, isAuthenticated]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f0f2f5',
        fontFamily: 'sans-serif',
        color: '#333'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #d1d5db',
          borderTopColor: '#0056b3',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '1rem'
        }} />
        <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>Cargando Corditrans...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
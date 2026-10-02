'use client';

import React, { createContext, useContext } from 'react';
import { useDriverPortal } from '@/hooks/use-driverPortal';

const DriverAuthContext = createContext<ReturnType<typeof useDriverPortal> | null>(null);

export function DriverAuthProvider({ children }: { children: React.ReactNode }) {
  const driverAuth = useDriverPortal();

  return (
    <DriverAuthContext.Provider value={driverAuth}>
      {children}
    </DriverAuthContext.Provider>
  );
}

export function useDriverAuth() {
  const context = useContext(DriverAuthContext);
  if (!context) {
    throw new Error('useDriverAuth debe usarse dentro de un DriverAuthProvider');
  }
  return context;
}
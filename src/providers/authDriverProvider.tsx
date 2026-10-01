'use client';

import React, { createContext, useContext } from 'react';
import { useDriverPortal } from '@/hooks/use-driverPortal';

// Creamos un contexto limpio y exclusivo para la PWA de conductores
const DriverAuthContext = createContext<ReturnType<typeof useDriverPortal> | null>(null);

export function DriverAuthProvider({ children }: { children: React.ReactNode }) {
  const driverAuth = useDriverPortal();

  return (
    <DriverAuthContext.Provider value={driverAuth}>
      {children}
    </DriverAuthContext.Provider>
  );
}

// Hook personalizado para consumir los datos del conductor en cualquier parte de la PWA
export function useDriverAuth() {
  const context = useContext(DriverAuthContext);
  if (!context) {
    throw new Error('useDriverAuth debe usarse dentro de un DriverAuthProvider');
  }
  return context;
}
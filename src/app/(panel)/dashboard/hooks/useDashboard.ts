'use client';

import { useEffect, useRef } from 'react';
import { useDashboardStore } from '@/store/use-dashboard.store';

export function useDashboard() {
  const { data, isLoading, isRefetching, error, fetchDashboardData } = useDashboardStore();
  const isInitialized = useRef(false);

  useEffect(() => {
    // Evitamos dobles llamadas al montar el componente
    if (!isInitialized.current) {
      fetchDashboardData();
      isInitialized.current = true;
    }
  }, [fetchDashboardData]);

  return {
    data,
    // Solo es "carga bloqueante" si está cargando Y no hay datos previos
    isLoading: isLoading && !data, 
    isRefetching,
    error,
    refresh: () => fetchDashboardData(true), // 👈 Fuerza recarga en segundo plano
  };
}
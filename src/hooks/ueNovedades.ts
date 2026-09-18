'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNovedadesStore } from '@/store/novedade-store';

export function useNovedades(initialTab = 'PENDING') {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { novedades, isLoading, error, fetchNovedades, resolveNovedad } = useNovedadesStore();

  // Se recarga cada vez que cambia el Tab activo
  useEffect(() => {
    fetchNovedades(activeTab);
  }, [activeTab, fetchNovedades]);

  // Función envoltorio para refrescar la tab actual manualmente si es necesario
  const refresh = useCallback(() => {
    fetchNovedades(activeTab);
  }, [activeTab, fetchNovedades]);

  return {
    novedades,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    refresh,
    resolve: resolveNovedad,
  };
}
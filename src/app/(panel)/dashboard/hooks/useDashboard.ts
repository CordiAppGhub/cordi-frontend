'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '@/store/use-dashboard.store';

export function useDashboard() {
  const { data, isLoading, error, fetchDashboardData } = useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchDashboardData,
  };
}
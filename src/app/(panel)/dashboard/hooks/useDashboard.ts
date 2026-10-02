// src/app/dashboard/hooks/useDashboard.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardService, DashboardFilters } from '@/services/dashboard.service';
import axios from 'axios';
import { DashboardSummary } from '@/types/dashboard-types';

export function useDashboard(filters: DashboardFilters = {}) {
  const {
    data,
    isLoading,
    isFetching, 
    error: queryError,
    refetch
  } = useQuery<DashboardSummary, Error>({
    queryKey: ['dashboard', 'summary', filters],
    queryFn: () => dashboardService.getSummary(filters),
    staleTime: 1000 * 60 * 1, 
    
    placeholderData: (previousData) => previousData,
  });

  let errorMessage: string | null = null;
  if (queryError) {
    if (axios.isAxiosError(queryError)) {
      errorMessage = queryError.response?.data?.message || 'Error al cargar los datos del dashboard';
    } else {
      errorMessage = queryError.message || 'Error al cargar los datos del dashboard';
    }
  }

  return {
    data: data || null,
    isLoading, 
    isRefetching: isFetching, 
    error: errorMessage,
    refresh: () => refetch(),
  };
}
// src/app/dashboard/hooks/useDashboard.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { dashboardService, DashboardFilters } from '@/services/dashboard.service';
import { DashboardSummary } from '@/types/dashboard-types';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';

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
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  let errorMessage: string | null = null;
  if (queryError) {
    errorMessage =
      isAxiosError(queryError) && (queryError.response?.status ?? 0) >= 500
        ? 'El servidor no pudo consultar el dashboard. Verifica que la base de datos esté sincronizada con el esquema Prisma.'
        : getUserFriendlyErrorMessage(
            queryError,
            'No se pudieron cargar los datos del panel. Inténtalo de nuevo.',
          );
  }

  return {
    data: data || null,
    isLoading, 
    isRefetching: isFetching, 
    error: errorMessage,
    refresh: () => refetch(),
  };
}
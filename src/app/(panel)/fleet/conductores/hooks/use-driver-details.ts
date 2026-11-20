'use client';

import { useQuery } from '@tanstack/react-query';
import { driversService } from '@/services/driver.service';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';

export function useDriverDetail(driverId: number) {
  const query = useQuery({
    queryKey: ['drivers', 'detail', driverId],
    queryFn: () => driversService.getById(driverId),
    enabled: Number.isInteger(driverId) && driverId > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    details: query.data,
    isLoading: query.isLoading,
    error: query.error
      ? getUserFriendlyErrorMessage(
          query.error,
          'No se pudo cargar la información del conductor.',
        )
      : null,
  };
}

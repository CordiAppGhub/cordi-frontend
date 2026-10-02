'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { novedadesService } from '@/services/novedades.servies';
import { showToast } from '@/utils/alerts';
import { AxiosError } from 'axios';

interface BackendErrorResponse {
  message?: string;
}

export function useNovedades(initialTab = 'PENDING') {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialTab);

  const {
    data: novedades = [],
    isLoading,
    error: queryError,
    refetch: refresh,
  } = useQuery({
    queryKey: ['novedades', activeTab],
    queryFn: () => novedadesService.getAll(activeTab),
    staleTime: 1000 * 60 * 3, 
  });

  const error = queryError 
    ? (queryError instanceof Error ? queryError.message : 'Error al cargar novedades')
    : null;

  const resolveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) => novedadesService.resolve(id, notes),
    onSuccess: () => {
      showToast.success('Novedad resuelta exitosamente.');
      queryClient.invalidateQueries({ queryKey: ['novedades'] });
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'Error al resolver la novedad';
      showToast.error(message);
    },
  });

  const resolve = useCallback(async (id: number, notes: string): Promise<boolean> => {
    try {
      await resolveMutation.mutateAsync({ id, notes });
      return true;
    } catch {
      return false;
    }
  }, [resolveMutation]);

  return {
    novedades,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    refresh,
    resolve,
  };
}
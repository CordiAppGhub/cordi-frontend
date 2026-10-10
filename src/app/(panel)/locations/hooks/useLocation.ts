// src/hooks/useLocation.ts
'use client';

import { useCallback } from 'react';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationService } from '@/services/location.service'; 
import { showToast } from '@/utils/alerts';
import { CreateLocationInput, UpdateLocationInput } from '@/types/location.types';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';

export function useLocations() {
  const queryClient = useQueryClient();

  const {
    data: locations = [],
    isLoading: isLoadingLocations,
    error: queryError,
    refetch: refreshLocations,
  } = useQuery({
    queryKey: ['locations'],
    queryFn: locationService.getAll,
    staleTime: 1000 * 60 * 10,
  });

  let errorMessage: string | null = null;
  if (queryError) {
    errorMessage = getUserFriendlyErrorMessage(
      queryError,
      'No se pudieron cargar las ubicaciones. Inténtalo de nuevo.',
    );
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateLocationInput) => locationService.create(data), 
    onSuccess: () => {
      showToast.success('La ubicación ha sido registrada exitosamente.');
      queryClient.invalidateQueries({ queryKey: ['locations'] }); 
      queryClient.invalidateQueries({ queryKey: ['clients'] }); 
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showToast.error(err.response?.data?.message || 'No se pudo registrar la ubicación.');
    }
  });
  const createLocationAsync = createMutation.mutateAsync;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLocationInput }) => locationService.update(id, data),
    onSuccess: () => {
      showToast.success('La ubicación ha sido actualizada exitosamente.');
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showToast.error(err.response?.data?.message || 'No se pudo actualizar la ubicación.');
    }
  });
  const updateLocationAsync = updateMutation.mutateAsync;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => locationService.delete(id),
    onSuccess: () => {
      showToast.success('La ubicación ha sido eliminada.');
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showToast.error(err.response?.data?.message || 'No se pudo eliminar la ubicación.');
    }
  });
  const deleteLocationAsync = deleteMutation.mutateAsync;

  const createLocation = useCallback(async (data: CreateLocationInput): Promise<boolean> => {
    try {
      await createLocationAsync(data);
      return true;
    } catch {
      return false;
    }
  }, [createLocationAsync]);

  const updateLocation = useCallback(async (id: number, data: UpdateLocationInput): Promise<boolean> => {
    try {
      await updateLocationAsync({ id, data });
      return true;
    } catch {
      return false;
    }
  }, [updateLocationAsync]);

  const deleteLocation = useCallback(async (id: number): Promise<boolean> => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto. Si la ubicación está en uso en operaciones, no se podrá borrar.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return false;

    try {
      await deleteLocationAsync(id);
      return true;
    } catch {
      return false;
    }
  }, [deleteLocationAsync]);

  return {
    locations,
    isLoadingLocations,
    error: errorMessage,
    createLocation,
    updateLocation,
    deleteLocation,
    refreshLocations,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
  };
}
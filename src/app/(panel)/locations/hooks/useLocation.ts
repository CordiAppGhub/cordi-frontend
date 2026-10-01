// src/hooks/useLocation.ts
'use client';

import { useCallback } from 'react';
import Swal from 'sweetalert2';
import axios, { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationService } from '@/services/location.service'; 
import { showToast } from '@/utils/alerts';
import { CreateLocationInput, UpdateLocationInput } from '@/types/location.types';

export function useLocations() {
  const queryClient = useQueryClient();

  // 1. Carga de ubicaciones con TanStack Query
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
    errorMessage = axios.isAxiosError(queryError) 
      ? queryError.response?.data?.message || 'Error al cargar ubicaciones'
      : queryError.message || 'Error al cargar ubicaciones';
  }

  // 2. Mutación para Crear Ubicación (con sus clientIds)
  const createMutation = useMutation({
    mutationFn: (data: CreateLocationInput) => locationService.create(data), 
    onSuccess: () => {
      showToast.success('La ubicación ha sido registrada exitosamente.');
      // 🚀 Invalidamos ambas consultas para actualizar tablas e insignias en caliente
      queryClient.invalidateQueries({ queryKey: ['locations'] }); 
      queryClient.invalidateQueries({ queryKey: ['clients'] }); 
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showToast.error(err.response?.data?.message || 'No se pudo registrar la ubicación.');
    }
  });

  // 3. Mutación para Actualizar Ubicación
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

  // 4. Mutación para Eliminar Ubicación
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

  // Callbacks asíncronos limpios para consumir desde los componentes
  const createLocation = useCallback(async (data: CreateLocationInput): Promise<boolean> => {
    try {
      await createMutation.mutateAsync(data);
      return true;
    } catch {
      return false;
    }
  }, [createMutation]);

  const updateLocation = useCallback(async (id: number, data: UpdateLocationInput): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({ id, data });
      return true;
    } catch {
      return false;
    }
  }, [updateMutation]);

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
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  }, [deleteMutation]);

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
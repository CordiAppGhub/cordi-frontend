'use client';

import { useCallback } from 'react';
import Swal from 'sweetalert2';
import type { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { vehiclesService } from '@/services/vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from '@/types/vehicles';
import { showToast } from '@/utils/alerts';

interface BackendErrorResponse {
  message?: string;
}

export const useVehicles = (enabled = true) => {
  const queryClient = useQueryClient();

  const {
    data: vehicles = [],
    isLoading: isQueryLoading,
    refetch: loadVehicles,
  } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesService.getAll,
    enabled,
    staleTime: 1000 * 60 * 5, 
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateVehicleDto) => vehiclesService.create(data),
    onSuccess: () => {
      showToast.success('Vehículo registrado con éxito');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] }); 
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'No se pudo crear el vehículo.';
      showToast.error(message);
    }
  });
  const createVehicleAsync = createMutation.mutateAsync;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateVehicleDto }) => vehiclesService.update(id, data),
    onSuccess: () => {
      showToast.success('Vehículo modificado con éxito');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'No se pudo actualizar el vehículo.';
      showToast.error(message);
    }
  });
  const updateVehicleAsync = updateMutation.mutateAsync;

  const removeMutation = useMutation({
    mutationFn: (id: number) => vehiclesService.remove(id),
    onSuccess: () => {
      showToast.success('El vehículo fue eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'No se pudo eliminar el vehículo.';
      showToast.error(message);
    }
  });
  const removeVehicleAsync = removeMutation.mutateAsync;

  const uploadMutation = useMutation({
    mutationFn: (file: File) => vehiclesService.importExcel(file),
    onSuccess: (response) => {
      showToast.success(response.message || 'Carga masiva completada con éxito');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'Error al procesar el archivo Excel de vehículos.';
      showToast.error(message);
    }
  });
  const uploadVehiclesAsync = uploadMutation.mutateAsync;

  const createVehicle = useCallback(async (data: CreateVehicleDto): Promise<boolean> => {
    try {
      await createVehicleAsync(data);
      return true;
    } catch {
      return false;
    }
  }, [createVehicleAsync]);

  const editVehicle = useCallback(async (id: number, data: UpdateVehicleDto): Promise<boolean> => {
    try {
      await updateVehicleAsync({ id, data });
      return true;
    } catch {
      return false;
    }
  }, [updateVehicleAsync]);

  const removeVehicle = useCallback(async (id: number): Promise<boolean> => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará el vehículo de la base de datos.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return false;

    try {
      await removeVehicleAsync(id);
      return true;
    } catch {
      return false;
    }
  }, [removeVehicleAsync]);

  const uploadExcel = useCallback(async (file: File): Promise<void> => {
    await uploadVehiclesAsync(file);
  }, [uploadVehiclesAsync]);

  const isLoading = isQueryLoading || createMutation.isPending || updateMutation.isPending || removeMutation.isPending || uploadMutation.isPending;

  return {
    vehicles,
    isLoading,
    loadVehicles,
    createVehicle,
    editVehicle,
    removeVehicle,
    uploadExcel,
  };
};
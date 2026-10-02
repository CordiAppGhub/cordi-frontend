'use client';

import { useCallback } from 'react';
import Swal from 'sweetalert2';
import axios, { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { vehiclesService } from '@/services/vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from '@/types/vehicles';
import { showToast } from '@/utils/alerts';

interface BackendErrorResponse {
  message?: string;
}

export const useVehicles = () => {
  const queryClient = useQueryClient();

  const {
    data: vehicles = [],
    isLoading: isQueryLoading,
    refetch: loadVehicles,
  } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesService.getAll,
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

  const uploadMutation = useMutation({
    mutationFn: (file: File) => vehiclesService.importExcel(file),
    onSuccess: (response: any) => {
      showToast.success(response.message || 'Carga masiva completada con éxito');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'Error al procesar el archivo Excel de vehículos.';
      showToast.error(message);
    }
  });

  const createVehicle = useCallback(async (data: CreateVehicleDto): Promise<boolean> => {
    try {
      await createMutation.mutateAsync(data);
      return true;
    } catch (err) {
      return false;
    }
  }, [createMutation]);

  const editVehicle = useCallback(async (id: number, data: UpdateVehicleDto): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({ id, data });
      return true;
    } catch (err) {
      return false;
    }
  }, [updateMutation]);

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
      await removeMutation.mutateAsync(id);
      return true;
    } catch (err) {
      return false;
    }
  }, [removeMutation]);

  const uploadExcel = useCallback(async (file: File): Promise<void> => {
    try {
      await uploadMutation.mutateAsync(file);
    } catch (err) {
      throw err; 
    }
  }, [uploadMutation]);

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
'use client';

import { useCallback } from 'react';
import Swal from 'sweetalert2';
import type { AxiosError } from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { driversService } from '@/services/driver.service';
import { CreateDriverDto, UpdateDriverDto } from '@/types/drivers';
import { showToast } from '@/utils/alerts';

interface BackendErrorResponse {
  message?: string;
}

export const useDrivers = (enabled = true) => {
  const queryClient = useQueryClient();
  const driversQuery = useQuery({
    queryKey: ['drivers', 'all'],
    queryFn: driversService.getAll,
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const invalidateDriverData = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['drivers'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['fleet-live-status'] }),
      ]),
    [queryClient],
  );

  const createDriver = useCallback(
    async (data: CreateDriverDto): Promise<boolean> => {
      try {
        await driversService.create(data);
        await invalidateDriverData();
        showToast.success('Conductor registrado con éxito');
        return true;
      } catch (err: unknown) {
        console.error('Error al crear conductor:', err);
        const axiosError = err as AxiosError<BackendErrorResponse>;
        const message =
          axiosError.response?.data?.message ||
          'No se pudo crear el conductor. Verifica la cédula.';
        showToast.error(message);
        return false;
      }
    },
    [invalidateDriverData],
  );

  const editDriver = useCallback(
    async (id: number, data: UpdateDriverDto): Promise<boolean> => {
      try {
        await driversService.update(id, data);
        await invalidateDriverData();
        showToast.success('Conductor modificado con éxito');
        return true;
      } catch (err: unknown) {
        console.error('Error al actualizar conductor:', err);
        const axiosError = err as AxiosError<BackendErrorResponse>;
        const message =
          axiosError.response?.data?.message ||
          'No se pudo actualizar el conductor.';
        showToast.error(message);
        return false;
      }
    },
    [invalidateDriverData],
  );

  const disableDriver = useCallback(
    async (id: number, name: string | null): Promise<boolean> => {
      const result = await Swal.fire({
        title: '¿Desactivar conductor?',
        text: `¿Estás seguro de desactivar a ${name || 'este conductor'}? Se liberará del vehículo que tenga asignado.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626',
      });

      if (!result.isConfirmed) return false;

      try {
        await driversService.disable(id);
        await invalidateDriverData();
        showToast.success('El conductor fue desactivado correctamente.');
        return true;
      } catch (err: unknown) {
        console.error('Error al desactivar conductor:', err);
        const axiosError = err as AxiosError<BackendErrorResponse>;
        const message =
          axiosError.response?.data?.message ||
          'No se pudo desactivar al conductor.';
        showToast.error(message);
        return false;
      }
    },
    [invalidateDriverData],
  );

  const deleteDriver = useCallback(
    async (id: number, name: string | null): Promise<boolean> => {
      const result = await Swal.fire({
        title: '¿Eliminar conductor?',
        text: `¿Estás seguro de eliminar permanentemente a ${name || 'este conductor'}? Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626',
      });

      if (!result.isConfirmed) return false;

      try {
        const response = await driversService.delete(id);
        await invalidateDriverData();
        showToast.success(
          response.message || 'El conductor fue eliminado correctamente.',
        );
        return true;
      } catch (err: unknown) {
        console.error('Error al eliminar conductor:', err);
        const axiosError = err as AxiosError<BackendErrorResponse>;
        const message =
          axiosError.response?.data?.message ||
          'No se pudo eliminar al conductor.';
        showToast.error(message);
        return false;
      }
    },
    [invalidateDriverData],
  );

  const uploadExcel = useCallback(
    async (file: File) => {
      try {
        const result = await driversService.importExcel(file);
        await invalidateDriverData();
        if (result.success) {
          showToast.success(result.message);
        } else {
          showToast.error(result.message);
        }
        return result;
      } catch (err: unknown) {
        console.error('Error al subir Excel de conductores:', err);
        const axiosError = err as AxiosError<BackendErrorResponse>;
        const message =
          axiosError.response?.data?.message ||
          'Error al procesar el archivo Excel de conductores.';
        showToast.error(message);
        throw err;
      }
    },
    [invalidateDriverData],
  );

  return {
    drivers: driversQuery.data ?? [],
    isLoading: driversQuery.isLoading,
    error: driversQuery.error,
    createDriver,
    editDriver,
    disableDriver,
    deleteDriver,
    uploadExcel,
  };
};

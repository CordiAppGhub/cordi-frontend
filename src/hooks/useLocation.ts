'use client';

import { useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';
import { useLocationStore } from '../store/use-location.store';
import { showToast } from '@/utils/alerts';
import { CreateLocationInput, UpdateLocationInput } from '@/types/location.types';

interface BackendErrorResponse {
  message?: string;
}

export function useLocations() {
  const {
    locations,
    isLoadingLocations,
    error,
    fetchLocations,
    createLocation: storeCreate,
    updateLocation: storeUpdate,
    deleteLocation: storeDelete,
  } = useLocationStore();

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const createLocation = useCallback(async (data: Omit<CreateLocationInput, 'analystId'>): Promise<boolean> => {
    try {
      await storeCreate(data);
      showToast.success('La nueva ubicación ha sido registrada exitosamente.');
      return true;
    } catch (err: unknown) {
      console.error('Error al crear ubicación:', err);
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'No se pudo registrar la ubicación.';
      showToast.error(message);
      return false;
    }
  }, [storeCreate]);

  const updateLocation = useCallback(async (id: number, data: UpdateLocationInput): Promise<boolean> => {
    try {
      await storeUpdate(id, data);
      showToast.success('La empresa ha sido actualizada exitosamente.');
      return true;
    } catch (err: unknown) {
      console.error('Error al actualizar ubicación:', err);
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'No se pudo actualizar la ubicación.';
      showToast.error(message);
      return false;
    }
  }, [storeUpdate]);

  const deleteLocation = useCallback(async (id: number): Promise<boolean> => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto. Si la empresa tiene viajes, no se podrá borrar.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return false;

    try {
      await storeDelete(id);
      showToast.success('La empresa ha sido eliminada.');
      return true;
    } catch (err: unknown) {
      console.error('Error al eliminar ubicación:', err);
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'No se pudo eliminar la empresa (puede tener historial).';
      showToast.error(message);
      return false;
    }
  }, [storeDelete]);

  return {
    locations,
    isLoadingLocations,
    error,
    createLocation,
    updateLocation,
    deleteLocation,
    refreshLocations: fetchLocations,
  };
}
'use client';

import { useCallback } from 'react';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';

import { driversService } from '@/services/driver.service';
import { useDriversStore } from '@/store/use-driver.store';
import {
  CreateDriverDto,
  UpdateDriverDto,
} from '@/types/drivers';
import { showToast } from '@/utils/alerts';

interface BackendErrorResponse {
  message?: string;
}

export const useDrivers = () => {
  const drivers = useDriversStore((state) => state.drivers);
  const isLoading = useDriversStore((state) => state.isLoading);

  const setDrivers = useDriversStore((state) => state.setDrivers);
  const setIsLoading = useDriversStore((state) => state.setIsLoading);
  const addDriver = useDriversStore((state) => state.addDriver);
  const updateDriverInStore = useDriversStore((state) => state.updateDriverInStore);
  const removeDriverFromStore = useDriversStore((state) => state.removeDriverFromStore);

  const loadDrivers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await driversService.getAll();
      setDrivers(data);
    } catch (err: unknown) {
      console.error('Error al cargar conductores:', err);
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'No se pudieron cargar los conductores';
      showToast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [setDrivers, setIsLoading]);

  const createDriver = useCallback(
    async (data: CreateDriverDto): Promise<boolean> => {
      setIsLoading(true);
      try {
        const newDriver = await driversService.create(data);
        addDriver(newDriver);
        showToast.success('Conductor registrado con éxito');
        return true;
      } catch (err: unknown) {
        console.error('Error al crear conductor:', err);
        const axiosError = err as AxiosError<BackendErrorResponse>;
        const message = axiosError.response?.data?.message || 'No se pudo crear el conductor. Verifica la cédula.';
        showToast.error(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [addDriver, setIsLoading]
  );

  const editDriver = useCallback(
    async (id: number, data: UpdateDriverDto): Promise<boolean> => {
      setIsLoading(true);
      try {
        const updatedDriver = await driversService.update(id, data);
        updateDriverInStore(id, updatedDriver);
        showToast.success('Conductor modificado con éxito');
        return true;
      } catch (err: unknown) {
        console.error('Error al actualizar conductor:', err);
        const axiosError = err as AxiosError<BackendErrorResponse>;
        const message = axiosError.response?.data?.message || 'No se pudo actualizar el conductor.';
        showToast.error(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, updateDriverInStore]
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

      if (!result.isConfirmed) {
        return false;
      }

      setIsLoading(true);
      try {
        await driversService.disable(id);
        removeDriverFromStore(id);
        showToast.success('El conductor fue desactivado correctamente.');
        return true;
      } catch (err: unknown) {
        console.error('Error al desactivar conductor:', err);
        const axiosError = err as AxiosError<BackendErrorResponse>;
        const message = axiosError.response?.data?.message || 'No se pudo desactivar al conductor.';
        showToast.error(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [removeDriverFromStore, setIsLoading]
  );

  const uploadExcel = useCallback(async (file: File) => {
    try {
      const result = await driversService.importExcel(file);
      showToast.success('Carga masiva completada con éxito');
      return result;
    } catch (err: unknown) {
      console.error('Error al subir Excel de conductores:', err);
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'Error al procesar el archivo Excel.';
      showToast.error(message);
      throw err;
    }
  }, []);

  return {
    drivers,
    isLoading,
    loadDrivers,
    createDriver,
    editDriver,
    disableDriver,
    uploadExcel,
  };
};
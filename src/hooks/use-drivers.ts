'use client';

import { useCallback } from 'react';
import Swal from 'sweetalert2';

import { driversService } from '@/services/driver.service';
import { useDriversStore } from '@/store/use-driver.store';
import {
  CreateDriverDto,
  UpdateDriverDto,
} from '@/types/drivers';

export const useDrivers = () => {

  const drivers = useDriversStore((state) => state.drivers);
  const isLoading = useDriversStore((state) => state.isLoading);


  const setDrivers = useDriversStore((state) => state.setDrivers);
  const setIsLoading = useDriversStore((state) => state.setIsLoading);

  const addDriver = useDriversStore((state) => state.addDriver);

  const updateDriverInStore = useDriversStore(
    (state) => state.updateDriverInStore
  );

  const removeDriverFromStore = useDriversStore(
    (state) => state.removeDriverFromStore
  );


  const loadDrivers = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await driversService.getAll();

      setDrivers(data);
    } catch (error) {
      console.error('Error al cargar conductores:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los conductores',
      });
    } finally {
      setIsLoading(false);
    }
  }, [setDrivers, setIsLoading]);


  const createDriver = useCallback(
    async (data: CreateDriverDto) => {
      setIsLoading(true);

      try {
        const newDriver = await driversService.create(data);

        addDriver(newDriver);

        await Swal.fire({
          icon: 'success',
          title: 'Creado',
          text: 'Conductor registrado con éxito',
          timer: 1500,
          showConfirmButton: false,
        });

        return true;
      } catch (error) {
        console.error('Error al crear conductor:', error);

        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo crear el conductor. Verifica la cédula.',
        });

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [addDriver, setIsLoading]
  );



  const editDriver = useCallback(
    async (id: number, data: UpdateDriverDto) => {
      setIsLoading(true);

      try {
        const updatedDriver = await driversService.update(id, data);

        updateDriverInStore(id, updatedDriver);

        await Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Conductor modificado con éxito',
          timer: 1500,
          showConfirmButton: false,
        });

        return true;
      } catch (error) {
        console.error('Error al actualizar conductor:', error);

        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el conductor.',
        });

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, updateDriverInStore]
  );

  const disableDriver = useCallback(
    async (id: number, name: string | null) => {
      const result = await Swal.fire({
        title: '¿Desactivar conductor?',
        text: `¿Estás seguro de desactivar a ${name || 'este conductor'
          }? Se liberará del vehículo que tenga asignado.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar',
      });

      if (!result.isConfirmed) {
        return false;
      }

      setIsLoading(true);

      try {
        await driversService.disable(id);

        removeDriverFromStore(id);

        await Swal.fire({
          icon: 'success',
          title: 'Desactivado',
          text: 'El conductor fue desactivado correctamente.',
          timer: 1500,
          showConfirmButton: false,
        });

        return true;
      } catch (error) {
        console.error('Error al desactivar conductor:', error);

        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo desactivar al conductor.',
        });

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [removeDriverFromStore, setIsLoading]
  );

  // ─────────────────────────────────────
  // EXCEL
  // ─────────────────────────────────────

  const uploadExcel = useCallback(async (file: File) => {
    try {
      return await driversService.importExcel(file);
    } catch (error) {
      console.error(
        'Error al subir Excel de conductores:',
        error
      );

      throw error;
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
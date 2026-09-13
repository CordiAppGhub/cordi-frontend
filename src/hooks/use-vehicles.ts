'use client';

import { useCallback } from 'react';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';

import { vehiclesService } from '@/services/vehicles.service';
import { useVehiclesStore } from '@/store/use-vehicles.store';
import { CreateVehicleDto, UpdateVehicleDto } from '@/types/vehicles';
import { showToast } from '@/utils/alerts';

interface BackendErrorResponse {
  message?: string;
}

export const useVehicles = () => {
    const store = useVehiclesStore();

    const loadVehicles = useCallback(async () => {
        store.setIsLoading(true);
        try {
            const data = await vehiclesService.getAll();
            store.setVehicles(data);
        } catch (err: unknown) {
            console.error('Error al cargar vehículos', err);
            const axiosError = err as AxiosError<BackendErrorResponse>;
            const message = axiosError.response?.data?.message || 'No se pudieron cargar los vehículos';
            showToast.error(message);
        } finally {
            store.setIsLoading(false);
        }
    }, [store]);

    const createVehicle = async (data: CreateVehicleDto): Promise<boolean> => {
        store.setIsLoading(true);
        try {
            const newVehicle = await vehiclesService.create(data);
            store.addVehicle(newVehicle);
            showToast.success('Vehículo registrado con éxito');
            return true;
        } catch (err: unknown) {
            console.error('Error al crear vehículo:', err);
            const axiosError = err as AxiosError<BackendErrorResponse>;
            const message = axiosError.response?.data?.message || 'No se pudo crear el vehículo.';
            showToast.error(message);
            return false;
        } finally {
            store.setIsLoading(false);
        }
    };

    const editVehicle = async (id: number, data: UpdateVehicleDto): Promise<boolean> => {
        store.setIsLoading(true);
        try {
            const updated = await vehiclesService.update(id, data);
            store.updateVehicleInStore(id, updated);
            showToast.success('Vehículo modificado con éxito');
            return true;
        } catch (err: unknown) {
            console.error('Error al actualizar vehículo:', err);
            const axiosError = err as AxiosError<BackendErrorResponse>;
            const message = axiosError.response?.data?.message || 'No se pudo actualizar el vehículo.';
            showToast.error(message);
            return false;
        } finally {
            store.setIsLoading(false);
        }
    };

    const removeVehicle = async (id: number): Promise<boolean> => {
        const confirm = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción eliminará el vehículo de la base de datos.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar'
        });

        if (!confirm.isConfirmed) {
            return false;
        }

        store.setIsLoading(true);
        try {
            await vehiclesService.remove(id);
            store.removeVehicleFromStore(id);
            showToast.success('El vehículo fue eliminado correctamente');
            return true;
        } catch (err: unknown) {
            console.error('Error al eliminar vehículo:', err);
            const axiosError = err as AxiosError<BackendErrorResponse>;
            const message = axiosError.response?.data?.message || 'No se pudo eliminar el vehículo.';
            showToast.error(message);
            return false;
        } finally {
            store.setIsLoading(false);
        }
    };

    const uploadExcel = async (file: File): Promise<void> => {
        try {
            const response = await vehiclesService.importExcel(file);
            showToast.success(response.message || 'Carga masiva completada con éxito');
        } catch (err: unknown) {
            console.error('Error en hook uploadExcel:', err);
            const axiosError = err as AxiosError<BackendErrorResponse>;
            const message = axiosError.response?.data?.message || 'Error al procesar el archivo Excel de vehículos.';
            showToast.error(message);
            throw err;
        }
    };

    return {
        vehicles: store.vehicles,
        isLoading: store.isLoading,
        loadVehicles,
        createVehicle,
        editVehicle,
        removeVehicle,
        uploadExcel,
    };
};
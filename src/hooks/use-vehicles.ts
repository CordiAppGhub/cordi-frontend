import { useCallback } from 'react';
import Swal from 'sweetalert2';
import { vehiclesService } from '@/services/vehicles.service';
import { useVehiclesStore } from '@/store/use-vehicles.store';
import { CreateVehicleDto, UpdateVehicleDto } from '@/types/vehicles';

export const useVehicles = () => {
    const store = useVehiclesStore();

    const loadVehicles = useCallback(async () => {
        store.setIsLoading(true);
        try {
            const data = await vehiclesService.getAll();
            store.setVehicles(data);
        } catch (error) {
            console.error('Error al cargar vehículos', error);
        } finally {
            store.setIsLoading(false);
        }
    }, []);

    const createVehicle = async (data: CreateVehicleDto) => {
        store.setIsLoading(true);
        try {
            const newVehicle = await vehiclesService.create(data);
            store.addVehicle(newVehicle);
            Swal.fire({ icon: 'success', title: 'Creado', text: 'Vehículo registrado con éxito', timer: 1500 });
            return true;
        } catch (error) {
            return false;
        } finally {
            store.setIsLoading(false);
        }
    };

    const editVehicle = async (id: number, data: UpdateVehicleDto) => {
        store.setIsLoading(true);
        try {
            const updated = await vehiclesService.update(id, data);
            store.updateVehicleInStore(id, updated);
            Swal.fire({ icon: 'success', title: 'Actualizado', text: 'Vehículo modificado con éxito', timer: 1500 });
            return true;
        } catch (error) {
            return false;
        } finally {
            store.setIsLoading(false);
        }
    };

    const removeVehicle = async (id: number) => {
        const confirm = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción eliminará el vehículo de la base de datos.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar'
        });

        if (confirm.isConfirmed) {
            store.setIsLoading(true);
            try {
                await vehiclesService.remove(id);
                store.removeVehicleFromStore(id);
                Swal.fire('Eliminado', 'El vehículo fue eliminado', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el vehículo (puede tener historial).', 'error');
            } finally {
                store.setIsLoading(false);
            }
        }
    };

    const uploadExcel = async (file: File): Promise<void> => {
        try {
            const response = await vehiclesService.importExcel(file);

            console.log('Respuesta del servidor:', response.message);

        } catch (error) {
            console.error('Error en hook uploadExcel:', error);
            throw error;
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
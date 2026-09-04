import { assignmentsService } from '@/services/fleet.service';
import { useAssignmentsStore } from '@/store/use-fleet.store';
import { CreateAssignmentDto } from '@/types/fleet-types';
import { useCallback } from 'react';
import Swal from 'sweetalert2';


export const useAssignments = () => {
  const store = useAssignmentsStore();

  const loadActive = useCallback(async () => {
    store.setIsLoading(true);
    try {
      const data = await assignmentsService.getActive();
      store.setActiveAssignments(data);
    } catch (error) {
      console.error('Error al cargar asignaciones', error);
      Swal.fire('Error', 'No se pudieron cargar las asignaciones activas', 'error');
    } finally {
      store.setIsLoading(false);
    }
  }, []);

  const assignDriver = async (data: CreateAssignmentDto) => {
    store.setIsLoading(true);
    try {
      await assignmentsService.assign(data);
      Swal.fire({ icon: 'success', title: 'Asignado', text: 'Vehículo asignado exitosamente', timer: 1500 });
      await loadActive(); // Recargar la tabla
      return true;
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'No se pudo realizar la asignación', 'error');
      return false;
    } finally {
      store.setIsLoading(false);
    }
  };

  const unassignVehicle = async (vehicleId: number, plate: string) => {
    const confirm = await Swal.fire({
      title: '¿Liberar vehículo?',
      text: `¿Estás seguro de quitarle el conductor al vehículo ${plate}? El camión quedará libre.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, liberar'
    });

    if (confirm.isConfirmed) {
      store.setIsLoading(true);
      try {
        await assignmentsService.unassign(vehicleId);
        Swal.fire('Liberado', `El vehículo ${plate} ahora está sin conductor`, 'success');
        await loadActive(); // Recargar la tabla
      } catch (error) {
        Swal.fire('Error', 'No se pudo liberar el vehículo', 'error');
      } finally {
        store.setIsLoading(false);
      }
    }
  };

  return {
    activeAssignments: store.activeAssignments,
    isLoading: store.isLoading,
    loadActive,
    assignDriver,
    unassignVehicle,
  };
};
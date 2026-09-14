import { useCallback } from 'react';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';

import { assignmentsService } from '@/services/fleet.service';
import { useAssignmentsStore } from '@/store/use-fleet.store';
import { CreateAssignmentDto } from '@/types/fleet-types';
import { showToast } from '@/utils/alerts';

interface BackendErrorResponse {
  message?: string;
}

export const useAssignments = () => {
  // 1. Extraemos los estados y acciones de forma independiente (Selectores)
  const activeAssignments = useAssignmentsStore((state) => state.activeAssignments);
  const isLoading = useAssignmentsStore((state) => state.isLoading);
  const setActiveAssignments = useAssignmentsStore((state) => state.setActiveAssignments);
  const setIsLoading = useAssignmentsStore((state) => state.setIsLoading);

  // 2. Dependencias estables (setIsLoading y setActiveAssignments nunca cambian)
  const loadActive = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await assignmentsService.getActive();
      setActiveAssignments(data);
    } catch (err: unknown) {
      console.error('Error al cargar asignaciones', err);
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'No se pudieron cargar las asignaciones activas';
      showToast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setActiveAssignments]);

  const assignDriver = async (data: CreateAssignmentDto): Promise<boolean> => {
    setIsLoading(true);
    try {
      await assignmentsService.assign(data);
      showToast.success('Vehículo asignado exitosamente');
      await loadActive(); 
      return true;
    } catch (err: unknown) {
      console.error('Error al realizar asignación:', err);
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'No se pudo realizar la asignación';
      showToast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unassignVehicle = async (vehicleId: number, plate: string): Promise<boolean> => {
    const confirm = await Swal.fire({
      title: '¿Liberar vehículo?',
      text: `¿Estás seguro de quitarle el conductor al vehículo ${plate}? El camión quedará libre.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, liberar'
    });

    if (!confirm.isConfirmed) {
      return false;
    }

    setIsLoading(true);
    try {
      await assignmentsService.unassign(vehicleId);
      showToast.success(`El vehículo ${plate} ahora está sin conductor`);
      await loadActive(); 
      return true;
    } catch (err: unknown) {
      console.error('Error al liberar vehículo:', err);
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'No se pudo liberar el vehículo';
      showToast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    activeAssignments,
    isLoading,
    loadActive,
    assignDriver,
    unassignVehicle,
  };
};
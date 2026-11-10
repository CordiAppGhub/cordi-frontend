'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
  operationService,
  ScheduleOperationsFilters,
} from '@/services/operation.service';
import Swal from 'sweetalert2';
import { socket } from '@/lib/socket';
import { showToast } from '@/utils/alerts';

interface BackendErrorResponse {
  message?: string;
  code?: string;
}

export interface AssignVehicleOverlap {
  message: string;
}

export type AssignVehicleResult =
  | { status: 'assigned' }
  | { status: 'overlap'; overlap: AssignVehicleOverlap }
  | { status: 'error' };

const isOverlapError = (error: AxiosError<BackendErrorResponse>) =>
  error.response?.status === 409 &&
  error.response.data?.code === 'OVERLAPPING_APPOINTMENTS';

export const useProgramacion = (filters: ScheduleOperationsFilters) => {
  const queryClient = useQueryClient();

  // ==========================================
  // 1. OBTENER PROGRAMACIÓN POR FECHA
  // ==========================================
  const {
    data: operations = [],
    isLoading: isLoadingOperations,
    error: operationsError,
    refetch: refreshOperations,
  } = useQuery({
    queryKey: ['operations', 'by-date', filters],
    queryFn: () => operationService.getOperationsByDate(filters),
    retry: false,
    staleTime: 1000 * 60 * 1,
  });

  useEffect(() => {
    const handleUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: ['operations', 'by-date'] });
    };

    socket.on('global_operations_updated', handleUpdate);

    return () => {
      socket.off('global_operations_updated', handleUpdate);
    };
  }, [queryClient]);

  const assignVehicleMutation = useMutation({
    mutationFn: ({
      operationId,
      vehicleId,
      force,
    }: {
      operationId: number;
      vehicleId: number;
      force?: boolean;
    }) => operationService.assignVehicle(operationId, vehicleId, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['trafico'] });
      queryClient.invalidateQueries({
        queryKey: ['operations', 'pending-count'],
      });
      showToast.success('La solicitud quedó asignada al vehículo seleccionado.');
    },
    onError: (error: AxiosError<BackendErrorResponse>) => {
      // El cruce de citas lo resuelve el llamador pidiendo confirmación para forzar.
      if (isOverlapError(error)) return;
      const message =
        error.response?.data?.message ||
        'Ocurrió un error al asignar el vehículo.';
      if (
        error.response?.status === 400 &&
        message ===
          'ADVERTENCIA: El vehículo seleccionado no tiene un conductor o tráiler asignado.'
      ) {
        showToast.warning(message);
      } else {
        showToast.error(error, message);
      }
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => operationService.cancelOperation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['trafico'] });
      queryClient.invalidateQueries({
        queryKey: ['operations', 'pending-count'],
      });
      
      Swal.fire({
        title: 'Cancelada',
        text: 'La programación fue cancelada correctamente.',
        icon: 'info',
        confirmButtonColor: '#4f46e5',
      });
    },
    onError: (error: AxiosError<BackendErrorResponse>) => {
      const errorMsg = error.response?.data?.message || 'No se pudo cancelar la programación.';
      
      Swal.fire({
        title: 'Error',
        text: errorMsg,
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    }
  });

  const unassignVehicleMutation = useMutation({
    mutationFn: (id: number) => operationService.unassignVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['trafico'] });
      queryClient.invalidateQueries({
        queryKey: ['operations', 'pending-count'],
      });
      Swal.fire(
        'Asignación retirada',
        'Se quitaron los recursos asignados y la solicitud sigue activa.',
        'success',
      );
    },
    onError: (error: AxiosError<BackendErrorResponse>) => {
      Swal.fire({
        title: 'No se pudo quitar la asignación',
        text:
          error.response?.data?.message ||
          'Ocurrió un error al quitar la asignación.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    },
  });

  return {
    // Datos y estado de lectura
    operations,
    isLoadingOperations,
    operationsError,
    refreshOperations,
    
    assignVehicle: async (
      operationId: number,
      vehicleId: number,
      force?: boolean,
    ): Promise<AssignVehicleResult> => {
      try {
        await assignVehicleMutation.mutateAsync({ operationId, vehicleId, force });
        return { status: 'assigned' };
      } catch (error) {
        const axiosError = error as AxiosError<BackendErrorResponse>;
        if (isOverlapError(axiosError)) {
          return {
            status: 'overlap',
            overlap: {
              message:
                axiosError.response?.data?.message ?? 'Cruce de citas con otra operación.',
            },
          };
        }
        return { status: 'error' };
      }
    },
    isAssigningVehicle: assignVehicleMutation.isPending,
    
    cancelOperation: async (id: number) => {
      try {
        await cancelMutation.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
    isCancelling: cancelMutation.isPending,

    unassignVehicle: async (id: number) => {
      try {
        await unassignVehicleMutation.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
    isUnassigningVehicle: unassignVehicleMutation.isPending,
  };
};

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { operationService } from '@/services/operation.service'; 
import Swal from 'sweetalert2';

interface BackendErrorResponse {
  message?: string;
}

export const useProgramacion = (date: string) => {
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
    queryKey: ['operations', 'by-date', date],
    queryFn: () => operationService.getOperationsByDate(date),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const assignVehicleMutation = useMutation({
    mutationFn: ({ operationId, vehicleId }: { operationId: number; vehicleId: number }) =>
      operationService.assignVehicle(operationId, vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['trafico'] });
      Swal.fire('Vehículo asignado', 'La solicitud quedó asignada al vehículo seleccionado.', 'success');
    },
    onError: (error: AxiosError<BackendErrorResponse>) => {
      Swal.fire({
        title: 'No se pudo asignar',
        text: error.response?.data?.message || 'Ocurrió un error al asignar el vehículo.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => operationService.cancelOperation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['trafico'] });
      
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

  return {
    // Datos y estado de lectura
    operations,
    isLoadingOperations,
    operationsError,
    refreshOperations,
    
    assignVehicle: async (operationId: number, vehicleId: number) => {
      try {
        await assignVehicleMutation.mutateAsync({ operationId, vehicleId });
        return true;
      } catch {
        return false;
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
  };
};
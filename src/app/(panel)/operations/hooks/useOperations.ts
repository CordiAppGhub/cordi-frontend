'use client';

import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { GetOperationsParams, operationService } from '@/services/operation.service';
import { CreateOperationFormData } from '@/schemas/operation.schema';
import { useAuthStore } from '@/store/use-auth.store';
import { useUIStore } from '@/store/use-ui.store';
import { socket } from '@/lib/socket';
import { Operation } from '@/types/operation-types';
import { showToast } from '@/utils/alerts';

interface BackendErrorResponse {
  message?: string;
}

export function useOperations(initialParams: GetOperationsParams = {}) {
  const queryClient = useQueryClient();

  const [queryParams, setQueryParams] = useState<GetOperationsParams>({
    page: 1,
    limit: 10,
    ...initialParams,
  });

  const [currentOperationId, setCurrentOperationId] = useState<number | null>(null);


  const {
    data: operationsResponse,
    isLoading: isLoadingOperations,
    error: queryError,
    refetch: fetchOperationsQuery,
  } = useQuery({
    queryKey: ['operations', queryParams],
    queryFn: () => operationService.getActiveOperations(queryParams),
    staleTime: 1000 * 60 * 1, 
  });

  const operations = operationsResponse?.data || [];
  const meta = operationsResponse?.meta || { total: 0, page: 1, lastPage: 1 };

  const error = queryError 
    ? (queryError instanceof Error ? queryError.message : 'Error al cargar las operaciones')
    : null;


  const {
    data: currentOperation = null,
    isLoading: isLoadingCurrent,
  } = useQuery({
    queryKey: ['operation-detail', currentOperationId],
    queryFn: () => operationService.getOperationById(currentOperationId!),
    enabled: !!currentOperationId, 
  });

  const fetchOperationById = useCallback((id: number) => {
    setCurrentOperationId(id);
  }, []);

  const fetchOperations = useCallback(async (params: GetOperationsParams = {}) => {
    setQueryParams((prev) => ({ ...prev, ...params }));
    await fetchOperationsQuery();
  }, [fetchOperationsQuery]);



  const createMutation = useMutation({
    mutationFn: (data: CreateOperationFormData) => operationService.createOperation(data),
    onSuccess: () => {
      useUIStore.getState().closeCreateModal();
      showToast.success('La nueva operación ha sido registrada exitosamente.');
      queryClient.invalidateQueries({ queryKey: ['operations'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Error creando la operación';
      showToast.error(message);
    }
  });

  const assignDriverMutation = useMutation({
    mutationFn: ({ operationId, driverId, vehicleId, fletePagoManual }: { 
      operationId: number; driverId: number; vehicleId: number; fletePagoManual?: number 
    }) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser?.id) throw new Error('No hay una sesión activa.');

      return operationService.assignDriver(operationId, {
        driverId,
        vehicleId,
        analystId: Number(currentUser.id),
        fletePagoManual,
      });
    },
    onSuccess: async () => {
      await Swal.fire({
        icon: 'success',
        title: 'Asignación exitosa',
        text: 'El conductor fue asignado, el viaje costeado y notificado.',
        timer: 2500,
        showConfirmButton: false,
      });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      Swal.fire({
        icon: 'error',
        title: 'Fallo al asignar',
        text: axiosError.response?.data?.message || 'Error calculando tarifas o asignando el viaje.',
      });
    }
  });

  const reassignMutation = useMutation({
    mutationFn: ({ operationId, driverId, vehicleId, fletePagoManual }: { 
      operationId: number; driverId: number; vehicleId: number; fletePagoManual?: number 
    }) => operationService.reassignOperation(operationId, { driverId, vehicleId, fletePagoManual }),
    onSuccess: async (updatedOp) => {
      queryClient.setQueryData(['operation-detail', updatedOp.id], updatedOp);

      await Swal.fire({
        icon: 'success',
        title: 'Reasignación Completa',
        text: 'El nuevo conductor fue asignado, notificado, y el viaje regresó a estado ASIGNADO.',
        timer: 3000,
        showConfirmButton: false,
      });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      Swal.fire({
        icon: 'error',
        title: 'Fallo en reasignación',
        text: axiosError.response?.data?.message || 'Hubo un problema reasignando la operación.',
      });
    }
  });


  const createOperation = async (data: CreateOperationFormData): Promise<boolean> => {
    try {
      await createMutation.mutateAsync(data);
      return true;
    } catch {
      return false;
    }
  };

  const assignDriver = async (
    operationId: number, 
    driverId: number, 
    vehicleId: number, 
    fletePagoManual?: number
  ): Promise<boolean> => {
    try {
      await assignDriverMutation.mutateAsync({ operationId, driverId, vehicleId, fletePagoManual });
      return true;
    } catch {
      return false;
    }
  };

  const reassignDriverAndVehicle = async (
    operationId: number, 
    driverId: number, 
    vehicleId: number, 
    fletePagoManual?: number
  ): Promise<boolean> => {
    try {
      await reassignMutation.mutateAsync({ operationId, driverId, vehicleId, fletePagoManual });
      return true;
    } catch {
      return false;
    }
  };

 
  useEffect(() => {
    const handleGlobalUpdate = (data: Operation) => {
      if (data && data.id) {
        console.log(`🔄 [WebSocket] Actualización global para operación #${data.id}`);
        
        // Actualizamos de forma quirúrgica la lista en caché de React Query sin refetch innecesario
        queryClient.setQueryData(['operations', queryParams], (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((op: Operation) => (op.id === data.id ? data : op)),
          };
        });

        queryClient.setQueryData(['operation-detail', data.id], data);
      }
    };

    socket.on('global_operations_updated', handleGlobalUpdate);

    return () => {
      socket.off('global_operations_updated', handleGlobalUpdate);
    };
  }, [queryClient, queryParams]);

  const isLoading = isLoadingOperations || createMutation.isPending || assignDriverMutation.isPending || reassignMutation.isPending;

  return {
    operations,
    currentOperation,
    meta,
    isLoadingOperations: isLoading,
    isLoadingCurrent,
    error,
    fetchOperations,
    fetchOperationById,
    assignDriver,
    reassignDriverAndVehicle,
    createOperation,
  };
}
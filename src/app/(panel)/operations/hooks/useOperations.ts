'use client';

import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { GetOperationsParams, operationService, UpdateOperationPayload } from '@/services/operation.service';
import { socket } from '@/lib/socket';
import { showToast } from '@/utils/alerts';
import type { Operation } from '@/types/operation-types';

interface BackendErrorResponse {
  message?: string;
}

type OperationSocketPayload = Partial<Operation> & {
  id?: number;
  operationId?: number;
  deleted?: boolean;
};

export function useTrafico(initialParams: GetOperationsParams = {}) {
  const queryClient = useQueryClient();

  const [queryParams, setQueryParams] = useState<GetOperationsParams>({
    page: 1,
    limit: 10,
    ...initialParams,
  });

  const [currentOperationId, setCurrentOperationId] = useState<number | null>(null);

  // ==========================================
  // 1. QUERIES (LISTA Y DETALLE)
  // ==========================================
  const {
    data: operationsResponse,
    isLoading: isLoadingOperationsQuery,
    error: queryError,
    refetch: fetchOperationsQuery,
  } = useQuery({
    queryKey: ['trafico', queryParams],
    queryFn: () =>
      operationService.getActiveOperations({
        ...queryParams,
        deferOperations: true,
      }),
    staleTime: 1000 * 60 * 1, // 1 min por el websocket
  });

  const operations = operationsResponse?.data ?? [];
  const meta = operationsResponse?.meta ?? { total: 0, page: 1, lastPage: 1 };

  const error = queryError 
    ? (queryError instanceof Error ? queryError.message : 'Error al cargar el tráfico')
    : null;

  const {
    data: currentOperation = null,
    isLoading: isLoadingCurrent,
  } = useQuery({
    queryKey: ['trafico-detail', currentOperationId],
    queryFn: () => operationService.getOperationById(currentOperationId!),
    enabled: !!currentOperationId, 
  });

  // ==========================================
  // 2. MUTACIONES (CREAR / ACTUALIZAR / ASIGNAR)
  // ==========================================
  
  // 🚀 NUEVA: Mutación para Crear Operación
  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => 
      operationService.createOperation(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['trafico'] });
      queryClient.invalidateQueries({ queryKey: ['trafico-client-operations'] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'operation-alerts'] });
      
      showToast.success('Operación creada correctamente.');
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'Error al crear la operación.';
      
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: message,
      });
    }
  });

  // Mutación Única: Sirve para actualizar, asignar conductor, reasignar, poner contenedor, etc.
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOperationPayload }) => 
      operationService.updateOperation(id, data),
    onSuccess: async (updatedOp) => {
      // Actualiza el detalle si está abierto
      queryClient.setQueryData(['trafico-detail', updatedOp.id], updatedOp);
      queryClient.invalidateQueries({ queryKey: ['trafico'] });
      queryClient.invalidateQueries({ queryKey: ['trafico-client-operations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'operation-alerts'] });
      
      showToast.success('Operación actualizada correctamente.');
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'Error actualizando la operación.';
      
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: message,
      });
    }
  });

  const assignVehicleMutation = useMutation({
    mutationFn: ({ operationId, vehicleId }: { operationId: number; vehicleId: number }) =>
      operationService.assignVehicle(operationId, vehicleId),
    onSuccess: (updatedOp) => {
      queryClient.setQueryData(['trafico-detail', updatedOp.id], updatedOp);
      queryClient.invalidateQueries({ queryKey: ['trafico'] });
      queryClient.invalidateQueries({ queryKey: ['trafico-client-operations'] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'operation-alerts'] });
      showToast.success('Vehículo asignado a la solicitud.');
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      showToast.error(
        axiosError.response?.data?.message || 'No se pudo asignar el vehículo.',
      );
    },
  });

  const driverAccessMutation = useMutation({
    mutationFn: ({ operationId, isActive }: { operationId: number; isActive: boolean }) =>
      operationService.setDriverAccess(operationId, isActive),
    onSuccess: (updatedOp) => {
      queryClient.setQueryData(['trafico-detail', updatedOp.id], updatedOp);
      queryClient.invalidateQueries({ queryKey: ['trafico'] });
      queryClient.invalidateQueries({ queryKey: ['trafico-client-operations'] });
      showToast.success(
        `Operación ${updatedOp.isActive ? 'habilitada' : 'deshabilitada'} para el conductor.`,
      );
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      showToast.error(
        axiosError.response?.data?.message ||
          'No se pudo cambiar la habilitación de la operación.',
      );
    },
  });

  // ==========================================
  // 3. MÉTODOS PÚBLICOS
  // ==========================================
  const fetchOperationById = useCallback((id: number) => {
    setCurrentOperationId(id);
  }, []);

  const fetchOperations = useCallback(async (params: GetOperationsParams = {}) => {
    setQueryParams((prev) => ({ ...prev, ...params }));
    await fetchOperationsQuery();
  }, [fetchOperationsQuery]);

  // Envoltorio para crear operación
  const createOperation = async (data: Record<string, unknown>): Promise<boolean> => {
    try {
      await createMutation.mutateAsync(data);
      return true;
    } catch {
      return false;
    }
  };

  const updateOperation = async (id: number, data: UpdateOperationPayload): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({ id, data });
      return true;
    } catch {
      return false;
    }
  };

  const assignVehicle = async (operationId: number, vehicleId: number): Promise<boolean> => {
    try {
      await assignVehicleMutation.mutateAsync({ operationId, vehicleId });
      return true;
    } catch {
      return false;
    }
  };

  // Envoltorio semántico específico para asignar camión/conductor
  const assignResources = async (
    operationId: number, 
    vehicleId: number, 
    trailerId?: number, 
    driverId?: number
  ): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({ 
        id: operationId, 
        data: { vehicleId, trailerId, driverId } 
      });
      return true;
    } catch {
      return false;
    }
  };

  const setDriverAccess = async (operationId: number, isActive: boolean): Promise<void> => {
    await driverAccessMutation.mutateAsync({ operationId, isActive });
  };

  // ==========================================
  // 4. WEBSOCKETS (TIEMPO REAL)
  // ==========================================
  useEffect(() => {
    const handleGlobalUpdate = (data: OperationSocketPayload) => {
      // Dependiendo de tu EventsGateway, el ID podría venir como data.id o data.operationId
      const opId = data.id ?? data.operationId;

      if (!opId) return;

      if (data.deleted) {
        queryClient.invalidateQueries({ queryKey: ['trafico'] });
        queryClient.invalidateQueries({ queryKey: ['trafico-client-operations'] });
        queryClient.invalidateQueries({ queryKey: ['operations'] });
        queryClient.invalidateQueries({ queryKey: ['operation-history'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'operation-alerts'] });
        queryClient.removeQueries({ queryKey: ['trafico-detail', opId] });

        if (currentOperationId === opId) {
          setCurrentOperationId(null);
        }

        return;
      }

      console.log(`🔄 [WebSocket] Tráfico actualizado para operación #${opId}`, data);
      queryClient.setQueryData(['trafico', queryParams], (oldData: unknown) => {
        if (!oldData) return oldData;

        const currentData = oldData as
          | Array<{ operations?: Array<{ id: number }> }>
          | { data?: Array<{ operations?: Array<{ id: number }> }> };

        // Soporta si oldData es Array o Paginated Object
        const isArray = Array.isArray(currentData);
        const list = isArray ? currentData : (currentData.data || []);
        
        // 🚀 SOLUCIÓN: Recorremos los grupos de clientes, no operaciones planas
        const updatedList = list.map((group) => {
          const operations = group.operations ?? [];
          const hasChangedOp = operations.some((op) => op.id === opId);
          
          if (hasChangedOp) {
            // Si está aquí, mutamos las operaciones de ESTE grupo
            return {
              ...group,
              operations: operations.map((op) => 
                op.id === opId 
                  ? { ...op, ...data } // 👈 ¡Inyectamos los datos frescos del socket!
                  : op
              )
            };
          }
          
          return group;
        });
        queryClient.invalidateQueries({ queryKey: ['trafico-client-operations'] });

        if (isArray) {
          return updatedList;
        }

        return {
          ...(currentData as Record<string, unknown>),
          data: updatedList,
        };
      });

      // Actualizamos también la vista de detalle si está abierta
      queryClient.setQueryData(['trafico-detail', opId], (oldDetail: unknown) => {
        if (!oldDetail) return oldDetail; // o return data, según prefieras
        return {
          ...(oldDetail as Record<string, unknown>),
          ...data,
        };
      });
    };

    socket.on('global_operations_updated', handleGlobalUpdate);

    return () => {
      socket.off('global_operations_updated', handleGlobalUpdate);
    };
  }, [queryClient, queryParams, currentOperationId]);

  return {
    operations,
    queryParams,
    currentOperation,
    meta,
    // 🚀 La magia ocurre aquí: Unificamos el estado de carga
    isLoadingOperations: isLoadingOperationsQuery || updateMutation.isPending || createMutation.isPending,
    isLoadingCurrent,
    error,
    fetchOperations,
    fetchOperationById,
    createOperation, // 🚀 Exportamos el método
    updateOperation,
    assignVehicle,
    assignResources,
    setDriverAccess,
    isSettingDriverAccess: driverAccessMutation.isPending,
    setFilters: setQueryParams,
  };
}
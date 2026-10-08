'use client';

import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { GetOperationsParams, operationService, UpdateOperationPayload } from '@/services/operation.service';
import { socket } from '@/lib/socket';
import { Operation } from '@/types/operation-types';
import { showToast } from '@/utils/alerts';

interface BackendErrorResponse {
  message?: string;
}

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
    isLoading: isLoadingOperations,
    error: queryError,
    refetch: fetchOperationsQuery,
  } = useQuery({
    queryKey: ['trafico', queryParams],
    queryFn: () => operationService.getActiveOperations(queryParams),
    staleTime: 1000 * 60 * 1, // 1 min por el websocket
  });

  // Asegura compatibilidad si el backend devuelve un Array directo o un objeto Paginated
  const operations = Array.isArray(operationsResponse) ? operationsResponse : (operationsResponse?.data || []);
  const meta = ('meta' in (operationsResponse || {})) ? (operationsResponse as any).meta : { total: 0, page: 1, lastPage: 1 };

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
  // 2. MUTACIONES (ACTUALIZAR / ASIGNAR)
  // ==========================================
  
  // 🚀 Mutación Única: Sirve para asignar conductor, reasignar, poner contenedor, etc.
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOperationPayload }) => 
      operationService.updateOperation(id, data),
    onSuccess: async (updatedOp) => {
      // Actualiza el detalle si está abierto
      queryClient.setQueryData(['trafico-detail', updatedOp.id], updatedOp);
      queryClient.invalidateQueries({ queryKey: ['trafico'] });
      
      showToast.success('Operación actualizada correctamente.');
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'Error actualizando la operación.';
      
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: message, // Aquí saldrá si "El vehículo está en mantenimiento"
      });
    }
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

  // Envoltorio limpio para cualquier actualización operativa
  const updateOperation = async (id: number, data: UpdateOperationPayload): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({ id, data });
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

  // ==========================================
  // 4. WEBSOCKETS (TIEMPO REAL)
  // ==========================================
  useEffect(() => {
   const handleGlobalUpdate = (data: any) => {
      // Dependiendo de tu EventsGateway, el ID podría venir como data.id o data.operationId
      const opId = data.id || data.operationId;

      if (opId) {
        console.log(`🔄 [WebSocket] Tráfico actualizado para operación #${opId}`, data);
        
        queryClient.setQueryData(['trafico', queryParams], (oldData: any) => {
          if (!oldData) return oldData;
          
          // Soporta si oldData es Array o Paginated Object
          const isArray = Array.isArray(oldData);
          const list = isArray ? oldData : (oldData.data || []);
          
          // 🚀 SOLUCIÓN: Recorremos los grupos de clientes, no operaciones planas
          const updatedList = list.map((group: any) => {
            // Verificamos si la operación que llegó por el socket pertenece a este grupo
            const hasChangedOp = group.operations?.some((op: any) => op.id === opId);
            
            if (hasChangedOp) {
              // Si está aquí, mutamos las operaciones de ESTE grupo
              return {
                ...group,
                operations: group.operations.map((op: any) => 
                  op.id === opId 
                    ? { ...op, ...data } // 👈 ¡Inyectamos los datos frescos del socket!
                    : op
                )
              };
            }
            
            return group;
          });
          
          return isArray ? updatedList : { ...oldData, data: updatedList };
        });

        // Actualizamos también la vista de detalle si está abierta
        queryClient.setQueryData(['trafico-detail', opId], (oldDetail: any) => {
          if (!oldDetail) return oldDetail; // o return data, según prefieras
          return { ...oldDetail, ...data };
        });
      }
    };

    socket.on('global_operations_updated', handleGlobalUpdate);

    return () => {
      socket.off('global_operations_updated', handleGlobalUpdate);
    };
  }, [queryClient, queryParams]);

  return {
    operations,
    currentOperation,
    meta,
    isLoadingOperations: isLoadingOperations || updateMutation.isPending,
    isLoadingCurrent,
    error,
    fetchOperations,
    fetchOperationById,
    updateOperation,
    assignResources,
    setFilters: setQueryParams,
  };
}
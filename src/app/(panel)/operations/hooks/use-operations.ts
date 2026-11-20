'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  AssignExternalResourcesPayload,
  GetOperationsParams,
  operationService,
  UpdateOperationPayload,
} from '@/services/operation.service';
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
  const invalidateOperationQueries = useCallback(
    async (operationId?: number) => {
      const queryKeys: (readonly unknown[])[] = [
        ['operations'],
        ['programacion'],
        ['fleet-requests'],
        ['vehicles'],
        ['dashboard'],
        ['trafico'],
        ['trafico-client-operations'],
        ['operation-history'],
        ['operations', 'pending-count'],
        ['operations', 'by-date'],
        ['fleet-live-status'],
      ];
      if (operationId !== undefined) {
        queryKeys.push(
          ['operation', operationId],
          ['trafico-detail', operationId],
        );
      }
      await Promise.all(
        queryKeys.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
    [queryClient],
  );

  const [queryParams, setQueryParams] = useState<GetOperationsParams>({
    page: 1,
    limit: 10,
    ...initialParams,
  });

  const [currentOperationId, setCurrentOperationId] = useState<number | null>(null);
  const currentOpIdRef = useRef<number | null>(currentOperationId);

  useEffect(() => {
    currentOpIdRef.current = currentOperationId;
  }, [currentOperationId]);

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
    onSuccess: async (createdOperation) => {
      queryClient.setQueryData(
        ['operation', createdOperation.id],
        createdOperation,
      );
      await invalidateOperationQueries(createdOperation.id);
      
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
      queryClient.setQueryData(['operation', updatedOp.id], updatedOp);
      await invalidateOperationQueries(updatedOp.id);
      
      showToast.success('Operación actualizada correctamente.');
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'Error actualizando la operación.';
      if (
        axiosError.response?.status === 400 &&
        message ===
          'ADVERTENCIA: El vehículo seleccionado no tiene un conductor o tráiler asignado.'
      ) {
        showToast.warning(message);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: message,
        });
      }
    }
  });

  const assignExternalMutation = useMutation({
    mutationFn: ({
      operationId,
      payload,
    }: {
      operationId: number;
      payload: AssignExternalResourcesPayload;
    }) => operationService.assignExternalResources(operationId, payload),
    onSuccess: (updatedOp) => {
      queryClient.setQueryData(['trafico-detail', updatedOp.id], updatedOp);
      queryClient.invalidateQueries({ queryKey: ['trafico'] });
      queryClient.invalidateQueries({ queryKey: ['trafico-client-operations'] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'operation-alerts'] });
      showToast.success('Flota externa y flete negociado asignados.');
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      showToast.error(
        axiosError.response?.data?.message ||
          'No se pudo asignar la flota externa.',
      );
    },
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
      const message =
        axiosError.response?.data?.message || 'No se pudo asignar el vehículo.';
      if (
        axiosError.response?.status === 400 &&
        message ===
          'ADVERTENCIA: El vehículo seleccionado no tiene un conductor o tráiler asignado.'
      ) {
        showToast.warning(message);
      } else {
        showToast.error(axiosError, message);
      }
    },
  });

  const unassignVehicleMutation = useMutation({
    mutationFn: (operationId: number) =>
      operationService.unassignVehicle(operationId),
    onSuccess: (updatedOp) => {
      queryClient.setQueryData(['trafico-detail', updatedOp.id], updatedOp);
      queryClient.invalidateQueries({ queryKey: ['trafico'] });
      queryClient.invalidateQueries({ queryKey: ['trafico-client-operations'] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'operation-alerts'] });
      showToast.success('Se quitó la asignación; la solicitud sigue activa.');
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      showToast.error(
        axiosError.response?.data?.message ||
          'No se pudo quitar la asignación de la operación.',
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
  const createOperation = async (
    data: Record<string, unknown>,
  ): Promise<Operation | null> => {
    try {
      return await createMutation.mutateAsync(data);
    } catch {
      return null;
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

  const assignExternalResources = async (
    operationId: number,
    payload: AssignExternalResourcesPayload,
  ): Promise<boolean> => {
    try {
      await assignExternalMutation.mutateAsync({ operationId, payload });
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

  const unassignVehicle = async (operationId: number): Promise<boolean> => {
    try {
      await unassignVehicleMutation.mutateAsync(operationId);
      return true;
    } catch {
      return false;
    }
  };

  // Envoltorio semántico específico para asignar camión/conductor
  const assignResources = async (
    operationId: number, 
    vehicleId: number, 
    trailerId?: string,
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
      const opId = data.id ?? data.operationId;

      if (data.deleted) {
        if (opId) {
          queryClient.removeQueries({ queryKey: ['trafico-detail', opId] });
          queryClient.removeQueries({ queryKey: ['operation', opId] });
          if (currentOpIdRef.current === opId) {
            setCurrentOperationId(null);
          }
        }
      }
    };

    socket.on('global_operations_updated', handleGlobalUpdate);

    return () => {
      socket.off('global_operations_updated', handleGlobalUpdate);
    };
  }, [queryClient]);

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
    assignExternalResources,
    assignVehicle,
    unassignVehicle,
    isUnassigningVehicle: unassignVehicleMutation.isPending,
    assignResources,
    setDriverAccess,
    isSettingDriverAccess: driverAccessMutation.isPending,
    setFilters: setQueryParams,
  };
}
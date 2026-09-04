'use client';

import { useCallback, useEffect } from 'react';
import Swal from 'sweetalert2';
import { GetOperationsParams, operationService } from '@/services/operation.service';
import { CreateOperationInput } from '@/schemas/operation.schema';
import { useOperationStore } from '@/store/use-operation.store';
import { useAuthStore } from '@/store/use-auth.store';
import { useUIStore } from '@/store/use-ui.store';

export function useOperations() {
  const operations = useOperationStore((state) => state.operations);
  const currentOperation = useOperationStore((state) => state.currentOperation);
  const meta = useOperationStore((state) => state.meta);
  const isLoadingOperations = useOperationStore((state) => state.isLoadingOperations);
  const isLoadingCurrent = useOperationStore((state) => state.isLoadingCurrent);
  const error = useOperationStore((state) => state.error);

  // ACTIONS
  const setOperations = useOperationStore((state) => state.setOperations);
  const setCurrentOperation = useOperationStore((state) => state.setCurrentOperation);
  const setMeta = useOperationStore((state) => state.setMeta);
  const setIsLoadingOperations = useOperationStore((state) => state.setIsLoadingOperations);
  const setIsLoadingCurrent = useOperationStore((state) => state.setIsLoadingCurrent);
  const setError = useOperationStore((state) => state.setError);

  // ─────────────────────────────
  // LOAD OPERATIONS (Con Fusión de Filtros)
  // ─────────────────────────────
  const fetchOperations = useCallback(
    async (params: GetOperationsParams = {}) => {
      setIsLoadingOperations(true);
      setError(null);

      // Fusionamos parámetros actuales con paginación por defecto
      const queryParams: GetOperationsParams = {
        page: 1,
        limit: 10,
        ...params,
      };

      try {
        const response = await operationService.getActiveOperations(queryParams);
        setOperations(response.data);
        setMeta(response.meta);
      } catch (error) {
        console.error('Error cargando operaciones:', error);

        const errorMessage = error instanceof Error ? error.message : 'Error al cargar las operaciones';
        setError(errorMessage);

        Swal.fire({
          icon: 'error',
          title: 'Error de Red',
          text: 'No se pudieron cargar las operaciones de la Torre de Control.',
        });
      } finally {
        setIsLoadingOperations(false);
      }
    },
    [setOperations, setMeta, setError, setIsLoadingOperations]
  );

  // ─────────────────────────────
  // LOAD OPERATION DETAIL
  // ─────────────────────────────
  const fetchOperationById = useCallback(
    async (id: number) => {
      setIsLoadingCurrent(true);
      setError(null);

      try {
        const operation = await operationService.getOperationById(id);
        setCurrentOperation(operation);
      } catch (error) {
        console.error('Error cargando operación:', error);
        setError(error instanceof Error ? error.message : 'Error al cargar la operación');

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el detalle de la operación.',
        });
      } finally {
        setIsLoadingCurrent(false);
      }
    },
    [setCurrentOperation, setError, setIsLoadingCurrent]
  );

  // ─────────────────────────────
  // ASSIGN DRIVER
  // ─────────────────────────────
  const assignDriver = useCallback(
    async (operationId: number, driverId: number) => {
      const currentUser = useAuthStore.getState().user;

      if (!currentUser?.id) {
        await Swal.fire({
          icon: 'error',
          title: 'Sesión inválida',
          text: 'No hay una sesión de analista activa.',
        });
        return false;
      }

      setIsLoadingOperations(true);
      setError(null);

      try {
        await operationService.assignDriver(operationId, {
          driverId,
          analystId: Number(currentUser.id),
        });

        await fetchOperations();

        await Swal.fire({
          icon: 'success',
          title: 'Asignación exitosa',
          text: 'El conductor fue asignado y notificado por WhatsApp.',
          timer: 2500,
          showConfirmButton: false,
        });

        return true;
      } catch (error) {
        console.error('Error asignando conductor:', error);
        throw error;
      } finally {
        setIsLoadingOperations(false);
      }
    },
    [fetchOperations, setError, setIsLoadingOperations]
  );

  // ─────────────────────────────
  // CREATE OPERATION
  // ─────────────────────────────
  const createOperation = useCallback(
    async (data: CreateOperationInput) => {
      setIsLoadingOperations(true);
      setError(null);

      try {
        await operationService.createOperation(data);
        await fetchOperations();

        useUIStore.getState().closeCreateModal();

        await Swal.fire({
          icon: 'success',
          title: 'Operación creada',
          text: 'La nueva operación ha sido registrada exitosamente.',
          timer: 2000,
          showConfirmButton: false,
        });

        return true;
      } catch (error) {
        console.error('Error creando operación:', error);
        setError(error instanceof Error ? error.message : 'Error creando la operación');
        throw error;
      } finally {
        setIsLoadingOperations(false);
      }
    },
    [fetchOperations, setError, setIsLoadingOperations]
  );

  // INITIAL LOAD
  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  return {
    operations,
    currentOperation,
    meta,
    isLoadingOperations,
    isLoadingCurrent,
    error,
    fetchOperations,
    fetchOperationById,
    assignDriver,
    createOperation,
  };
}
// src/hooks/useAssignments.ts
'use client';

import { useCallback } from 'react';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showToast } from '@/utils/alerts';
import { assignmentService } from '@/services/assignmentAnlystClient.service';
import {
  CreateAssignmentInput,
  CreateDelegationInput,
} from '@/types/assignmentAnlist';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';

export function useAssignments() {
  const queryClient = useQueryClient();

  const {
    data: assignments = [],
    isLoading: isLoadingAssignments,
    error: queryError,
    refetch: refreshAssignments,
  } = useQuery({
    queryKey: ['assignments'],
    queryFn: assignmentService.getAll,
    staleTime: 1000 * 60 * 5,
  });
  const {
    data: delegations = [],
    isLoading: isLoadingDelegations,
    error: delegationsQueryError,
    refetch: refreshDelegations,
  } = useQuery({
    queryKey: ['analyst-delegations'],
    queryFn: assignmentService.getActiveDelegations,
    staleTime: 1000 * 60,
  });

  let errorMessage: string | null = null;
  if (queryError) {
    errorMessage = getUserFriendlyErrorMessage(
      queryError,
      'No se pudieron cargar las asignaciones. Inténtalo de nuevo.',
    );
  }
  const delegationsError = delegationsQueryError
    ? getUserFriendlyErrorMessage(
        delegationsQueryError,
        'No se pudieron cargar las coberturas parciales.',
      )
    : null;

  const createMutation = useMutation({
    mutationFn: (data: CreateAssignmentInput) => assignmentService.create(data),
    onSuccess: () => {
      showToast.success('Asignación de permiso registrada exitosamente.');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showToast.error(err.response?.data?.message || 'No se pudo crear la asignación.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (clientId: number) => assignmentService.deleteByClient(clientId),
    onSuccess: () => {
      showToast.success('Permiso revocado exitosamente.');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showToast.error(err.response?.data?.message || 'No se pudo revocar la asignación.');
    },
  });

  const createDelegationMutation = useMutation({
    mutationFn: (data: CreateDelegationInput) =>
      assignmentService.createDelegation(data),
    onSuccess: async () => {
      showToast.success('Cobertura parcial asignada correctamente.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['analyst-delegations'] }),
        queryClient.invalidateQueries({ queryKey: ['assignments'] }),
        queryClient.invalidateQueries({ queryKey: ['trafico'] }),
        queryClient.invalidateQueries({ queryKey: ['operations'] }),
      ]);
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showToast.error(
        err.response?.data?.message || 'No se pudo crear la cobertura.',
      );
    },
  });

  const revokeDelegationMutation = useMutation({
    mutationFn: (delegationId: number) =>
      assignmentService.revokeDelegation(delegationId),
    onSuccess: async () => {
      showToast.success('La cobertura se finalizó correctamente.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['analyst-delegations'] }),
        queryClient.invalidateQueries({ queryKey: ['assignments'] }),
        queryClient.invalidateQueries({ queryKey: ['trafico'] }),
        queryClient.invalidateQueries({ queryKey: ['operations'] }),
      ]);
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showToast.error(
        err.response?.data?.message || 'No se pudo finalizar la cobertura.',
      );
    },
  });

  const createAssignment = useCallback(
    async (data: CreateAssignmentInput): Promise<boolean> => {
      try {
        await createMutation.mutateAsync(data);
        return true;
      } catch {
        return false;
      }
    },
    [createMutation]
  );

  const removeAssignment = useCallback(
    async (clientId: number): Promise<boolean> => {
      const result = await Swal.fire({
        title: '¿Revocar asignación?',
        text: 'El analista dejará de gestionar este cliente en todas sus ubicaciones inmediatamente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, revocar',
        cancelButtonText: 'Cancelar',
      });

      if (!result.isConfirmed) return false;

      try {
        await deleteMutation.mutateAsync(clientId);
        return true;
      } catch {
        return false;
      }
    },
    [deleteMutation]
  );

  const createDelegation = useCallback(
    async (data: CreateDelegationInput): Promise<boolean> => {
      try {
        await createDelegationMutation.mutateAsync(data);
        return true;
      } catch {
        return false;
      }
    },
    [createDelegationMutation],
  );

  const revokeDelegation = useCallback(
    async (delegationId: number): Promise<boolean> => {
      const result = await Swal.fire({
        title: '¿Finalizar cobertura?',
        text: 'Se revocará el acceso delegado. Si hay operaciones delegadas, volverán al analista titular si no fueron reasignadas nuevamente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, finalizar',
        cancelButtonText: 'Cancelar',
      });
      if (!result.isConfirmed) return false;

      try {
        await revokeDelegationMutation.mutateAsync(delegationId);
        return true;
      } catch {
        return false;
      }
    },
    [revokeDelegationMutation],
  );

  return {
    assignments,
    delegations,
    isLoadingDelegations,
    delegationsError,
    isLoadingAssignments,
    error: errorMessage,
    createAssignment,
    removeAssignment,
    createDelegation,
    revokeDelegation,
    refreshDelegations,
    refreshAssignments,
    isAssigning: createMutation.isPending,
    isDelegating: createDelegationMutation.isPending,
  };
}


export function useMyAssignments() {
  const {
    data: myAssignments = [],
    isLoading: isLoadingMyAssignments,
    error: queryError,
    refetch: refreshMyAssignments,
  } = useQuery({
    queryKey: ['my-assignments'], 
    queryFn: assignmentService.getMyAssignments,
    staleTime: 1000 * 60 * 5, 
  });

  let errorMessage: string | null = null;
  if (queryError) {
    errorMessage = getUserFriendlyErrorMessage(
      queryError,
      'No se pudieron cargar tus asignaciones. Inténtalo de nuevo.',
    );
  }

  return {
    myAssignments,
    isLoadingMyAssignments,
    error: errorMessage,
    refreshMyAssignments,
  };
}
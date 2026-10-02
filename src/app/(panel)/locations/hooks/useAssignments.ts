// src/hooks/useAssignments.ts
'use client';

import { useCallback } from 'react';
import Swal from 'sweetalert2';
import axios, { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showToast } from '@/utils/alerts';
import { assignmentService } from '@/services/assignmentAnlystClient.service';
import { CreateAssignmentInput } from '@/types/assignmentAnlist';

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

  let errorMessage: string | null = null;
  if (queryError) {
    errorMessage = axios.isAxiosError(queryError)
      ? queryError.response?.data?.message || 'Error al cargar asignaciones'
      : queryError.message || 'Error al cargar asignaciones';
  }

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
    mutationFn: (id: number) => assignmentService.delete(id),
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
    async (id: number): Promise<boolean> => {
      const result = await Swal.fire({
        title: '¿Revocar permiso?',
        text: 'El analista dejará de visualizar las operaciones de este cliente en esta bodega inmediatamente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, revocar',
        cancelButtonText: 'Cancelar',
      });

      if (!result.isConfirmed) return false;

      try {
        await deleteMutation.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
    [deleteMutation]
  );

  return {
    assignments,
    isLoadingAssignments,
    error: errorMessage,
    createAssignment,
    removeAssignment,
    refreshAssignments,
    isAssigning: createMutation.isPending,
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
    errorMessage = axios.isAxiosError(queryError)
      ? queryError.response?.data?.message || 'Error al cargar tus asignaciones'
      : queryError.message || 'Error al cargar tus asignaciones';
  }

  return {
    myAssignments,
    isLoadingMyAssignments,
    error: errorMessage,
    refreshMyAssignments,
  };
}
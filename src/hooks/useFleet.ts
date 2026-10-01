'use client';

import { useCallback } from 'react';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { assignmentsService } from '@/services/fleet.service';
import { CreateAssignmentDto } from '@/types/fleet-types';
import { showToast } from '@/utils/alerts';

interface BackendErrorResponse {
  message?: string;
}

export const useAssignments = () => {
  const queryClient = useQueryClient();

  // ==========================================
  // QUERY: CARGAR ASIGNACIONES ACTIVAS
  // ==========================================
  const {
    data: activeAssignments = [],
    isLoading: isQueryLoading,
    refetch: loadActive,
  } = useQuery({
    queryKey: ['active-assignments'],
    queryFn: assignmentsService.getActive,
    staleTime: 1000 * 60 * 2,
  });

  // ==========================================
  // MUTACIONES
  // ==========================================
  const assignMutation = useMutation({
    mutationFn: (data: CreateAssignmentDto) => assignmentsService.assign(data),
    onSuccess: () => {
      showToast.success('Vehículo asignado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['active-assignments'] });
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'No se pudo realizar la asignación';
      showToast.error(message);
    }
  });

  const unassignMutation = useMutation({
    mutationFn: (vehicleId: number) => assignmentsService.unassign(vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-assignments'] });
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'No se pudo liberar el vehículo';
      showToast.error(message);
    }
  });

  // ==========================================
  // WRAPPERS (Para mantener tu UI intacta)
  // ==========================================
  const assignDriver = useCallback(async (data: CreateAssignmentDto): Promise<boolean> => {
    try {
      await assignMutation.mutateAsync(data);
      return true;
    } catch (err) {
      return false;
    }
  }, [assignMutation]);

  const unassignVehicle = useCallback(async (vehicleId: number, plate: string): Promise<boolean> => {
    const confirm = await Swal.fire({
      title: '¿Liberar vehículo?',
      text: `¿Estás seguro de quitarle el conductor al vehículo ${plate}? El camión quedará libre.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, liberar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return false;

    try {
      await unassignMutation.mutateAsync(vehicleId);
      showToast.success(`El vehículo ${plate} ahora está sin conductor`);
      return true;
    } catch (err) {
      return false;
    }
  }, [unassignMutation]);

  const isLoading = isQueryLoading || assignMutation.isPending || unassignMutation.isPending;

  return {
    activeAssignments,
    isLoading,
    loadActive,
    assignDriver,
    unassignVehicle,
  };
};
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationService } from '@/services/operation.service'; 
import Swal from 'sweetalert2';

export const useProgramacion = (date: string) => {
  const queryClient = useQueryClient();

  // ==========================================
  // 1. OBTENER PROGRAMACIÓN POR FECHA
  // ==========================================
  const {
    data: operations = [],
    isLoading: isLoadingOperations,
    refetch: refreshOperations,
  } = useQuery({
    queryKey: ['operations', 'by-date', date],
    queryFn: () => operationService.getOperationsByDate(date),
    retry: false, // Fundamental para evitar que React Query insista si hay error 404 (sin viajes)
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
  });

  // ==========================================
  // 2. CREAR NUEVA PROGRAMACIÓN
  // ==========================================
  const createMutation = useMutation({
    mutationFn: (data: any) => operationService.createOperation(data),
    onSuccess: () => {
      // Invalidamos para que tanto la vista de programación como la de tráfico se actualicen
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['trafico'] });
      
      Swal.fire({
        title: '¡Programación Guardada!',
        text: 'La operación ha sido registrada con éxito.',
        icon: 'success',
        confirmButtonColor: '#4f46e5', // Color índigo (Tailwind)
      });
    },
    onError: (error: any) => {
      console.error('Error al guardar:', error);
      // Extraemos el mensaje de validación del backend (ej: "Vehículo en mantenimiento")
      const errorMsg = error.response?.data?.message || 'Hubo un error al guardar la programación.';
      
      Swal.fire({
        title: 'Atención',
        text: errorMsg,
        icon: 'error',
        confirmButtonColor: '#ef4444', // Color rose (Tailwind)
      });
    }
  });

  // ==========================================
  // 3. CANCELAR PROGRAMACIÓN (LÓGICO)
  // ==========================================
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
    onError: (error: any) => {
      console.error('Error al cancelar:', error);
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
    refreshOperations,
    
    // Funciones y estados de escritura
    createOperation: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    
    cancelOperation: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
  };
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Ajusta la ruta de importación según dónde guardaste los 3 métodos
import { getFleetSchedules, createFleetSchedule, cancelFleetSchedule } from '@/services/fleet-schedules.service'; 
import Swal from 'sweetalert2';

export const useFleetSchedules = (date: string) => {
  const queryClient = useQueryClient();

  const {
    data: schedules = [],
    isLoading: isLoadingSchedules,
    refetch: refreshSchedules,
  } = useQuery({
    queryKey: ['fleet-schedules', date],
    queryFn: () => getFleetSchedules(date),
    retry: false, // Fundamental para evitar que React Query insista si hay error
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: createFleetSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-schedules'] });
      // Si tienes un sistema de toasts (como sonner o react-hot-toast), puedes agregarlo aquí.
      Swal.fire('¡Programación guardada con éxito!');
    },
    onError: (error) => {
      console.error('Error al guardar:', error);
      Swal.fire('Hubo un error al guardar la programación.');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: cancelFleetSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-schedules'] });
      Swal.fire('Programación cancelada correctamente.');
    },
    onError: (error) => {
      console.error('Error al cancelar:', error);
      Swal.fire('No se pudo cancelar la programación.');
    }
  });

  return {
    schedules,
    isLoadingSchedules,
    refreshSchedules,
    createSchedule: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    cancelSchedule: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
  };
};
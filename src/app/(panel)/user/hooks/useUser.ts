import { userService } from '@/services/userService';
import { UserFormData } from '@/types/user-types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';


export function useUsers() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      showToast.success('Usuario creado correctamente.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserFormData> }) => userService.update(id, data),
    onSuccess: () => {
      showToast.success('Usuario actualizado correctamente.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const disableMutation = useMutation({
    mutationFn: userService.disable,
    onSuccess: () => {
      showToast.success('Usuario desactivado.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => showToast.error(getUserFriendlyErrorMessage(error, 'No se pudo desactivar el usuario.')),
  });

  const enableMutation = useMutation({
    mutationFn: userService.enable,
    onSuccess: () => {
      showToast.success('Usuario reactivado.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => showToast.error(getUserFriendlyErrorMessage(error, 'No se pudo reactivar el usuario.')),
  });

  return {
    users: usersQuery.data || [],
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    refetch: usersQuery.refetch,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    disable: disableMutation.mutateAsync,
    enable: enableMutation.mutateAsync,
  };
}
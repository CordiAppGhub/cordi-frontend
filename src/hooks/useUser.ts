// src/hooks/useUsers.ts
import { userService } from '@/services/userService';
import { UserFormData } from '@/types/user-types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export function useUsers() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserFormData> }) => userService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const disableMutation = useMutation({
    mutationFn: userService.disable,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  return {
    users: usersQuery.data || [],
    isLoading: usersQuery.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    disable: disableMutation.mutateAsync,
  };
}
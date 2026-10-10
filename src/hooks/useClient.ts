'use client';

import { useCallback } from 'react';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showToast } from '@/utils/alerts';
import { CreateClientInput, UpdateClientInput } from '@/types/client.-types';
import { clientService } from '@/services/client-service';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';


interface BackendErrorResponse { message?: string; }

export function useClients() {
  const queryClient = useQueryClient();

  const {
    data: clients = [],
    isLoading: isLoadingClients,
    error: queryError,
    refetch: refreshClients,
  } = useQuery({
    queryKey: ['clients'],
    queryFn: clientService.getAll,
    staleTime: 1000 * 60 * 10,
  });

  let errorMessage: string | null = null;
  if (queryError) {
    errorMessage = getUserFriendlyErrorMessage(
      queryError,
      'No se pudieron cargar los clientes. Inténtalo de nuevo.',
    );
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateClientInput) => clientService.create(data),
    onSuccess: () => {
      showToast.success('El cliente comercial ha sido registrado.');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'Error al registrar el cliente.';
      showToast.error(message);
    }
  });
  const createClientAsync = createMutation.mutateAsync;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClientInput }) => clientService.update(id, data),
    onSuccess: () => {
      showToast.success('Datos comerciales actualizados.');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'Error al actualizar.';
      showToast.error(message);
    }
  });
  const updateClientAsync = updateMutation.mutateAsync;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => clientService.delete(id),
    onSuccess: () => {
      showToast.success('Cliente eliminado del sistema.');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'No se pudo eliminar el cliente.';
      showToast.error(message);
    }
  });
  const deleteClientAsync = deleteMutation.mutateAsync;

  const createClient = useCallback(async (data: CreateClientInput): Promise<boolean> => {
    try {
      await createClientAsync(data);
      return true;
    } catch {
      return false;
    }
  }, [createClientAsync]);

  const updateClient = useCallback(async (id: number, data: UpdateClientInput): Promise<boolean> => {
    try {
      await updateClientAsync({ id, data });
      return true;
    } catch {
      return false;
    }
  }, [updateClientAsync]);

  const deleteClient = useCallback(async (id: number): Promise<boolean> => {
    const result = await Swal.fire({
      title: '¿Eliminar cliente?',
      text: "Si ya tiene tarifas u operaciones facturadas, el sistema bloqueará el borrado.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return false;

    try {
      await deleteClientAsync(id);
      return true;
    } catch {
      return false;
    }
  }, [deleteClientAsync]);

  return { 
    clients, 
    isLoadingClients, 
    error: errorMessage, 
    createClient, 
    updateClient, 
    deleteClient, 
    refreshClients 
  };
}
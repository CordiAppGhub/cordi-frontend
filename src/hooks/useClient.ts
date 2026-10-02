'use client';

import { useCallback } from 'react';
import Swal from 'sweetalert2';
import axios, { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showToast } from '@/utils/alerts';
import { CreateClientInput, UpdateClientInput } from '@/types/client.-types';
import { clientService } from '@/services/client-service';


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
    errorMessage = axios.isAxiosError(queryError)
      ? queryError.response?.data?.message || 'Error al cargar clientes'
      : queryError.message || 'Error al cargar clientes';
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

  const createClient = useCallback(async (data: CreateClientInput): Promise<boolean> => {
    try {
      await createMutation.mutateAsync(data);
      return true;
    } catch (err) {
      return false;
    }
  }, [createMutation]);

  const updateClient = useCallback(async (id: number, data: UpdateClientInput): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({ id, data });
      return true;
    } catch (err) {
      return false;
    }
  }, [updateMutation]);

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
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (err) {
      return false;
    }
  }, [deleteMutation]);

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
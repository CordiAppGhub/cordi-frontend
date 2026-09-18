'use client';

import { useCallback } from 'react';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';
import { useClientStore } from '@/store/use-client.store';
import { showToast } from '@/utils/alerts';
import { CreateClientInput, UpdateClientInput } from '@/types/client.-types';

interface BackendErrorResponse { message?: string; }

export function useClients() {
  const { clients, isLoadingClients, error, fetchClients, createClient: storeCreate, updateClient: storeUpdate, deleteClient: storeDelete } = useClientStore();

  const createClient = useCallback(async (data: CreateClientInput): Promise<boolean> => {
    try {
      await storeCreate(data);
      showToast.success('El cliente comercial ha sido registrado.');
      return true;
    } catch (err: unknown) {
      const message = (err as AxiosError<BackendErrorResponse>).response?.data?.message || 'Error al registrar el cliente.';
      showToast.error(message);
      return false;
    }
  }, [storeCreate]);

  const updateClient = useCallback(async (id: number, data: UpdateClientInput): Promise<boolean> => {
    try {
      await storeUpdate(id, data);
      showToast.success('Datos comerciales actualizados.');
      return true;
    } catch (err: unknown) {
      const message = (err as AxiosError<BackendErrorResponse>).response?.data?.message || 'Error al actualizar.';
      showToast.error(message);
      return false;
    }
  }, [storeUpdate]);

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
      await storeDelete(id);
      showToast.success('Cliente eliminado del sistema.');
      return true;
    } catch (err: unknown) {
      const message = (err as AxiosError<BackendErrorResponse>).response?.data?.message || 'No se pudo eliminar el cliente.';
      showToast.error(message);
      return false;
    }
  }, [storeDelete]);

  return { clients, isLoadingClients, error, createClient, updateClient, deleteClient, refreshClients: fetchClients };
}
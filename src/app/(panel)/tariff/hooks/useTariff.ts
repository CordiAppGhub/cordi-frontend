'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import{ AxiosError } from 'axios';

import {
  tariffService,
  CreateSurchargeCatalogInput,
  CreateAffiliationTariffInput,
  UpdateClientTariffInput,
} from '@/services/tariff.service';
import { showToast } from '@/utils/alerts';
import {
  CreateClientTariffInput,
  CreateSurchargeOverrideInput,
} from '@/types/tariff-ypes';

interface BackendErrorResponse {
  message?: string;
}

export function useTariffs() {
  const queryClient = useQueryClient();

  const invalidateOperationTariffs = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tariffs'] }),
      queryClient.invalidateQueries({ queryKey: ['tariff-lookup'] }),
      queryClient.invalidateQueries({ queryKey: ['trafico'] }),
      queryClient.invalidateQueries({ queryKey: ['trafico-client-operations'] }),
      queryClient.invalidateQueries({ queryKey: ['operations'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'operation-alerts'] }),
    ]);

  
  const {
    data: clientTariffs = [],
    isLoading: isLoadingClientTariffs,
    error: clientTariffsError,
    refetch: refreshTariffs,
  } = useQuery({
    queryKey: ['client-tariffs'],
    queryFn: tariffService.getAllClientTariffs,
    staleTime: 1000 * 60 * 10,
  });

  const {
    data: surcharges = [],
    isLoading: isLoadingSurcharges,
    refetch: refreshSurcharges,
  } = useQuery({
    queryKey: ['surcharges'],
    queryFn: tariffService.getAllSurcharges,
    staleTime: 1000 * 60 * 10,
  });

  const {
    data: vehicleTypes = [],
    isLoading: isLoadingVehicleTypes,
    isError: vehicleTypesError,
  } = useQuery({
    queryKey: ['cargo-vehicle-types'],
    queryFn: tariffService.getCargoVehicleTypes,
    staleTime: 1000 * 60 * 60,
  });

  const {
    data: vehicleTariffs = [],
    isLoading: isLoadingVehicles,
    refetch: fetchVehicleTariffs, 
  } = useQuery({
    queryKey: ['vehicle-tariffs'],
    queryFn: tariffService.getAllVehicleTariffs,
    staleTime: 1000 * 60 * 10,
  });

  const isLoadingTariffs =
    isLoadingClientTariffs ||
    isLoadingSurcharges ||
    isLoadingVehicleTypes;
  const error = clientTariffsError ? 'Error al cargar las tarifas o recargos' : null;



  const createTariffMutation = useMutation({
    mutationFn: (data: CreateClientTariffInput) => tariffService.createClientTariff(data),
    onSuccess: async () => {
      showToast.success('La tarifa base ha sido registrada exitosamente.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['client-tariffs'] }),
        invalidateOperationTariffs(),
      ]);
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'No se pudo registrar la tarifa.';
      showToast.error(message);
    }
  });

  const updateTariffMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClientTariffInput }) =>
      tariffService.updateClientTariff(id, data),
    onSuccess: async () => {
      showToast.success('La tarifa se actualizó correctamente.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['client-tariffs'] }),
        invalidateOperationTariffs(),
      ]);
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'No se pudo actualizar la tarifa.';
      showToast.error(message);
    },
  });

  const createSurchargeMutation = useMutation({
    mutationFn: (data: CreateSurchargeCatalogInput) => tariffService.createSurchargeCatalog(data),
    onSuccess: () => {
      showToast.success('La novedad ha sido agregada al catálogo global.');
      queryClient.invalidateQueries({ queryKey: ['surcharges'] });
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'No se pudo registrar la novedad.';
      showToast.error(message);
    }
  });

  const createOverrideMutation = useMutation({
    mutationFn: (data: CreateSurchargeOverrideInput) => tariffService.createSurchargeOverride(data),
    onSuccess: () => {
      showToast.success('La tarifa especial para este cliente ha sido guardada.');
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['client-tariffs'] }),
        queryClient.invalidateQueries({ queryKey: ['tariffs'] }),
        queryClient.invalidateQueries({ queryKey: ['tariff-lookup'] }),
      ]);
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'No se pudo guardar la excepción.';
      showToast.error(message);
    }
  });

  const createVehicleTariffMutation = useMutation({
    mutationFn: (data: CreateAffiliationTariffInput) => tariffService.upsertVehicleTariff(data),
    onSuccess: async () => {
      showToast.success('La tarifa de flota se ha configurado exitosamente.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vehicle-tariffs'] }),
        invalidateOperationTariffs(),
      ]);
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'No se pudo guardar la tarifa de flota.';
      showToast.error(message);
    }
  });

  const deleteTariffMutation = useMutation({
    mutationFn: (id: number) => tariffService.deleteClientTariff(id),
    onSuccess: async () => {
      showToast.success('La tarifa se eliminó correctamente.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['client-tariffs'] }),
        invalidateOperationTariffs(),
      ]);
    },
    onError: (error: unknown) =>
      showToast.error(error, 'No se pudo eliminar la tarifa.'),
  });

  const updateSurchargeMutation = useMutation({
    mutationFn: ({
      code,
      data,
    }: {
      code: string;
      data: Partial<Omit<CreateSurchargeCatalogInput, 'code'>>;
    }) => tariffService.updateSurchargeCatalog(code, data),
    onSuccess: async () => {
      showToast.success('El concepto se actualizó correctamente.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['surcharges'] }),
        invalidateOperationTariffs(),
      ]);
    },
    onError: (error: unknown) =>
      showToast.error(error, 'No se pudo actualizar el concepto.'),
  });

  const deleteSurchargeMutation = useMutation({
    mutationFn: (code: string) => tariffService.deleteSurchargeCatalog(code),
    onSuccess: async () => {
      showToast.success('El concepto se eliminó correctamente.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['surcharges'] }),
        invalidateOperationTariffs(),
      ]);
    },
    onError: (error: unknown) =>
      showToast.error(error, 'No se pudo eliminar el concepto.'),
  });

  const updateOverrideMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateSurchargeOverrideInput>;
    }) => tariffService.updateSurchargeOverride(id, data),
    onSuccess: async () => {
      showToast.success('El precio especial se actualizó correctamente.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['surcharge-overrides'] }),
        queryClient.invalidateQueries({ queryKey: ['tariffs'] }),
        queryClient.invalidateQueries({ queryKey: ['tariff-lookup'] }),
      ]);
    },
    onError: (error: unknown) =>
      showToast.error(error, 'No se pudo actualizar el precio especial.'),
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: (id: number) => tariffService.deleteSurchargeOverride(id),
    onSuccess: async () => {
      showToast.success('El precio especial se eliminó correctamente.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['surcharge-overrides'] }),
        queryClient.invalidateQueries({ queryKey: ['tariffs'] }),
        queryClient.invalidateQueries({ queryKey: ['tariff-lookup'] }),
      ]);
    },
    onError: (error: unknown) =>
      showToast.error(error, 'No se pudo eliminar el precio especial.'),
  });

  const updateVehicleTariffMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateAffiliationTariffInput>;
    }) => tariffService.updateVehicleTariff(id, data),
    onSuccess: async () => {
      showToast.success('La tarifa de afiliación se actualizó correctamente.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vehicle-tariffs'] }),
        invalidateOperationTariffs(),
      ]);
    },
    onError: (error: unknown) =>
      showToast.error(error, 'No se pudo actualizar la tarifa de afiliación.'),
  });

  const deleteVehicleTariffMutation = useMutation({
    mutationFn: (id: number) => tariffService.deleteVehicleTariff(id),
    onSuccess: async () => {
      showToast.success('La tarifa de afiliación se eliminó correctamente.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vehicle-tariffs'] }),
        invalidateOperationTariffs(),
      ]);
    },
    onError: (error: unknown) =>
      showToast.error(error, 'No se pudo eliminar la tarifa de afiliación.'),
  });

  const createTariff = useCallback(async (data: CreateClientTariffInput): Promise<boolean> => {
    try {
      await createTariffMutation.mutateAsync(data);
      return true;
    } catch { return false; }
  }, [createTariffMutation]);

  const updateTariff = useCallback(async (
    id: number,
    data: UpdateClientTariffInput,
  ): Promise<boolean> => {
    try {
      await updateTariffMutation.mutateAsync({ id, data });
      return true;
    } catch {
      return false;
    }
  }, [updateTariffMutation]);

  const deleteTariff = useCallback(async (id: number): Promise<boolean> => {
    try {
      await deleteTariffMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  }, [deleteTariffMutation]);

  const createBaseSurcharge = useCallback(async (data: CreateSurchargeCatalogInput): Promise<boolean> => {
    try {
      await createSurchargeMutation.mutateAsync(data);
      return true;
    } catch { return false; }
  }, [createSurchargeMutation]);

  const updateBaseSurcharge = useCallback(async (
    code: string,
    data: Partial<Omit<CreateSurchargeCatalogInput, 'code'>>,
  ): Promise<boolean> => {
    try {
      await updateSurchargeMutation.mutateAsync({ code, data });
      return true;
    } catch {
      return false;
    }
  }, [updateSurchargeMutation]);

  const deleteBaseSurcharge = useCallback(async (code: string): Promise<boolean> => {
    try {
      await deleteSurchargeMutation.mutateAsync(code);
      return true;
    } catch {
      return false;
    }
  }, [deleteSurchargeMutation]);

  const createClientOverride = useCallback(async (data: CreateSurchargeOverrideInput): Promise<boolean> => {
    try {
      await createOverrideMutation.mutateAsync(data);
      return true;
    } catch { return false; }
  }, [createOverrideMutation]);

  const updateClientOverride = useCallback(async (
    id: number,
    data: Partial<CreateSurchargeOverrideInput>,
  ): Promise<boolean> => {
    try {
      await updateOverrideMutation.mutateAsync({ id, data });
      return true;
    } catch {
      return false;
    }
  }, [updateOverrideMutation]);

  const deleteClientOverride = useCallback(async (id: number): Promise<boolean> => {
    try {
      await deleteOverrideMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  }, [deleteOverrideMutation]);

  const createVehicleTariff = useCallback(async (data: CreateAffiliationTariffInput): Promise<boolean> => {
    try {
      await createVehicleTariffMutation.mutateAsync(data);
      return true;
    } catch { return false; }
  }, [createVehicleTariffMutation]);

  const updateVehicleTariff = useCallback(async (
    id: number,
    data: Partial<CreateAffiliationTariffInput>,
  ): Promise<boolean> => {
    try {
      await updateVehicleTariffMutation.mutateAsync({ id, data });
      return true;
    } catch {
      return false;
    }
  }, [updateVehicleTariffMutation]);

  const deleteVehicleTariff = useCallback(async (id: number): Promise<boolean> => {
    try {
      await deleteVehicleTariffMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  }, [deleteVehicleTariffMutation]);

  return {
    clientTariffs,
    surcharges,
    isLoadingTariffs,
    error,
    createTariff,
    updateTariff,
    deleteTariff,
    refreshTariffs,
    
    createBaseSurcharge,
    updateBaseSurcharge,
    deleteBaseSurcharge,
    createClientOverride,
    updateClientOverride,
    deleteClientOverride,
    refreshSurcharges,

    vehicleTariffs,
    vehicleTypes,
    isLoadingVehicles,
    vehicleTypesError,
    fetchVehicleTariffs,
    createVehicleTariff,
    updateVehicleTariff,
    deleteVehicleTariff,
  };
}
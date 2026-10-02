'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import{ AxiosError } from 'axios';

import { tariffService, CreateSurchargeCatalogInput, CreateAffiliationTariffInput } from '@/services/tariff.service';
import { showToast } from '@/utils/alerts';
import { AffiliationTariff, CreateClientTariffInput, CreateSurchargeOverrideInput } from '@/types/tariff-ypes';

interface BackendErrorResponse {
  message?: string;
}

export function useTariffs() {
  const queryClient = useQueryClient();

  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);


  
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
    data: vehicleTariffs = [],
    isLoading: isLoadingVehicles,
    refetch: fetchVehicleTariffs, 
  } = useQuery({
    queryKey: ['vehicle-tariffs'],
    queryFn: tariffService.getAllVehicleTariffs,
    staleTime: 1000 * 60 * 10,
  });

  const isLoadingTariffs = isLoadingClientTariffs || isLoadingSurcharges;
  const error = clientTariffsError ? 'Error al cargar las tarifas o recargos' : null;



  const createTariffMutation = useMutation({
    mutationFn: (data: CreateClientTariffInput) => tariffService.createClientTariff(data),
    onSuccess: () => {
      showToast.success('La tarifa base ha sido registrada exitosamente.');
      queryClient.invalidateQueries({ queryKey: ['client-tariffs'] });
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'No se pudo registrar la tarifa.';
      showToast.error(message);
    }
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
      queryClient.invalidateQueries({ queryKey: ['client-tariffs'] }); 
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'No se pudo guardar la excepción.';
      showToast.error(message);
    }
  });

  const createVehicleTariffMutation = useMutation({
    mutationFn: (data: CreateAffiliationTariffInput) => tariffService.upsertVehicleTariff(data),
    onSuccess: () => {
      showToast.success('La tarifa de flota se ha configurado exitosamente.');
      queryClient.invalidateQueries({ queryKey: ['vehicle-tariffs'] });
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      const message = err.response?.data?.message || 'No se pudo guardar la tarifa de flota.';
      showToast.error(message);
    }
  });

  

  const createTariff = useCallback(async (data: CreateClientTariffInput): Promise<boolean> => {
    try {
      await createTariffMutation.mutateAsync(data);
      return true;
    } catch { return false; }
  }, [createTariffMutation]);

  const createBaseSurcharge = useCallback(async (data: CreateSurchargeCatalogInput): Promise<boolean> => {
    try {
      await createSurchargeMutation.mutateAsync(data);
      return true;
    } catch { return false; }
  }, [createSurchargeMutation]);

  const createClientOverride = useCallback(async (data: CreateSurchargeOverrideInput): Promise<boolean> => {
    try {
      await createOverrideMutation.mutateAsync(data);
      return true;
    } catch { return false; }
  }, [createOverrideMutation]);

  const createVehicleTariff = useCallback(async (data: CreateAffiliationTariffInput): Promise<boolean> => {
    try {
      await createVehicleTariffMutation.mutateAsync(data);
      return true;
    } catch { return false; }
  }, [createVehicleTariffMutation]);


  const getLiveQuote = useCallback(async (
    clientId: number | null, 
    operationType: string | null, 
    isAnticipada: boolean = false,
    locationId?: number | null
  ) => {
    if (!clientId || !operationType) {
      setSuggestedPrice(null);
      return;
    }

    setIsCalculatingPrice(true);
    try {
      const quote = await tariffService.getQuote({
        clientId,
        operationType,
        isAnticipada,
        locationId: locationId || undefined,
      });
      setSuggestedPrice(quote.price);
    } catch (err) {
      setSuggestedPrice(null);
    } finally {
      setIsCalculatingPrice(false);
    }
  }, []);

  const resetQuote = useCallback(() => {
    setSuggestedPrice(null);
  }, []);

  return {
    clientTariffs,
    surcharges,
    isLoadingTariffs,
    error,
    createTariff,
    refreshTariffs,
    
    createBaseSurcharge,
    createClientOverride,
    refreshSurcharges,

    vehicleTariffs,
    isLoadingVehicles,
    fetchVehicleTariffs,
    createVehicleTariff,
    
    suggestedPrice,
    isCalculatingPrice,
    getLiveQuote,
    resetQuote,
  };
}
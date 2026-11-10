'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationService } from '@/services/operation.service';
import { driversService } from '@/services/driver.service';
import { vehiclesService } from '@/services/vehicles.service';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
import { useAmparosStore } from '@/store/use-amparos.store';
import { socket } from '@/lib/socket';
import { useEffect } from 'react';

export const useAmparos = (enabled: boolean) => {
  const queryClient = useQueryClient();
  const { closeConfirmation } = useAmparosStore();

  useEffect(() => {
    // Cuando el backend toque el timbre, invalidamos la caché silenciosamente
    const handleAmparosUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['amparo-suggestions'] });
    };

    socket.on('amparos_suggestions_updated', handleAmparosUpdate);

    return () => {
      socket.off('amparos_suggestions_updated', handleAmparosUpdate);
    };
  }, [queryClient]);

  const suggestionsQuery = useQuery({
    queryKey: ['amparo-suggestions'],
    queryFn: operationService.getAmparoSuggestions,
    enabled,
   
    refetchOnWindowFocus: false, 
  });

  // Solo se ejecutan si el usuario hizo clic en "Revisar y aceptar" (cuando hay una sugerencia seleccionada)
  const isSelected = Boolean(useAmparosStore.getState().selectedSuggestion);

  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: driversService.getAll,
    enabled: isSelected,
    staleTime: 5 * 60 * 1000, // Cacheamos los conductores por 5 mins para no saturar
  });

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesService.getAll,
    enabled: isSelected,
    staleTime: 5 * 60 * 1000,
  });

  const confirmMutation = useMutation({
    mutationFn: operationService.confirmAmparo,
    onSuccess: async () => {
      showToast.success('Amparo confirmado; ambas operaciones comparten conductor y vehículo.');
      closeConfirmation();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['amparo-suggestions'] }),
        queryClient.invalidateQueries({ queryKey: ['trafico'] }),
      ]);
    },
    onError: (error) => {
      showToast.error(getUserFriendlyErrorMessage(error, 'No se pudo confirmar el amparo.'));
    }
  });

  return {
    suggestionsQuery,
    driversQuery,
    vehiclesQuery,
    confirmMutation
  };
};
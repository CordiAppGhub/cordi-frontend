'use client';

import { useEffect } from 'react';
import { useLocationStore } from '../store/use-location.store';

export function useLocations() {
  const {
    locations,
    isLoadingLocations,
    error,
    fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
  } = useLocationStore();

  // Cargamos los datos automáticamente al montar la vista
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return {
    locations,
    isLoadingLocations,
    error,
    createLocation,
    updateLocation,
    deleteLocation,
    refreshLocations: fetchLocations,
  };
}
'use client';

import { useState, useCallback } from 'react';
import { driversService } from '@/services/driver.service';

export function useDriverDetail() {
  const [details, setDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDriverDetails = useCallback(async (driverId: number) => {
    if (isNaN(driverId)) {
      setError('ID de conductor inválido.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await driversService.getById(driverId);
      setDetails(data);
    } catch (err) {
      console.error('Error al cargar detalle del conductor:', err);
      setError('No se pudo cargar la información del conductor.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    details,
    isLoading,
    error,
    loadDriverDetails,
  };
}
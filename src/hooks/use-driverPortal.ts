import { useState, useEffect, useCallback } from 'react';
import { driverPortalService } from '@/services/driverPortal.service';
import { DriverPortalData, TripMicroState, OcrResult } from '@/types/driver-portal.types';
import { showToast } from '@/utils/alerts';
import { AxiosError } from 'axios';

interface BackendErrorResponse {
  message?: string;
}

export function useDriverPortal(token: string | null) {
  const [driver, setDriver] = useState<DriverPortalData | null>(null);
  const [loading, setLoading] = useState<boolean>(!!token);
  const [error, setError] = useState<string | null>(token ? null : 'Token de acceso no proporcionado.');
  const [uploading, setUploading] = useState<boolean>(false);
  const [processingState, setProcessingState] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const data = await driverPortalService.getByToken(token);
      setDriver(data);
      setError(null);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let isActive = true;

    async function fetchInitialData() {
      try {
        setLoading(true);
        const data = await driverPortalService.getByToken(token!);
        if (isActive) {
          setDriver(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (isActive) {
          console.error(err);
          setError('El enlace es inválido, ha expirado o no se encontraron datos.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchInitialData();

    return () => {
      isActive = false;
    };
  }, [token]);

  const uploadEvidence = async (operationId: number, file: File): Promise<void> => {
    try {
      setUploading(true);
      await driverPortalService.uploadEvidence(operationId, file);
      showToast.success('¡Evidencia subida correctamente!');
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'Error al subir la imagen. Inténtalo de nuevo.';
      showToast.error(message);
      throw new Error(message);
    } finally {
      setUploading(false);
    }
  };

  const updateTravelState = async (operationId: number, estadoViaje: TripMicroState | 'FINALIZADO'): Promise<void> => {
    if (!token) return;
    try {
      setProcessingState(true);
      await driverPortalService.updateTravelState(operationId, estadoViaje, token);
      showToast.success('Estado del viaje actualizado correctamente.');
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'Error al actualizar el estado del viaje.';
      showToast.error(message);
    } finally {
      setProcessingState(false);
    }
  };

  const scanPlate = async (operationId: number, file: File): Promise<OcrResult | null> => {
    if (!token) return null;
    try {
      setProcessingState(true);
      const result = await driverPortalService.scanPlate(operationId, file, token);
      await loadData();
      return result;
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'Error al analizar la placa con IA.';
      showToast.error(message);
      return null;
    } finally {
      setProcessingState(false);
    }
  };

  const scanContainer = async (operationId: number, file: File): Promise<OcrResult | null> => {
    if (!token) return null;
    try {
      setProcessingState(true);
      const result = await driverPortalService.scanContainer(operationId, file, token);
      await loadData();
      return result;
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'Error al analizar el contenedor con IA.';
      showToast.error(message);
      return null;
    } finally {
      setProcessingState(false);
    }
  };

  return {
    driver,
    loading,
    error,
    uploading,
    processingState,
    uploadEvidence,
    updateTravelState,
    scanPlate,
    scanContainer,
  };
}
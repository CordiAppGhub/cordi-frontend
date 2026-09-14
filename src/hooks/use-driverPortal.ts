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

  // 👈 Nuevos estados para el control de acceso
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(token ? null : 'Token de acceso no proporcionado.');

  const [uploading, setUploading] = useState<boolean>(false);
  const [processingState, setProcessingState] = useState<boolean>(false);

  // 👈 Función para validar la cédula ingresada por el conductor
  const authenticateDriver = useCallback(async (cedula: string) => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const data = await driverPortalService.getByToken(token, cedula);

      setDriver(data);
      setIsAuthenticated(true);
      localStorage.setItem(`driver_cedula_${token}`, cedula);
    } catch (err: unknown) {
      console.error(err);
      setIsAuthenticated(false);
      localStorage.removeItem(`driver_cedula_${token}`);

      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message = axiosError.response?.data?.message || 'Token o cédula incorrectos.';
      setError(message);
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Modificamos loadData para recargar silenciosamente usando la cédula guardada
  const loadData = useCallback(async () => {
    if (!token) return;
    const savedCedula = localStorage.getItem(`driver_cedula_${token}`);
    if (!savedCedula) return;

    try {
      const data = await driverPortalService.getByToken(token, savedCedula);
      setDriver(data);
      setError(null);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let isActive = true;

    async function checkSavedSession() {
      const savedCedula = localStorage.getItem(`driver_cedula_${token}`);
      if (savedCedula && isActive) {
        await authenticateDriver(savedCedula);
      }
    }

    checkSavedSession();

    return () => {
      isActive = false;
    };
  }, [token, authenticateDriver]);

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

  const updateTravelState = async (operationId: number, estadoViaje: string): Promise<void> => {
    if (!token) return;
    try {
      setProcessingState(true);
      await driverPortalService.updateTravelState(
        operationId,
        estadoViaje as TripMicroState | 'FINALIZADO',
        token
      );
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
    isAuthenticated, // 👈 Exportado para la vista
    authenticateDriver, // 👈 Exportado para la vista
    uploadEvidence,
    updateTravelState,
    scanPlate,
    scanContainer,
  };
}
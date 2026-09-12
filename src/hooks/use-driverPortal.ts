import { useState, useEffect } from 'react';
import { driverPortalService, DriverPortalData } from '@/services/driverPortal.service';

export function useDriverPortal(token: string | null) {
  const [driver, setDriver] = useState<DriverPortalData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [processingState, setProcessingState] = useState<boolean>(false); // 👈 Nuevo estado de carga para botones

  const loadData = async () => {
    if (!token) {
      setError('Token de acceso no proporcionado.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await driverPortalService.getByToken(token);
      setDriver(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('El enlace es inválido, ha expirado o no se encontraron datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const uploadEvidence = async (operationId: number, file: File) => {
    try {
      setUploading(true);
      await driverPortalService.uploadEvidence(operationId, file);
      alert('¡Evidencia subida correctamente!');
      await loadData();
    } catch (err: any) {
      console.error(err);
      throw new Error('Error al subir la imagen. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  // 👇 NUEVO: Función para actualizar estado del viaje desde los botones
  const updateTravelState = async (operationId: number, estadoViaje: string) => {
    if (!token) return;
    try {
      setProcessingState(true);
      await driverPortalService.updateTravelState(operationId, estadoViaje, token);
      await loadData(); // Recarga los datos para reflejar el nuevo botón en la UI
    } catch (err: any) {
      console.error(err);
      alert('Error al actualizar el estado del viaje.');
    } finally {
      setProcessingState(false);
    }
  };

  const scanPlate = async (operationId: number, file: File) => {
    if (!token) return null;
    try {
      setProcessingState(true);
      const result = await driverPortalService.scanPlate(operationId, file, token);
      await loadData();
      return result;
    } catch (err: any) {
      console.error(err);
      alert('Error al analizar la placa con IA.');
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
  };
}
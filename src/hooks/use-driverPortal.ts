import { useState, useEffect } from 'react';
import { driverPortalService, DriverPortalData } from '@/services/driverPortal.service';

export function useDriverPortal(token: string | null) {
  const [driver, setDriver] = useState<DriverPortalData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

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

  return {
    driver,
    loading,
    error,
    uploading,
    uploadEvidence,
  };
}
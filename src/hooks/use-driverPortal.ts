'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverAuthService, driverPortalService } from '@/services/driverPortal.service';
import { TripMicroState, OcrResult } from '@/types/driver-portal.types';
import { showToast } from '@/utils/alerts';
import { AxiosError } from 'axios';
import { useDriverAuthStore } from '@/store/use-auth-driver-store';

interface BackendErrorResponse {
  message?: string;
}

export function useDriverPortal() {
  const queryClient = useQueryClient();

  // 🚀 1. EXTRAEMOS ESTADOS Y ACCIONES DE ZUSTAND
  const { 
    authStep, 
    setAuthStep, 
    setLoginSuccess, 
    logout: logoutStore,
    driver: storeDriver,
    isAuthenticated: storeIsAuthenticated
  } = useDriverAuthStore();

  // Estado local exclusivo para errores de los inputs
  const [authError, setAuthError] = useState<string | null>(null);

  // ==========================================
  // 2. QUERY: VERIFICAR SESIÓN Y TRAER DATOS
  // ==========================================
  const {
    data: queryDriver = null,
    isLoading: loadingProfile,
    isSuccess: isProfileSuccess,
    refetch: loadData,
  } = useQuery({
    queryKey: ['driver-portal-profile'],
    queryFn: () => driverAuthService.getDriverProfile(),
    retry: false,
    staleTime: 1000 * 60 * 2, // Cache de 2 minutos
  });

  // ==========================================
  // 3. QUERY: HISTORIAL Y TRAZABILIDAD DE VIAJES
  // ==========================================
  const {
    data: history = [],
    isLoading: loadingHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['driver-trip-history'],
    queryFn: () => driverPortalService.getDriverHistory(),
    enabled: storeIsAuthenticated || (isProfileSuccess && !!queryDriver), // Solo busca si está autenticado
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
  });

  // 🚀 4. SINCRONIZAR REACT QUERY -> ZUSTAND
  useEffect(() => {
    if (isProfileSuccess && queryDriver) {
      setLoginSuccess(queryDriver);
    }
  }, [isProfileSuccess, queryDriver, setLoginSuccess]);

  // Combinamos los datos para evitar parpadeos en la UI
  const driver = storeDriver || queryDriver;
  const isAuthenticated = storeIsAuthenticated || (isProfileSuccess && !!queryDriver);

  // ==========================================
  // 5. MUTACIONES: AUTENTICACIÓN (OTP)
  // ==========================================
  const requestOtpMutation = useMutation({
    mutationFn: (cedula: string) => driverAuthService.requestOtp(cedula),
    onSuccess: () => {
      showToast.success('Código enviado. Revisa tus mensajes.');
      setAuthError(null);
      setAuthStep('OTP');
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      setAuthError(axiosError.response?.data?.message || 'Error al solicitar código.');
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ cedula, code }: { cedula: string; code: string }) => 
      driverAuthService.verifyOtp(cedula, code),
    onSuccess: () => {
      setAuthError(null);
      showToast.success('¡Bienvenido al portal!');
      queryClient.invalidateQueries({ queryKey: ['driver-portal-profile'] });
      queryClient.invalidateQueries({ queryKey: ['driver-trip-history'] });
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      setAuthError(axiosError.response?.data?.message || 'Código incorrecto o expirado.');
    },
  });

  const logout = async () => {
    queryClient.removeQueries({ queryKey: ['driver-portal-profile'] });
    queryClient.removeQueries({ queryKey: ['driver-trip-history'] });
    logoutStore();
  };

  // ==========================================
  // 6. MUTACIONES: OPERATIVAS DEL VIAJE
  // ==========================================
  const uploadEvidenceMutation = useMutation({
    mutationFn: ({ operationId, file }: { operationId: number; file: File }) =>
      driverPortalService.uploadEvidence(operationId, file),
    onSuccess: () => {
      showToast.success('¡Evidencia subida correctamente!');
      loadData();
      refetchHistory();
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      showToast.error(axiosError.response?.data?.message || 'Error al subir la imagen.');
    },
  });

  const updateStateMutation = useMutation({
    mutationFn: ({ operationId, estadoViaje }: { operationId: number; estadoViaje: string }) =>
      driverPortalService.updateTravelState(operationId, estadoViaje as TripMicroState),
    onSuccess: () => {
      showToast.success('Estado del viaje actualizado correctamente.');
      loadData();
      refetchHistory();
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      showToast.error(axiosError.response?.data?.message || 'Error al actualizar el estado.');
    },
  });

  const scanPlateMutation = useMutation({
    mutationFn: ({ operationId, file }: { operationId: number; file: File }) =>
      driverPortalService.scanPlate(operationId, file),
    onSuccess: () => {
      loadData();
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      showToast.error(axiosError.response?.data?.message || 'Error al analizar la placa.');
    },
  });

  const scanContainerMutation = useMutation({
    mutationFn: ({ operationId, file }: { operationId: number; file: File }) =>
      driverPortalService.scanContainer(operationId, file),
    onSuccess: () => {
      loadData();
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      showToast.error(axiosError.response?.data?.message || 'Error al analizar el contenedor.');
    },
  });

  // ==========================================
  // 7. WRAPPERS EXPORTABLES
  // ==========================================
  const uploadEvidence = async (operationId: number, file: File): Promise<void> => {
    await uploadEvidenceMutation.mutateAsync({ operationId, file });
  };

  const updateTravelState = async (operationId: number, estadoViaje: string): Promise<void> => {
    await updateStateMutation.mutateAsync({ operationId, estadoViaje });
  };

  const scanPlate = async (operationId: number, file: File): Promise<OcrResult | null> => {
    try {
      return await scanPlateMutation.mutateAsync({ operationId, file });
    } catch {
      return null;
    }
  };

  const scanContainer = async (operationId: number, file: File): Promise<OcrResult | null> => {
    try {
      return await scanContainerMutation.mutateAsync({ operationId, file });
    } catch {
      return null;
    }
  };

  // ==========================================
  // RETORNO DEL HOOK
  // ==========================================
  return {
    driver,
    loading: loadingProfile,
    isAuthenticated,
    
    // Historial y Trazabilidad
    history,
    loadingHistory,
    refetchHistory,
    
    // Auth State
    authStep,
    setAuthStep,
    authError,
    logout,
    
    // Auth Actions
    requestOtp: (cedula: string) => requestOtpMutation.mutateAsync(cedula),
    verifyOtp: (cedula: string, code: string) => verifyOtpMutation.mutateAsync({ cedula, code }),
    isRequestingOtp: requestOtpMutation.isPending,
    isVerifyingOtp: verifyOtpMutation.isPending,
    
    // Operative Actions
    uploadEvidence,
    updateTravelState,
    scanPlate,
    scanContainer,
    loadData,
    
    // Loading States operativos
    uploading: uploadEvidenceMutation.isPending,
    processingState: 
      scanPlateMutation.isPending || 
      scanContainerMutation.isPending || 
      updateStateMutation.isPending,
  };
}
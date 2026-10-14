'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverAuthService, driverPortalService } from '@/services/driverPortal.service';
import {
  OperationContainerStatus,
  TripMicroState,
  OcrResult,
} from '@/types/driver-portal.types';
import { showToast } from '@/utils/alerts';
import { useDriverAuthStore } from '@/store/use-auth-driver-store';
import { socket } from '@/lib/socket';
import { authService } from '@/services/auth.services';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';

export function useDriverPortal() {
  const queryClient = useQueryClient();

  const { 
    authStep, 
    setAuthStep, 
    setLoginSuccess, 
    logout: logoutStore,
    driver: storeDriver,
    isAuthenticated: storeIsAuthenticated
  } = useDriverAuthStore();

  const [authError, setAuthError] = useState<string | null>(null);

  const {
    data: queryDriver = null,
    isLoading: loadingProfile,
    isSuccess: isProfileSuccess,
    refetch: loadData,
  } = useQuery({
    queryKey: ['driver-portal-profile'],
    queryFn: () => driverAuthService.getDriverProfile(),
    retry: false,
    staleTime: 1000 * 60 * 2,
  });

  const {
    data: history = [],
    isLoading: loadingHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['driver-trip-history'],
    queryFn: () => driverPortalService.getDriverHistory(),
    enabled: storeIsAuthenticated || (isProfileSuccess && !!queryDriver), 
    staleTime: 1000 * 60 * 5, 
  });

  useEffect(() => {
    if (isProfileSuccess && queryDriver) {
      setLoginSuccess(queryDriver);
    }
  }, [isProfileSuccess, queryDriver, setLoginSuccess]);

  const driver = storeDriver || queryDriver;
  const isAuthenticated = storeIsAuthenticated || (isProfileSuccess && !!queryDriver);

  useEffect(() => {
    const assignedOperationIds = new Set(
      driver?.assignedOperations.map((operation) => operation.id) || [],
    );
    const handleOperationUpdate = (data: { operationId?: number; id?: number }) => {
      const operationId = data.operationId ?? data.id;
      if (operationId && assignedOperationIds.has(operationId)) {
        void queryClient.invalidateQueries({
          queryKey: ['driver-portal-profile'],
        });
      }
    };

    socket.on('global_operations_updated', handleOperationUpdate);
    return () => {
      socket.off('global_operations_updated', handleOperationUpdate);
    };
  }, [driver?.assignedOperations, queryClient]);

  const requestOtpMutation = useMutation({
    mutationFn: (cedula: string) => driverAuthService.requestOtp(cedula),
    onSuccess: () => {
      showToast.success('Código enviado. Revisa tus mensajes.');
      setAuthError(null);
      setAuthStep('OTP');
    },
    onError: (err: unknown) => {
      setAuthError(
        getUserFriendlyErrorMessage(
          err,
          'No pudimos enviar el código. Revisa tu documento e inténtalo de nuevo.',
        ),
      );
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
      setAuthError(
        getUserFriendlyErrorMessage(
          err,
          'El código no es correcto o ya venció. Solicita uno nuevo.',
        ),
      );
    },
  });

  const logout = async () => {
    try {
      await authService.logout();
      queryClient.removeQueries({ queryKey: ['driver-portal-profile'] });
      queryClient.removeQueries({ queryKey: ['driver-trip-history'] });
      logoutStore();
    } catch (err: unknown) {
      showToast.error(err, 'No pudimos cerrar la sesión. Inténtalo de nuevo.');
    }
  };

  const uploadEvidenceMutation = useMutation({
    mutationFn: ({ operationId, file }: { operationId: number; file: File }) =>
      driverPortalService.uploadEvidence(operationId, file),
    onSuccess: () => {
      showToast.success('¡Evidencia subida correctamente!');
      loadData();
      refetchHistory();
    },
    onError: (err: unknown) => {
      showToast.error(err, 'No pudimos subir la imagen. Inténtalo de nuevo.');
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
      showToast.error(err, 'No pudimos actualizar el viaje. Inténtalo de nuevo.');
    },
  });

  const scanPlateMutation = useMutation({
    mutationFn: ({ operationId, file }: { operationId: number; file: File }) =>
      driverPortalService.scanPlate(operationId, file),
    onSuccess: () => {
      loadData();
    },
    onError: (err: unknown) => {
      showToast.error(err, 'No pudimos leer la placa. Inténtalo de nuevo.');
    },
  });

  const scanContainerMutation = useMutation({
    mutationFn: ({ operationId, file }: { operationId: number; file: File }) =>
      driverPortalService.scanContainer(operationId, file),
    onSuccess: () => {
      loadData();
    },
    onError: (err: unknown) => {
      showToast.error(err, 'No pudimos leer el contenedor. Inténtalo de nuevo.');
    },
  });

  const uploadEvidence = async (operationId: number, file: File): Promise<void> => {
    await uploadEvidenceMutation.mutateAsync({ operationId, file });
  };

  const updateTravelState = async (operationId: number, estadoViaje: string): Promise<void> => {
    await updateStateMutation.mutateAsync({ operationId, estadoViaje });
  };

  const updateContainerStatusMutation = useMutation({
    mutationFn: ({
      operationId,
      containerStatus,
      issueDescription,
    }: {
      operationId: number;
      containerStatus: OperationContainerStatus;
      issueDescription?: string;
    }) =>
      driverPortalService.updateContainerStatus(
        operationId,
        containerStatus,
        issueDescription,
      ),
    onSuccess: () => {
      showToast.success('Estado del contenedor actualizado correctamente.');
      loadData();
      refetchHistory();
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'operation-alerts'],
      });
    },
    onError: (err: unknown) => {
      showToast.error(
        err,
        'No pudimos actualizar el estado del contenedor. Inténtalo de nuevo.',
      );
    },
  });

  const updateContainerStatus = async (
    operationId: number,
    containerStatus: OperationContainerStatus,
    issueDescription?: string,
  ): Promise<void> => {
    await updateContainerStatusMutation.mutateAsync({
      operationId,
      containerStatus,
      issueDescription,
    });
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

  return {
    driver,
    loading: loadingProfile,
    isAuthenticated,
    
    history,
    loadingHistory,
    refetchHistory,
    
    authStep,
    setAuthStep,
    authError,
    logout,
    
    requestOtp: (cedula: string) => requestOtpMutation.mutateAsync(cedula),
    verifyOtp: (cedula: string, code: string) => verifyOtpMutation.mutateAsync({ cedula, code }),
    isRequestingOtp: requestOtpMutation.isPending,
    isVerifyingOtp: verifyOtpMutation.isPending,
    
    uploadEvidence,
    updateTravelState,
    updateContainerStatus,
    scanPlate,
    scanContainer,
    loadData,
    
    uploading: uploadEvidenceMutation.isPending,
    processingState: 
      scanPlateMutation.isPending || 
      scanContainerMutation.isPending || 
      updateStateMutation.isPending ||
      updateContainerStatusMutation.isPending,
  };
}
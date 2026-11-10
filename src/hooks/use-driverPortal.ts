"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  driverAuthService,
  driverPortalService,
} from "@/services/driverPortal.service";
import {
  OperationContainerStatus,
  CargoStatus,
  TripMicroState,
  OcrResult,
  FleetPlateVerificationResult,
} from "@/types/driver-portal.types";
import { showToast } from "@/utils/alerts";
import { useDriverAuthStore } from "@/store/use-auth-driver-store";
import { socket } from "@/lib/socket";
import { authService } from "@/services/auth.services";
import { getUserFriendlyErrorMessage } from "@/utils/api-error";

export function useDriverPortal() {
  const queryClient = useQueryClient();

  const {
    authStep,
    setAuthStep,
    setLoginSuccess,
    logout: logoutStore,
    driver: storeDriver,
    isAuthenticated: storeIsAuthenticated,
  } = useDriverAuthStore();

  const [authError, setAuthError] = useState<string | null>(null);

  const {
    data: queryDriver = null,
    isLoading: loadingProfile,
    isSuccess: isProfileSuccess,
    refetch: loadData,
  } = useQuery({
    queryKey: ["driver-portal-profile"],
    queryFn: () => driverAuthService.getDriverProfile(),
    retry: false,
    staleTime: 1000 * 60 * 2,
  });

  const {
    data: history = [],
    isLoading: loadingHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["driver-trip-history"],
    queryFn: () => driverPortalService.getDriverHistory(),
    enabled: storeIsAuthenticated || (isProfileSuccess && !!queryDriver),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (isProfileSuccess && queryDriver) {
      setLoginSuccess(queryDriver);
    }
  }, [isProfileSuccess, queryDriver, setLoginSuccess]);

  const driver = queryDriver ?? storeDriver;
  const isAuthenticated =
    storeIsAuthenticated || (isProfileSuccess && !!queryDriver);

  useEffect(() => {
    const operationIds =
      driver?.assignedOperations.map((operation) => operation.id) ?? [];
    const assignedOperationIds = new Set(operationIds);
    const handleOperationUpdate = (data: {
      operationId?: number;
      id?: number;
      driverId?: number | null;
    }) => {
      const operationId = data.operationId ?? data.id;
      if (
        operationId &&
        (assignedOperationIds.has(operationId) ||
          (driver?.id !== undefined && data.driverId === driver.id))
      ) {
        void queryClient.invalidateQueries({
          queryKey: ["driver-portal-profile"],
        });
      }
    };
    const joinOperationRooms = () => {
      operationIds.forEach((operationId) => {
        socket.emit("join_operation_room", { operationId });
      });
    };
    const handleOcrManualResolution = (data: {
      operationId?: number;
      status?: "APPROVED" | "REJECTED";
    }) => {
      if (
        !data.operationId ||
        !assignedOperationIds.has(data.operationId) ||
        (data.status !== "APPROVED" && data.status !== "REJECTED")
      ) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: ["driver-portal-profile"],
      });
      if (data.status === "APPROVED") {
        showToast.success("El analista aprobó la evidencia OCR.");
      } else {
        showToast.warning(
          "El analista devolvió la evidencia OCR. Toma una nueva foto para continuar.",
        );
      }
    };

    socket.on("global_operations_updated", handleOperationUpdate);
    socket.on("connect", joinOperationRooms);
    socket.on("ocr-manual-resolution", handleOcrManualResolution);
    if (socket.connected) joinOperationRooms();
    return () => {
      socket.off("global_operations_updated", handleOperationUpdate);
      socket.off("connect", joinOperationRooms);
      socket.off("ocr-manual-resolution", handleOcrManualResolution);
      if (socket.connected) {
        operationIds.forEach((operationId) => {
          socket.emit("leave_operation_room", { operationId });
        });
      }
    };
  }, [driver?.assignedOperations, driver?.id, queryClient]);

  const requestOtpMutation = useMutation({
    mutationFn: (cedula: string) => driverAuthService.requestOtp(cedula),
    onSuccess: (response) => {
      if (
        process.env.NODE_ENV !== "production" &&
        response.developmentOtp
      ) {
        console.info(`Código OTP de desarrollo: ${response.developmentOtp}`);
      }
      if (response.smsSent) {
        showToast.success("Código enviado. Revisa tus mensajes.");
      } else {
        console.error("Falló el envío del OTP por Twilio.");
        showToast.error("No se pudo enviar el código por SMS.");
      }
      setAuthError(null);
      setAuthStep("OTP");
    },
    onError: (err: unknown) => {
      setAuthError(
        getUserFriendlyErrorMessage(
          err,
          "No pudimos enviar el código. Revisa tu documento e inténtalo de nuevo.",
        ),
      );
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ cedula, code }: { cedula: string; code: string }) =>
      driverAuthService.verifyOtp(cedula, code),
    onSuccess: () => {
      setAuthError(null);
      showToast.success("¡Bienvenido al portal!");
      queryClient.invalidateQueries({ queryKey: ["driver-portal-profile"] });
      queryClient.invalidateQueries({ queryKey: ["driver-trip-history"] });
    },
    onError: (err: unknown) => {
      setAuthError(
        getUserFriendlyErrorMessage(
          err,
          "El código no es correcto o ya venció. Solicita uno nuevo.",
        ),
      );
    },
  });

  const logout = async () => {
    try {
      await authService.logout();
      queryClient.removeQueries({ queryKey: ["driver-portal-profile"] });
      queryClient.removeQueries({ queryKey: ["driver-trip-history"] });
      logoutStore();
    } catch (err: unknown) {
      showToast.error(err, "No pudimos cerrar la sesión. Inténtalo de nuevo.");
    }
  };

  const uploadEvidenceMutation = useMutation({
    mutationFn: ({
      operationId,
      file,
      evidenceType,
    }: {
      operationId: number;
      file: File | File[];
      evidenceType?: string;
    }) => driverPortalService.uploadEvidence(operationId, file, evidenceType),
    onSuccess: async () => {
      showToast.success("¡Evidencia subida correctamente!");
      await Promise.all([loadData(), refetchHistory()]);
    },
    onError: (err: unknown) => {
      showToast.error(err, "No pudimos subir la imagen. Inténtalo de nuevo.");
    },
  });

  const reportDeviationMutation = useMutation({
    mutationFn: ({ operationId, file }: { operationId: number; file: File }) =>
      driverPortalService.reportDeviation(operationId, file),
    onSuccess: async () => {
      showToast.success(
        "Desvío reportado. El analista recibió el comodato y debe confirmar el destino.",
      );
      await Promise.all([
        loadData(),
        refetchHistory(),
        queryClient.invalidateQueries({ queryKey: ["novedades"] }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard", "operation-alerts"],
        }),
      ]);
    },
    onError: (error: unknown) => {
      showToast.error(
        error,
        "No pudimos reportar el desvío. Inténtalo de nuevo.",
      );
    },
  });

  const updateStateMutation = useMutation({
    mutationFn: ({
      operationId,
      estadoViaje,
    }: {
      operationId: number;
      estadoViaje: string;
    }) =>
      driverPortalService.updateTravelState(
        operationId,
        estadoViaje as TripMicroState,
      ),
    onSuccess: async () => {
      showToast.success("Estado del viaje actualizado correctamente.");
      await Promise.all([loadData(), refetchHistory()]);
    },
  });

  const scanPlateMutation = useMutation({
    mutationFn: ({ operationId, file }: { operationId: number; file: File }) =>
      driverPortalService.scanPlate(operationId, file),
    onSuccess: async () => {
      await loadData();
    },
    onError: (err: unknown) => {
      showToast.error(err, "No pudimos leer la placa. Inténtalo de nuevo.");
    },
  });

  const scanContainerMutation = useMutation({
    mutationFn: ({ operationId, file }: { operationId: number; file: File }) =>
      driverPortalService.scanContainer(operationId, file),
    onSuccess: async () => {
      await loadData();
    },
    onError: (err: unknown) => {
      showToast.error(
        err,
        "No pudimos leer el contenedor. Inténtalo de nuevo.",
      );
    },
  });

  const verifyFleetPlatesMutation = useMutation({
    mutationFn: ({
      operationId,
      cabImage,
      trailerImage,
    }: {
      operationId: number;
      cabImage: File;
      trailerImage: File;
    }): Promise<FleetPlateVerificationResult> =>
      driverPortalService.verifyFleetPlates(
        operationId,
        cabImage,
        trailerImage,
      ),
    onSuccess: async () => {
      await Promise.all([
        loadData(),
        queryClient.invalidateQueries({
          queryKey: ["driver-portal-profile"],
        }),
      ]);
    },
  });

  const reportTrailerLocationMutation = useMutation({
    mutationFn: ({
      operationId,
      payload,
    }: {
      operationId: number;
      payload: Parameters<typeof driverPortalService.reportTrailerLocation>[1];
    }) =>
      driverPortalService.reportTrailerLocation(operationId, payload),
    onSuccess: async () => {
      showToast.success('Tráiler desenganchado y ubicación reportada.');
      await Promise.all([
        loadData(),
        queryClient.invalidateQueries({
          queryKey: ['driver-portal-profile'],
        }),
      ]);
    },
    onError: (error: unknown) => {
      showToast.error(error, 'No se pudo reportar el desenganche del tráiler.');
    },
  });

  const uploadEvidence = async (
    operationId: number,
    file: File | File[],
    evidenceType?: string,
  ): Promise<void> => {
    await uploadEvidenceMutation.mutateAsync({ operationId, file, evidenceType });
  };

  const reportDeviation = async (
    operationId: number,
    file: File,
  ): Promise<void> => {
    await reportDeviationMutation.mutateAsync({ operationId, file });
  };

  const updateTravelState = async (
    operationId: number,
    estadoViaje: string,
  ): Promise<void> => {
    try {
      await updateStateMutation.mutateAsync({ operationId, estadoViaje });
    } catch (err: unknown) {
      // Superficie errores HTTP (p. ej. getClosingMissingRequirements → 400)
      showToast.error(
        err,
        "No pudimos actualizar el viaje. Inténtalo de nuevo.",
      );
      throw err;
    }
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
    onSuccess: async () => {
      showToast.success("Estado del contenedor actualizado correctamente.");
      await Promise.all([
        loadData(),
        refetchHistory(),
        queryClient.invalidateQueries({
          queryKey: ["dashboard", "operation-alerts"],
        }),
      ]);
    },
    onError: (err: unknown) => {
      showToast.error(
        err,
        "No pudimos actualizar el estado del contenedor. Inténtalo de nuevo.",
      );
    },
  });

  const updateSealNumberMutation = useMutation({
    mutationFn: ({
      operationId,
      sealNumber,
    }: {
      operationId: number;
      sealNumber: string;
    }) => driverPortalService.updateSealNumber(operationId, sealNumber),
    onSuccess: async () => {
      showToast.success("Número de sello/precinto registrado.");
      await loadData();
    },
    onError: (err: unknown) => {
      showToast.error(
        err,
        "No pudimos registrar el número de sello/precinto. Inténtalo de nuevo.",
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

  const updateCargoStatusMutation = useMutation({
    mutationFn: ({
      operationId,
      cargoStatus,
    }: {
      operationId: number;
      cargoStatus: CargoStatus;
    }) => driverPortalService.updateCargoStatus(operationId, cargoStatus),
    onSuccess: async () => {
      showToast.success("Estado de la carga actualizado correctamente.");
      await Promise.all([loadData(), refetchHistory()]);
    },
    onError: (err: unknown) => {
      showToast.error(
        err,
        "No pudimos actualizar el estado de la carga. Inténtalo de nuevo.",
      );
    },
  });

  const updateCargoStatus = async (
    operationId: number,
    cargoStatus: CargoStatus,
  ): Promise<void> => {
    await updateCargoStatusMutation.mutateAsync({ operationId, cargoStatus });
  };

  const completeStopMutation = useMutation({
    mutationFn: ({ operationId, stopId }: { operationId: number; stopId: number }) =>
      driverPortalService.completeStop(operationId, stopId),
    onSuccess: async () => {
      showToast.success("Parada completada.");
      await loadData();
    },
    onError: (error: unknown) => {
      showToast.error(error, "No se pudo completar la parada.");
    },
  });

  const completeStop = async (operationId: number, stopId: number) => {
    await completeStopMutation.mutateAsync({ operationId, stopId });
  };

  const updateSealNumber = async (
    operationId: number,
    sealNumber: string,
  ): Promise<void> => {
    await updateSealNumberMutation.mutateAsync({ operationId, sealNumber });
  };

  const scanPlate = async (
    operationId: number,
    file: File,
  ): Promise<OcrResult | null> => {
    try {
      return await scanPlateMutation.mutateAsync({ operationId, file });
    } catch {
      return null;
    }
  };

  const scanContainer = async (
    operationId: number,
    file: File,
  ): Promise<OcrResult> => {
    return scanContainerMutation.mutateAsync({ operationId, file });
  };

  const verifyFleetPlates = async (
    operationId: number,
    cabImage: File,
    trailerImage: File,
  ): Promise<FleetPlateVerificationResult> =>
    verifyFleetPlatesMutation.mutateAsync({
      operationId,
      cabImage,
      trailerImage,
    });

  const reportTrailerLocation = async (
    operationId: number,
    payload: Parameters<typeof driverPortalService.reportTrailerLocation>[1],
  ): Promise<void> => {
    await reportTrailerLocationMutation.mutateAsync({
      operationId,
      payload,
    });
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
    verifyOtp: (cedula: string, code: string) =>
      verifyOtpMutation.mutateAsync({ cedula, code }),
    isRequestingOtp: requestOtpMutation.isPending,
    isVerifyingOtp: verifyOtpMutation.isPending,

    uploadEvidence,
    reportDeviation,
    updateTravelState,
    updateContainerStatus,
    updateCargoStatus,
    completeStop,
    updateSealNumber,
    scanPlate,
    scanContainer,
    verifyFleetPlates,
    reportTrailerLocation,
    isVerifyingFleetPlates: verifyFleetPlatesMutation.isPending,
    isUncouplingTrailer: reportTrailerLocationMutation.isPending,
    loadData,

    uploading: uploadEvidenceMutation.isPending,
    processingState:
      scanPlateMutation.isPending ||
      scanContainerMutation.isPending ||
      verifyFleetPlatesMutation.isPending ||
      updateStateMutation.isPending ||
      updateContainerStatusMutation.isPending ||
      updateCargoStatusMutation.isPending ||
      completeStopMutation.isPending ||
      updateSealNumberMutation.isPending ||
      reportDeviationMutation.isPending ||
      reportTrailerLocationMutation.isPending,
  };
}

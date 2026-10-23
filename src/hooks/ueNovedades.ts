"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { novedadesService } from "@/services/novedades.servies";
import { showToast } from "@/utils/alerts";
import { AxiosError } from "axios";
import { getUserFriendlyErrorMessage } from "@/utils/api-error";
import { socket } from "@/lib/socket";
import { useEffect } from "react";

interface BackendErrorResponse {
  message?: string;
}

export function useNovedades(initialTab = "PENDING", initialTarget = "TODAS") {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeTarget, setActiveTarget] = useState(initialTarget);

  useEffect(() => {
    const refreshNovedades = () => {
      void queryClient.invalidateQueries({ queryKey: ["novedades"] });
    };
    socket.on("operation_alerts_updated", refreshNovedades);
    return () => {
      socket.off("operation_alerts_updated", refreshNovedades);
    };
  }, [queryClient]);

  const {
    data: novedades = [],
    isLoading,
    error: queryError,
    refetch: refresh,
  } = useQuery({
    queryKey: ["novedades", activeTab, activeTarget],
    queryFn: () => novedadesService.getAll(activeTab, activeTarget),
    staleTime: 1000 * 60 * 3,
  });

  const error = queryError
    ? getUserFriendlyErrorMessage(
        queryError,
        "No se pudieron cargar las novedades. Inténtalo de nuevo.",
      )
    : null;

  const resolveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      novedadesService.resolve(id, notes),
    onSuccess: () => {
      showToast.success("Novedad resuelta exitosamente.");
      queryClient.invalidateQueries({ queryKey: ["novedades"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "operation-alerts"],
      });
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      const message =
        axiosError.response?.data?.message || "Error al resolver la novedad";
      showToast.error(message);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: novedadesService.markInReview,
    onSuccess: () => {
      showToast.success("Novedad tomada para revisión.");
      queryClient.invalidateQueries({ queryKey: ["novedades"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "operation-alerts"],
      });
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<BackendErrorResponse>;
      showToast.error(
        axiosError.response?.data?.message || "Error al iniciar la revisión.",
      );
    },
  });

  const resolve = useCallback(
    async (id: number, notes: string): Promise<boolean> => {
      try {
        await resolveMutation.mutateAsync({ id, notes });
        return true;
      } catch {
        return false;
      }
    },
    [resolveMutation],
  );

  const markInReview = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        await reviewMutation.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
    [reviewMutation],
  );

  return {
    novedades,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    activeTarget,
    setActiveTarget,
    refresh,
    resolve,
    markInReview,
  };
}

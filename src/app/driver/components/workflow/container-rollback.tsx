"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { driverPortalService } from "@/services/driverPortal.service";
import type { ContainerRollbackReason } from "@/services/driverPortal.service";
import type { DriverPortalData } from "@/types/driver-portal.types";
import styles from "./operation-workflow.module.css";

export function ContainerRollback({
  operationId,
  enabled,
  disabled,
  onCapture,
}: {
  operationId: number;
  enabled: boolean;
  disabled: boolean;
  onCapture: () => void;
}) {
  const queryClient = useQueryClient();
  const profileKey = ["driver-portal-profile"];
  const candidateKey = ["container-rollback", operationId];
  const { data: candidate } = useQuery({
    queryKey: candidateKey,
    queryFn: () => driverPortalService.getContainerRollbackCandidate(operationId),
    enabled,
    staleTime: 0,
  });

  const mutation = useMutation({
    mutationKey: ["container-rollback-mutation", operationId],
    mutationFn: ({ historyId, reason }: { historyId: number; reason: ContainerRollbackReason }) =>
      driverPortalService.rollbackContainer(operationId, historyId, reason),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: profileKey });
      const previous = queryClient.getQueryData<DriverPortalData | null>(profileKey);
      if (candidate) {
        queryClient.setQueryData<DriverPortalData | null>(profileKey, (current) =>
          current ? {
            ...current,
            assignedOperations: current.assignedOperations.map((operation) =>
              operation.id === operationId ? {
                ...operation,
                estadoViaje: candidate.previousState,
                evidences: operation.evidences?.filter((evidence) => evidence.id !== candidate.evidenceId),
              } : operation,
            ),
          } : current,
        );
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      const previousOperation = context?.previous?.assignedOperations.find(
        (operation) => operation.id === operationId,
      );
      if (previousOperation && candidate) {
        queryClient.setQueryData<DriverPortalData | null>(profileKey, (current) =>
          current ? {
            ...current,
            assignedOperations: current.assignedOperations.map((operation) =>
              operation.id === operationId && operation.estadoViaje === candidate.previousState
                ? previousOperation
                : operation,
            ),
          } : current,
        );
      }
    },
    onSuccess: () => onCapture(),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKey }),
        queryClient.invalidateQueries({ queryKey: candidateKey }),
      ]);
    },
  });

  if (!enabled || !candidate) return null;

  const confirm = async () => {
    const result = await Swal.fire<ContainerRollbackReason>({
      title: "¿Por qué necesitas corregir el contenedor?",
      input: "select",
      inputOptions: {
        FOTO_BORROSA: "Foto borrosa",
        CONTENEDOR_INCORRECTO: "Contenedor incorrecto",
        MARQUE_SIN_QUERER: "Marqué sin querer",
        OTRO: "Otro",
      },
      inputValue: "FOTO_BORROSA",
      showCancelButton: true,
      confirmButtonText: "Corregir y tomar foto",
      cancelButtonText: "Cancelar",
    });
    if (result.isConfirmed && result.value) {
      mutation.mutate({ historyId: candidate.historyId, reason: result.value });
    }
  };

  return (
    <button
      type="button"
      className={styles.rollbackButton}
      disabled={disabled || mutation.isPending}
      onClick={() => void confirm()}
    >
      ⚠️ Me equivoqué / Tomar foto de nuevo
    </button>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { driverPortalService } from "@/services/driverPortal.service";
import type { ContainerRollbackReason } from "@/services/driverPortal.service";
import type { DriverPortalData, OperationContainerStatus } from "@/types/driver-portal.types";
import styles from "./operation-workflow.module.css";

export function ContainerStateRollback({ operationId, status, disabled }: {
  operationId: number;
  status: OperationContainerStatus;
  disabled: boolean;
}) {
  const queryClient = useQueryClient();
  const profileKey = ["driver-portal-profile"];
  const candidateKey = ["container-state-rollback", operationId, status];
  const { data: candidate, isLoading } = useQuery({
    queryKey: candidateKey,
    queryFn: () => driverPortalService.getContainerStateRollback(operationId),
    staleTime: 0,
  });
  const mutation = useMutation({
    mutationKey: ["container-rollback-mutation", operationId],
    mutationFn: ({ historyId, reason }: { historyId: number; reason: ContainerRollbackReason }) =>
      driverPortalService.rollbackContainerState(operationId, historyId, reason),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: profileKey });
      const previous = queryClient.getQueryData<DriverPortalData | null>(profileKey);
      if (candidate) {
        queryClient.setQueryData<DriverPortalData | null>(profileKey, (current) => current && {
          ...current,
          assignedOperations: current.assignedOperations.map((operation) =>
            operation.id === operationId ? { ...operation, containerStatus: candidate.previousStatus } : operation,
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      const previousOperation = context?.previous?.assignedOperations.find((operation) => operation.id === operationId);
      if (previousOperation && candidate) {
        queryClient.setQueryData<DriverPortalData | null>(profileKey, (current) => current && {
          ...current,
          assignedOperations: current.assignedOperations.map((operation) =>
            operation.id === operationId && operation.containerStatus === candidate.previousStatus ? previousOperation : operation,
          ),
        });
      }
    },
    onSuccess: () => Swal.fire({ icon: "success", title: "Estado corregido", timer: 1800, showConfirmButton: false }),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKey }),
        queryClient.invalidateQueries({ queryKey: ["container-state-rollback", operationId] }),
      ]);
    },
  });

  const confirm = async () => {
    if (!candidate) {
      await Swal.fire({
        icon: "info",
        title: "Necesitas ayuda del analista",
        text: "No hay una corrección automática segura para este paso. El analista puede revisar y corregir el estado desde el detalle de la operación.",
      });
      return;
    }
    const result = await Swal.fire<ContainerRollbackReason>({
      title: `¿Volver a ${candidate.previousStatus.replace(/_/g, " ")}?`,
      text: "Se registrará la corrección para la Torre de Control.",
      input: "select",
      inputOptions: {
        MARQUE_SIN_QUERER: "Marqué sin querer",
        CONTENEDOR_INCORRECTO: "Contenedor incorrecto",
        OTRO: "Otro",
      },
      inputValue: "MARQUE_SIN_QUERER",
      showCancelButton: true,
      confirmButtonText: "Corregir estado",
      cancelButtonText: "Cancelar",
    });
    if (result.isConfirmed && result.value) mutation.mutate({ historyId: candidate.historyId, reason: result.value });
  };

  return (
    <>
      <button type="button" className={styles.rollbackButton}
        disabled={disabled || mutation.isPending || isLoading}
        onClick={() => void confirm()}>
        ⚠️ Me equivoqué / Corregir estado del contenedor
      </button>
      {!isLoading && !candidate && (
        <p className={styles.containerHint}>
          Si necesitas corregir un estado anterior o sin historial, contacta al analista.
        </p>
      )}
    </>
  );
}

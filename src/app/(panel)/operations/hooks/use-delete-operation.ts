"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { operationService } from "@/services/operation.service";
import { showToast } from "@/utils/alerts";

export function useDeleteOperation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (operationId: number) =>
      operationService.deleteOperation(operationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trafico"] }),
        queryClient.invalidateQueries({ queryKey: ["operations"] }),
        queryClient.invalidateQueries({ queryKey: ["operation-history"] }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard", "operation-alerts"],
        }),
      ]);
      showToast.success("Operación eliminada correctamente.");
    },
    onError: (error: unknown) => {
      showToast.error(error, "No se pudo eliminar la operación.");
    },
  });

  const deleteOperation = async (operationId: number): Promise<boolean> => {
    try {
      await mutation.mutateAsync(operationId);
      return true;
    } catch {
      return false;
    }
  };

  return { deleteOperation, isDeletingOperation: mutation.isPending };
}

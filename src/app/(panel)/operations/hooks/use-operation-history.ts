"use client";

import { useQuery } from "@tanstack/react-query";
import { operationService } from "@/services/operation.service";
import { useOperationHistoryStore } from "@/store/use-operation-history.store";
import { getUserFriendlyErrorMessage } from "@/utils/api-error";

export function useOperationHistory() {
  const filters = useOperationHistoryStore((state) => state.filters);
  const applyFilters = useOperationHistoryStore((state) => state.applyFilters);
  const setPage = useOperationHistoryStore((state) => state.setPage);
  const clearFilters = useOperationHistoryStore((state) => state.clearFilters);

  const historyQuery = useQuery({
    queryKey: ["operation-history", filters],
    queryFn: () => operationService.getHistoricalOperations(filters),
  });

  return {
    filters,
    operations: historyQuery.data?.data ?? [],
    meta: historyQuery.data?.meta ?? {
      totalItems: 0,
      total: 1,
      page: filters.page ?? 1,
      lastPage: 1,
    },
    isLoading: historyQuery.isLoading,
    error: historyQuery.error
      ? getUserFriendlyErrorMessage(
          historyQuery.error,
          "No se pudo cargar el historial de operaciones.",
        )
      : null,
    applyFilters,
    setPage,
    clearFilters,
  };
}

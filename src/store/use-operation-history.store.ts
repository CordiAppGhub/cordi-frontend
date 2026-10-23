import { create } from "zustand";
import type { GetHistoricalOperationsParams } from "@/services/operation.service";

type OperationsSection = "active" | "history";

interface OperationHistoryState {
  section: OperationsSection;
  filters: GetHistoricalOperationsParams;
  setSection: (section: OperationsSection) => void;
  applyFilters: (filters: GetHistoricalOperationsParams) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
}

const DEFAULT_HISTORY_FILTERS: GetHistoricalOperationsParams = {
  page: 1,
  limit: 20,
};

export const useOperationHistoryStore = create<OperationHistoryState>(
  (set) => ({
    section: "active",
    filters: DEFAULT_HISTORY_FILTERS,
    setSection: (section) => set({ section }),
    applyFilters: (filters) =>
      set({ filters: { ...DEFAULT_HISTORY_FILTERS, ...filters, page: 1 } }),
    setPage: (page) =>
      set((state) => ({ filters: { ...state.filters, page } })),
    clearFilters: () => set({ filters: DEFAULT_HISTORY_FILTERS }),
  }),
);

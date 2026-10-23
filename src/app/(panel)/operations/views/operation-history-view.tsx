"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Eye, Loader, Search, X } from "lucide-react";
import PaginationTable from "@/components/organisms/pagination-table/pagination-table";
import type { ColumnDef } from "@/types/table";
import type { Operation } from "@/types/operation-types";
import type { GetHistoricalOperationsParams } from "@/services/operation.service";
import { useOperationHistory } from "../hooks/useOperationHistory";
import { HistorySearchSelect } from "./history-search-select";
import styles from "./operation-history.module.css";

interface OperationHistoryViewProps {
  onOpenOperation: (operationId: number) => void;
}

type DraftFilters = Omit<GetHistoricalOperationsParams, "page" | "limit">;

const INITIAL_DRAFT_FILTERS: DraftFilters = {
  startDate: "",
  endDate: "",
  manifiesto: "",
  containerNumber: "",
  clientId: undefined,
  analystId: undefined,
  driverId: undefined,
};

function displayName(name?: string | null): string {
  return name?.trim() || "—";
}

function displayDate(date?: string | Date | null): string {
  if (!date) return "—";
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? "—"
    : parsedDate.toLocaleDateString("es-CO", { timeZone: "America/Bogota" });
}

function getHistoryColumns(
  onOpenOperation: (operationId: number) => void,
): ColumnDef<Operation>[] {
  return [
    {
      id: "numeroPedido",
      header: "Manifiesto / Pedido",
      type: "text",
      renderCell: (operation) => (
        <div className={styles.primaryCell}>
          <strong>
            {operation.documentoTransporte || operation.numeroPedido || "—"}
          </strong>
          <span>Operación #{operation.id}</span>
        </div>
      ),
    },
    {
      id: "containerNumber",
      header: "Contenedor",
      type: "text",
      renderCell: (operation) => operation.containerNumber || "—",
    },
    {
      id: "type",
      header: "Tipo / Estado",
      type: "text",
      renderCell: (operation) => (
        <div className={styles.primaryCell}>
          <strong>{operation.type}</strong>
          <span
            className={
              operation.status === "FINALIZADO"
                ? styles.completedBadge
                : styles.cancelledBadge
            }
          >
            {operation.status}
          </span>
        </div>
      ),
    },
    {
      id: "scheduledAt",
      header: "Fecha",
      type: "date",
      renderCell: (operation) =>
        displayDate(operation.scheduledAt || operation.createdAt),
    },
    {
      id: "analyst",
      header: "Analista",
      type: "text",
      renderCell: (operation) => displayName(operation.analyst?.name),
    },
    {
      id: "driver",
      header: "Conductor",
      type: "text",
      renderCell: (operation) => displayName(operation.driver?.name),
    },
    {
      id: "route",
      header: "Ruta",
      type: "text",
      renderCell: (operation) =>
        `${operation.origen?.name || "—"} → ${operation.destino?.name || "—"}`,
    },
    {
      id: "details",
      header: "Detalle",
      type: "text",
      renderCell: (operation) => (
        <button
          type="button"
          className={styles.detailsButton}
          onClick={() => onOpenOperation(operation.id)}
          aria-label={`Ver detalle de la operación ${operation.id}`}
        >
          <Eye size={16} />
          Ver detalle
        </button>
      ),
    },
  ];
}

export function OperationHistoryView({
  onOpenOperation,
}: OperationHistoryViewProps) {
  const {
    operations,
    meta,
    isLoading,
    error,
    applyFilters,
    setPage,
    clearFilters,
  } = useOperationHistory();
  const [draftFilters, setDraftFilters] =
    useState<DraftFilters>(INITIAL_DRAFT_FILTERS);
  const [selectResetVersion, setSelectResetVersion] = useState(0);

  const updateDraft = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setDraftFilters((current) => ({ ...current, [name]: value }));
  };

  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nonEmptyFilters = Object.fromEntries(
      Object.entries(draftFilters).filter(
        ([, value]) => value !== "" && value !== undefined,
      ),
    ) as DraftFilters;
    applyFilters(nonEmptyFilters);
  };

  const resetFilters = () => {
    setDraftFilters(INITIAL_DRAFT_FILTERS);
    setSelectResetVersion((version) => version + 1);
    clearFilters();
  };

  return (
    <section className={styles.history}>
      <header className={styles.header}>
        <div>
          <h2>Historial de operaciones</h2>
          <p>
            Consulta viajes finalizados o cancelados y abre su trazabilidad
            completa.
          </p>
        </div>
        <span className={styles.resultCount}>
          {meta.totalItems} operaciones
        </span>
      </header>

      <form className={styles.filters} onSubmit={submitFilters}>
        <div className={styles.filterField}>
          <span>Manifiesto / pedido</span>
          <HistorySearchSelect
            key={`manifest-${selectResetVersion}`}
            kind="manifest"
            value={draftFilters.manifiesto || ""}
            label="Manifiesto o pedido"
            placeholder="Buscar BL, DO o booking"
            onSelect={(value) => {
              setDraftFilters((current) => ({ ...current, manifiesto: value }));
            }}
          />
        </div>
        <div className={styles.filterField}>
          <span>N.º de contenedor</span>
          <HistorySearchSelect
            key={`container-${selectResetVersion}`}
            kind="container"
            value={draftFilters.containerNumber || ""}
            label="Número de contenedor"
            placeholder="Buscar contenedor"
            onSelect={(value) => {
              setDraftFilters((current) => ({
                ...current,
                containerNumber: value,
              }));
            }}
          />
        </div>
        <div className={styles.filterField}>
          <span>Analista</span>
          <HistorySearchSelect
            key={`analyst-${selectResetVersion}`}
            kind="analyst"
            value={String(draftFilters.analystId || "")}
            label="Analista"
            placeholder="Buscar analista"
            onSelect={(value) => {
              setDraftFilters((current) => ({
                ...current,
                analystId: value ? Number(value) : undefined,
              }));
            }}
          />
        </div>
        <div className={styles.filterField}>
          <span>Conductor</span>
          <HistorySearchSelect
            key={`driver-${selectResetVersion}`}
            kind="driver"
            value={String(draftFilters.driverId || "")}
            label="Conductor"
            placeholder="Buscar conductor"
            onSelect={(value) => {
              setDraftFilters((current) => ({
                ...current,
                driverId: value ? Number(value) : undefined,
              }));
            }}
          />
        </div>
        <div className={styles.filterField}>
          <span>Cliente</span>
          <HistorySearchSelect
            key={`client-${selectResetVersion}`}
            kind="client"
            value={String(draftFilters.clientId || "")}
            label="Cliente"
            placeholder="Buscar cliente"
            onSelect={(value) => {
              setDraftFilters((current) => ({
                ...current,
                clientId: value ? Number(value) : undefined,
              }));
            }}
          />
        </div>
        <label className={styles.filterField}>
          <span>Desde</span>
          <input
            name="startDate"
            type="date"
            value={draftFilters.startDate || ""}
            onChange={updateDraft}
          />
        </label>
        <label className={styles.filterField}>
          <span>Hasta</span>
          <input
            name="endDate"
            type="date"
            value={draftFilters.endDate || ""}
            onChange={updateDraft}
          />
        </label>
        <div className={styles.filterActions}>
          <button type="submit" className={styles.searchButton} disabled={isLoading}>
            <Search size={16} />
            Buscar
          </button>
          <button
            type="button"
            className={styles.clearButton}
            onClick={resetFilters}
            disabled={isLoading}
          >
            <X size={16} />
            Limpiar
          </button>
        </div>
      </form>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.tableCard}>
        {isLoading ? (
          <div className={styles.loading}>
            <Loader size={22} className={styles.spinner} />
            <span>Cargando historial...</span>
          </div>
        ) : (
          <PaginationTable
            data={operations}
            columns={getHistoryColumns(onOpenOperation)}
            totalPages={Math.max(meta.lastPage, 1)}
            currentPage={meta.page}
            onPageChange={setPage}
            hideSearch
          />
        )}
      </div>
    </section>
  );
}

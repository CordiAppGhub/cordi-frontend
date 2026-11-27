"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileCheck2, Search, Truck, X } from "lucide-react";
import { SuperModal } from "@/components/organisms/modal/modal";
import {
  operationService,
  PendingManifestAnalystSummary,
  PendingManifestClientSummary,
  PendingManifestOperation,
  PendingManifestResponse,
  PendingManifestSummary,
} from "@/services/operation.service";
import { useAuthStore } from "@/store/use-auth.store";
import { showToast } from "@/utils/alerts";
import styles from "./pending-manifest.module.css";

type QuickFilter = "READY" | "NO_VEHICLE" | "ALL";
type AnalystFilter = number | null | "ALL";
type ClientFilter = number | null | "ALL";

const pendingManifestQueryKey = ["operations", "pending-manifest"] as const;

const emptySummary: PendingManifestSummary = {
  totalCount: 0,
  readyToManifestCount: 0,
  withoutVehicleCount: 0,
  totalFreightToCharge: 0,
  readyFreightToCharge: 0,
  totalFreightToPay: 0,
  readyFreightToPay: 0,
};

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatScheduledAt(value: string | null): string {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Sin fecha"
    : date.toLocaleString("es-CO", {
        dateStyle: "short",
        timeStyle: "short",
      });
}

function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function aggregateItems(
  items: PendingManifestOperation[],
): Pick<PendingManifestResponse, "summary" | "byAnalyst" | "byClient"> {
  const summary: PendingManifestSummary = {
    ...emptySummary,
    totalCount: items.length,
  };
  const analysts = new Map<number | null, PendingManifestAnalystSummary>();
  const clients = new Map<number | null, PendingManifestClientSummary>();

  for (const item of items) {
    summary.totalFreightToCharge += item.freightToCharge;
    summary.totalFreightToPay += item.freightToPay;
    if (item.readyToManifest) {
      summary.readyToManifestCount += 1;
      summary.readyFreightToCharge += item.freightToCharge;
      summary.readyFreightToPay += item.freightToPay;
    } else {
      summary.withoutVehicleCount += 1;
    }

    const analyst = analysts.get(item.analystId) ?? {
      analystId: item.analystId,
      analystName: item.analystName ?? "Sin analista asignado",
      totalCount: 0,
      readyToManifestCount: 0,
      totalFreightToCharge: 0,
      totalFreightToPay: 0,
    };
    analyst.totalCount += 1;
    if (item.readyToManifest) analyst.readyToManifestCount += 1;
    analyst.totalFreightToCharge += item.freightToCharge;
    analyst.totalFreightToPay += item.freightToPay;
    analysts.set(item.analystId, analyst);

    const client = clients.get(item.clientId) ?? {
      clientId: item.clientId,
      clientName: item.clientName,
      analystId: item.analystId,
      analystName: item.analystName ?? "Sin analista asignado",
      totalCount: 0,
      readyToManifestCount: 0,
      totalFreightToCharge: 0,
      totalFreightToPay: 0,
    };
    client.totalCount += 1;
    if (item.readyToManifest) client.readyToManifestCount += 1;
    client.totalFreightToCharge += item.freightToCharge;
    client.totalFreightToPay += item.freightToPay;
    clients.set(item.clientId, client);
  }

  const byCharge = <T extends { totalFreightToCharge: number }>(
    left: T,
    right: T,
  ) => right.totalFreightToCharge - left.totalFreightToCharge;

  return {
    summary,
    byAnalyst: [...analysts.values()].sort(byCharge),
    byClient: [...clients.values()].sort(byCharge),
  };
}

function exportCsv(
  items: PendingManifestOperation[],
  includeAnalyst: boolean,
): void {
  const headers = [
    "Estado Planilla",
    "Cliente",
    "Pedido / Booking",
    "Contenedor / Carga",
    "Vehículo",
    "Tráiler",
    "Conductor",
    "Cédula",
    "Teléfono",
    "Flete a Cobrar (COP)",
    "Flete a Pagar (COP)",
    "Fecha Programación",
    ...(includeAnalyst ? ["Analista"] : []),
  ];
  const rows = items.map((item) => [
    item.readyToManifest ? "Lista para planillar" : "Falta flota",
    item.clientName,
    item.numeroPedido,
    item.isContainerized
      ? item.containerNumber ?? "Contenedor pendiente"
      : item.cargoDescription ?? "Carga suelta",
    item.vehicle?.plate ?? null,
    item.vehicle?.trailerPlate ?? null,
    item.driver?.name ?? null,
    item.driver?.cedula ?? null,
    item.driver?.telefono ?? null,
    item.freightToCharge,
    item.freightToPay,
    formatScheduledAt(item.scheduledAt),
    ...(includeAnalyst ? [item.analystName] : []),
  ]);
  const totals = [
    "",
    "",
    `TOTALES (${items.length} operaciones)`,
    "",
    "",
    "",
    "",
    "",
    "",
    items.reduce((sum, item) => sum + item.freightToCharge, 0),
    items.reduce((sum, item) => sum + item.freightToPay, 0),
    "",
    ...(includeAnalyst ? [""] : []),
  ];
  const csv = [headers, ...rows, totals]
    .map((row) => row.map(csvCell).join(";"))
    .join("\r\n");
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "operaciones-sin-manifiesto.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function PendingManifestView() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isManager = user?.role === "ADMIN" || user?.role === "JEFE_DE_FLOTA";
  const [query, setQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter | null>(null);
  const [analystFilter, setAnalystFilter] = useState<AnalystFilter>("ALL");
  const [clientFilter, setClientFilter] = useState<ClientFilter>("ALL");
  const [selectedOperation, setSelectedOperation] =
    useState<PendingManifestOperation | null>(null);
  const [manifestNumber, setManifestNumber] = useState("");
  const [manifestFile, setManifestFile] = useState<File | null>(null);

  const operationsQuery = useQuery({
    queryKey: pendingManifestQueryKey,
    queryFn: () => operationService.getPendingManifestOperations(),
    refetchInterval: 45_000,
  });
  const response = operationsQuery.data;
  const items = response?.items ?? [];
  const analystOptions = response?.byAnalyst ?? [];
  const analystScopedItems = useMemo(
    () =>
      items.filter(
        (item) =>
          analystFilter === "ALL" || item.analystId === analystFilter,
      ),
    [analystFilter, items],
  );
  const analystSummary = useMemo(
    () =>
      analystScopedItems.length > 0
        ? aggregateItems(analystScopedItems).summary
        : emptySummary,
    [analystScopedItems],
  );
  const clientOptions = useMemo(
    () =>
      (response?.byClient ?? []).filter(
        (client) =>
          analystFilter === "ALL" || client.analystId === analystFilter,
      ),
    [analystFilter, response?.byClient],
  );
  const scopedItems = useMemo(
    () =>
      items.filter(
        (item) =>
          (analystFilter === "ALL" || item.analystId === analystFilter) &&
          (clientFilter === "ALL" || item.clientId === clientFilter),
      ),
    [analystFilter, clientFilter, items],
  );
  const scopedSummary = useMemo(
    () => (scopedItems.length > 0 ? aggregateItems(scopedItems).summary : emptySummary),
    [scopedItems],
  );
  const activeQuickFilter =
    quickFilter ??
    (scopedSummary.readyToManifestCount > 0 ? "READY" : "ALL");
  const filteredItems = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("es");
    return scopedItems.filter((item) => {
      if (activeQuickFilter === "READY" && !item.readyToManifest) return false;
      if (activeQuickFilter === "NO_VEHICLE" && item.readyToManifest) return false;
      if (!search) return true;
      const searchable = [
        item.numeroPedido,
        item.containerNumber,
        item.cargoDescription,
        item.vehicle?.plate,
        item.vehicle?.trailerPlate,
        item.driver?.name,
        item.driver?.cedula,
        item.driver?.telefono,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLocaleLowerCase("es");
      return searchable.includes(search);
    });
  }, [activeQuickFilter, query, scopedItems]);
  const filteredTotals = useMemo(
    () => ({
      charge: filteredItems.reduce(
        (sum, item) => sum + item.freightToCharge,
        0,
      ),
      pay: filteredItems.reduce((sum, item) => sum + item.freightToPay, 0),
    }),
    [filteredItems],
  );
  const hasActiveFilters =
    query.trim().length > 0 ||
    analystFilter !== "ALL" ||
    clientFilter !== "ALL" ||
    activeQuickFilter !== "ALL";

  function clearFilters(): void {
    setQuery("");
    setAnalystFilter("ALL");
    setClientFilter("ALL");
    setQuickFilter("ALL");
  }

  const saveManifest = useMutation({
    mutationFn: ({
      operationId,
      number,
      file,
    }: {
      operationId: number;
      number: string;
      file: File | null;
    }) => operationService.registerManifest(operationId, number, file),
  });

  function openPlanilla(operation: PendingManifestOperation): void {
    setManifestNumber("");
    setManifestFile(null);
    setSelectedOperation(operation);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedOperation) return;
    const normalizedNumber = manifestNumber.trim();
    if (!normalizedNumber) {
      showToast.warning("Ingresa el número de manifiesto.");
      return;
    }
    if (manifestFile && manifestFile.type !== "application/pdf") {
      showToast.warning("El soporte debe ser un archivo PDF.");
      return;
    }
    if (manifestFile && manifestFile.size > 10 * 1024 * 1024) {
      showToast.warning("El PDF no puede superar los 10 MB.");
      return;
    }

    try {
      await saveManifest.mutateAsync({
        operationId: selectedOperation.id,
        number: normalizedNumber,
        file: manifestFile,
      });
      queryClient.setQueryData<PendingManifestResponse>(
        pendingManifestQueryKey,
        (current) => {
          if (!current) return current;
          const nextItems = current.items.filter(
            (item) => item.id !== selectedOperation.id,
          );
          return {
            ...aggregateItems(nextItems),
            items: nextItems,
          };
        },
      );
      await queryClient.invalidateQueries({
        queryKey: pendingManifestQueryKey,
      });
      setSelectedOperation(null);
      showToast.success("Manifiesto registrado correctamente.");
    } catch (error: unknown) {
      showToast.error(error, "No se pudo registrar el manifiesto.");
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <FileCheck2 size={20} />
          <h1>Operaciones sin Manifiesto</h1>
          <span>
            {scopedSummary.totalCount} ops ·{" "}
            {scopedSummary.readyToManifestCount} listas
          </span>
        </div>
        <button
          type="button"
          className={styles.exportButton}
          onClick={() => exportCsv(filteredItems, isManager)}
          disabled={filteredItems.length === 0}
        >
          <Download size={16} />
          Exportar Excel / CSV
        </button>
      </header>

      {operationsQuery.isLoading ? (
        <p className={styles.feedback} role="status">
          Cargando operaciones pendientes...
        </p>
      ) : operationsQuery.error ? (
        <div className={styles.error} role="alert">
          <span>
            {operationsQuery.error instanceof Error
              ? operationsQuery.error.message
              : "No se pudieron consultar las operaciones pendientes."}
          </span>
          <button type="button" onClick={() => void operationsQuery.refetch()}>
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <section className={styles.kpiGrid} aria-label="Resumen financiero">
            <article className={styles.kpiCard}>
              <span>Total Flete a Cobrar sin Planillar</span>
              <strong>{formatCurrency(scopedSummary.totalFreightToCharge)}</strong>
              <small>
                Listo con vehículo: {formatCurrency(scopedSummary.readyFreightToCharge)}{" "}
                | Sin flota:{" "}
                {formatCurrency(
                  scopedSummary.totalFreightToCharge -
                    scopedSummary.readyFreightToCharge,
                )}
              </small>
            </article>
            <article className={styles.kpiCard}>
              <span>Total Flete a Pagar sin Planillar</span>
              <strong>{formatCurrency(scopedSummary.totalFreightToPay)}</strong>
              <small>
                Listo con vehículo: {formatCurrency(scopedSummary.readyFreightToPay)}{" "}
                | Sin flota:{" "}
                {formatCurrency(
                  scopedSummary.totalFreightToPay -
                    scopedSummary.readyFreightToPay,
                )}
              </small>
            </article>
            <article className={styles.kpiCard}>
              <span>Total Operaciones sin Manifiesto</span>
              <strong>{scopedSummary.totalCount}</strong>
              <small>
                Listas para planillar: {scopedSummary.readyToManifestCount} |
                Falta flota: {scopedSummary.withoutVehicleCount}
              </small>
            </article>
          </section>

          <section className={styles.toolbar} aria-label="Filtros de operaciones">
            {isManager ? (
              <label className={styles.selectControl}>
                <span>Analista</span>
                <select
                  value={
                    analystFilter === "ALL"
                      ? "ALL"
                      : analystFilter === null
                        ? "NONE"
                        : String(analystFilter)
                  }
                  onChange={(event) => {
                    const value = event.target.value;
                    setAnalystFilter(
                      value === "ALL"
                        ? "ALL"
                        : value === "NONE"
                          ? null
                          : Number(value),
                    );
                    setClientFilter("ALL");
                  }}
                  aria-label="Filtrar por analista"
                >
                  <option value="ALL">
                    Todos los analistas ({response?.summary.totalCount ?? 0} ops ·
                    Cobrar:{" "}
                    {formatCurrency(
                      response?.summary.totalFreightToCharge ?? 0,
                    )}
                    )
                  </option>
                  {analystOptions.map((analyst) => (
                    <option
                      key={analyst.analystId ?? "unassigned"}
                      value={
                        analyst.analystId === null
                          ? "NONE"
                          : String(analyst.analystId)
                      }
                    >
                      {analyst.analystName} ({analyst.totalCount} ops · Cobrar:{" "}
                      {formatCurrency(analyst.totalFreightToCharge)} · Pagar:{" "}
                      {formatCurrency(analyst.totalFreightToPay)})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span className={styles.analystSummary}>
                Mis clientes: {analystSummary.totalCount} ops · Cobrar:{" "}
                {formatCurrency(analystSummary.totalFreightToCharge)} · Pagar:{" "}
                {formatCurrency(analystSummary.totalFreightToPay)}
              </span>
            )}

            <label className={styles.selectControl}>
              <span>Cliente</span>
              <select
                value={
                  clientFilter === "ALL"
                    ? "ALL"
                    : clientFilter === null
                      ? "NONE"
                      : String(clientFilter)
                }
                onChange={(event) => {
                  const value = event.target.value;
                  setClientFilter(
                    value === "ALL"
                      ? "ALL"
                      : value === "NONE"
                        ? null
                        : Number(value),
                  );
                }}
                aria-label="Filtrar por cliente"
              >
                <option value="ALL">
                  Todos los clientes ({clientOptions.length})
                </option>
                {clientOptions.map((client) => (
                  <option
                    key={client.clientId ?? "unassigned"}
                    value={
                      client.clientId === null
                        ? "NONE"
                        : String(client.clientId)
                    }
                  >
                    {client.clientName} ({client.totalCount} ops · Cobrar:{" "}
                    {formatCurrency(client.totalFreightToCharge)} · Pagar:{" "}
                    {formatCurrency(client.totalFreightToPay)})
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.quickFilters} aria-label="Filtrar estado">
              <button
                type="button"
                className={
                  activeQuickFilter === "READY" ? styles.filterActive : ""
                }
                onClick={() => setQuickFilter("READY")}
              >
                Listas ({scopedSummary.readyToManifestCount})
              </button>
              <button
                type="button"
                className={
                  activeQuickFilter === "NO_VEHICLE" ? styles.filterActive : ""
                }
                onClick={() => setQuickFilter("NO_VEHICLE")}
              >
                Sin flota ({scopedSummary.withoutVehicleCount})
              </button>
              <button
                type="button"
                className={activeQuickFilter === "ALL" ? styles.filterActive : ""}
                onClick={() => setQuickFilter("ALL")}
              >
                Todas ({scopedSummary.totalCount})
              </button>
            </div>

            <label className={styles.searchBox}>
              <Search size={16} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar pedido, contenedor, placa o conductor..."
                aria-label="Buscar operaciones sin manifiesto"
              />
            </label>
            {hasActiveFilters && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={clearFilters}
              >
                Limpiar
              </button>
            )}
          </section>

          <section className={styles.tablePanel}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Estado Planilla</th>
                    <th>Cliente</th>
                    <th>Pedido / Booking</th>
                    <th>Contenedor / Carga</th>
                    <th>Vehículo / Tráiler</th>
                    <th>Conductor (Cédula / Tel.)</th>
                    <th>Flete a Cobrar</th>
                    <th>Flete a Pagar</th>
                    <th>Fecha Programación</th>
                    {isManager && <th>Analista</th>}
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span
                          className={
                            item.readyToManifest
                              ? styles.readyBadge
                              : styles.missingBadge
                          }
                        >
                          {item.readyToManifest
                            ? "Lista para planillar"
                            : "Falta flota"}
                        </span>
                      </td>
                      <td>{item.clientName}</td>
                      <td>
                        <strong>{item.numeroPedido || "Sin pedido"}</strong>
                        <small>{item.type}</small>
                      </td>
                      <td>
                        {item.isContainerized ? (
                          <strong>
                            {item.containerNumber ?? "Contenedor pendiente"}
                          </strong>
                        ) : (
                          <>
                            <strong>Carga suelta</strong>
                            <small>{item.cargoDescription || "Sin detalle"}</small>
                          </>
                        )}
                      </td>
                      <td>
                        {item.vehicle?.plate ?? "Sin vehículo"}
                        {item.vehicle?.trailerPlate && (
                          <small>{item.vehicle.trailerPlate}</small>
                        )}
                      </td>
                      <td>
                        {item.driver?.name ?? "Sin conductor"}
                        {item.driver?.cedula && (
                          <small>C.C. {item.driver.cedula}</small>
                        )}
                        {item.driver?.telefono && (
                          <small>{item.driver.telefono}</small>
                        )}
                      </td>
                      <td className={styles.moneyCell}>
                        {formatCurrency(item.freightToCharge)}
                      </td>
                      <td className={styles.moneyCell}>
                        {formatCurrency(item.freightToPay)}
                      </td>
                      <td>{formatScheduledAt(item.scheduledAt)}</td>
                      {isManager && <td>{item.analystName ?? "—"}</td>}
                      <td>
                        <button
                          type="button"
                          className={styles.planButton}
                          onClick={() => openPlanilla(item)}
                        >
                          <Truck size={14} />
                          Planillar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={isManager ? 11 : 10}
                        className={styles.emptyState}
                      >
                        No hay operaciones para los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6}>
                      Totales filtrados: {filteredItems.length} operaciones
                    </td>
                    <td className={styles.moneyCell}>
                      {formatCurrency(filteredTotals.charge)}
                    </td>
                    <td className={styles.moneyCell}>
                      {formatCurrency(filteredTotals.pay)}
                    </td>
                    <td colSpan={isManager ? 3 : 2} />
                  </tr>
                </tfoot>
              </table>
            </div>
            <footer className={styles.tableFooter}>
              Mostrando {filteredItems.length} de {scopedItems.length} operaciones
            </footer>
          </section>
        </>
      )}

      <SuperModal
        isOpen={selectedOperation !== null}
        onClose={() => {
          if (!saveManifest.isPending) setSelectedOperation(null);
        }}
        title="Planillación rápida"
        width="640px"
      >
        {selectedOperation && (
          <form className={styles.modalForm} onSubmit={handleSubmit}>
            <p className={styles.modalIntro}>
              Verifica los datos para copiar a Syscom / RNDC y registra el número
              del manifiesto.
            </p>
            <div className={styles.copyGrid}>
              <div>
                <span>Cliente</span>
                <strong>{selectedOperation.clientName}</strong>
              </div>
              <div>
                <span>Vehículo</span>
                <strong>{selectedOperation.vehicle?.plate ?? "Sin asignar"}</strong>
              </div>
              <div>
                <span>Conductor / Cédula</span>
                <strong>
                  {selectedOperation.driver?.name ?? "Sin asignar"}
                  {selectedOperation.driver?.cedula
                    ? ` · ${selectedOperation.driver.cedula}`
                    : ""}
                </strong>
              </div>
              <div>
                <span>Contenedor</span>
                <strong>
                  {selectedOperation.isContainerized
                    ? selectedOperation.containerNumber ?? "Pendiente"
                    : "Carga suelta"}
                </strong>
              </div>
              <div>
                <span>Flete a Cobrar</span>
                <strong>{formatCurrency(selectedOperation.freightToCharge)}</strong>
              </div>
              <div>
                <span>Flete a Pagar</span>
                <strong>{formatCurrency(selectedOperation.freightToPay)}</strong>
              </div>
            </div>
            <label className={styles.formField}>
              <span>Número de Manifiesto *</span>
              <input
                type="text"
                required
                value={manifestNumber}
                onChange={(event) => setManifestNumber(event.target.value)}
                maxLength={100}
                autoFocus
              />
            </label>
            <label className={styles.formField}>
              <span>PDF del manifiesto (opcional)</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) =>
                  setManifestFile(event.target.files?.[0] ?? null)
                }
              />
              {manifestFile && (
                <small className={styles.fileInfo}>
                  {manifestFile.name}
                  <button
                    type="button"
                    aria-label="Quitar PDF seleccionado"
                    onClick={() => setManifestFile(null)}
                  >
                    <X size={14} />
                  </button>
                </small>
              )}
            </label>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setSelectedOperation(null)}
                disabled={saveManifest.isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={saveManifest.isPending || !manifestNumber.trim()}
              >
                {saveManifest.isPending ? "Guardando..." : "Guardar manifiesto"}
              </button>
            </div>
          </form>
        )}
      </SuperModal>
    </main>
  );
}

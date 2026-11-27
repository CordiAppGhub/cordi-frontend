"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, MapPin, Search, Truck } from "lucide-react";
import { useAuthStore } from "@/store/use-auth.store";
import {
  FleetLocationCategory,
  FleetStatusItem,
  getFleetStatus,
} from "@/services/fleet-status.service";
import styles from "./fleet-status.module.css";

type LocationFilter = "TODOS" | FleetLocationCategory;

const locationFilters: { value: LocationFilter; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "PUERTO", label: "En Puerto" },
  { value: "PATIO", label: "En Patio" },
  { value: "CLIENTE", label: "En Cliente" },
  { value: "EN_RUTA", label: "En Ruta" },
  { value: "DISPONIBLE", label: "Disponibles" },
];

function formatVehicleStatus(status: string): string {
  const labels: Record<string, string> = {
    AVAILABLE: "Disponible",
    IN_TRANSIT: "En tránsito",
    MAINTENANCE: "En mantenimiento",
    OUT_OF_SERVICE: "Fuera de servicio",
  };
  return labels[status] ?? status.replace(/_/g, " ");
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleString("es-CO", {
        dateStyle: "short",
        timeStyle: "short",
      });
}

function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function exportCsv(items: FleetStatusItem[], includeAnalyst: boolean): void {
  const headers = [
    "Vehículo (Placa)",
    "Tipo",
    "Marca",
    "Tráiler / Chasis",
    "Conductor",
    "Documento",
    "Teléfono",
    "Operación",
    "Booking",
    "Contenedor",
    "Cliente",
    ...(includeAnalyst ? ["Analista"] : []),
    "Ubicación",
    "Etapa",
    "Estado",
    "Última actualización",
  ];
  const rows = items.map((item) => [
    item.vehicle.plate,
    item.vehicle.type,
    item.vehicle.brand,
    item.trailer,
    item.driver?.name ?? null,
    item.driver?.document ?? null,
    item.driver?.phone ?? null,
    item.activeOperation ? `#${item.activeOperation.id}` : null,
    item.activeOperation?.booking ?? null,
    item.activeOperation?.containerNumber ?? null,
    item.activeOperation?.clientName ?? null,
    ...(includeAnalyst ? [item.activeOperation?.analystName ?? null] : []),
    item.currentLocation.placeName,
    item.currentLocation.stepLabel,
    formatVehicleStatus(item.vehicle.status),
    formatDate(item.currentLocation.updatedAt),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(";"))
    .join("\r\n");
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "estado-de-flota.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function FleetStatusView() {
  const { user } = useAuthStore();
  const isManager = user?.role === "ADMIN" || user?.role === "JEFE_DE_FLOTA";
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] =
    useState<LocationFilter>("TODOS");
  const fleetQuery = useQuery({
    queryKey: ["fleet-status"],
    queryFn: getFleetStatus,
    refetchInterval: 30_000,
  });
  const vehicles = fleetQuery.data ?? [];
  const visibleFilters = locationFilters.filter(
    (filter) => filter.value !== "DISPONIBLE" || isManager,
  );
  const counts = useMemo(() => {
    const result: Record<FleetLocationCategory, number> = {
      PUERTO: 0,
      PATIO: 0,
      CLIENTE: 0,
      EN_RUTA: 0,
      DISPONIBLE: 0,
    };
    for (const item of vehicles) result[item.currentLocation.category] += 1;
    return result;
  }, [vehicles]);
  const filteredVehicles = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("es");
    return vehicles.filter((item) => {
      if (
        locationFilter !== "TODOS" &&
        item.currentLocation.category !== locationFilter
      ) {
        return false;
      }
      if (!search) return true;
      const searchable = [
        item.vehicle.plate,
        item.trailer,
        item.driver?.name,
        item.activeOperation?.clientName,
        item.activeOperation?.containerNumber,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLocaleLowerCase("es");
      return searchable.includes(search);
    });
  }, [locationFilter, query, vehicles]);

  const summaryCards: {
    label: string;
    count: number;
    filter: LocationFilter;
    tone: string;
  }[] = [
    { label: "Total vehículos", count: vehicles.length, filter: "TODOS", tone: "total" },
    { label: "En Puerto", count: counts.PUERTO, filter: "PUERTO", tone: "port" },
    { label: "En Patio", count: counts.PATIO, filter: "PATIO", tone: "yard" },
    { label: "En Cliente", count: counts.CLIENTE, filter: "CLIENTE", tone: "client" },
    ...(isManager
      ? [
          {
            label: "Disponibles",
            count: counts.DISPONIBLE,
            filter: "DISPONIBLE" as const,
            tone: "available",
          },
        ]
      : []),
  ];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <MapPin size={22} />
            <h1>Estado de Flota</h1>
          </div>
          <p>
            {isManager
              ? "Flota completa de la compañía"
              : "Vehículos en mis operaciones"}
          </p>
        </div>
        <button
          type="button"
          className={styles.exportButton}
          onClick={() => exportCsv(filteredVehicles, isManager)}
          disabled={filteredVehicles.length === 0}
        >
          <Download size={16} />
          Exportar Excel / CSV
        </button>
      </header>

      <section className={styles.summaryGrid} aria-label="Resumen de flota">
        {summaryCards.map((card) => (
          <button
            type="button"
            key={card.label}
            className={`${styles.summaryCard} ${styles[card.tone]} ${
              locationFilter === card.filter ? styles.summaryCardSelected : ""
            }`}
            onClick={() => setLocationFilter(card.filter)}
            aria-pressed={locationFilter === card.filter}
          >
            <span>{card.label}</span>
            <strong>{card.count}</strong>
          </button>
        ))}
      </section>

      <section className={styles.tablePanel}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar placa, tráiler, conductor, cliente o contenedor"
              aria-label="Buscar vehículos de la flota"
            />
          </label>
          <div className={styles.quickFilters} aria-label="Filtrar por ubicación">
            {visibleFilters.map((filter) => (
              <button
                type="button"
                key={filter.value}
                className={
                  locationFilter === filter.value ? styles.filterActive : ""
                }
                onClick={() => setLocationFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {fleetQuery.isLoading ? (
          <p className={styles.feedback} role="status">Cargando estado de flota...</p>
        ) : fleetQuery.error ? (
          <p className={styles.error} role="alert">
            {fleetQuery.error instanceof Error
              ? fleetQuery.error.message
              : "No se pudo consultar el estado de la flota."}
          </p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Vehículo (Placa)</th>
                  <th>Tráiler / Chasis</th>
                  <th>Conductor</th>
                  <th>Operación / Contenedor</th>
                  <th>Cliente</th>
                  {isManager && <th>Analista</th>}
                  <th>Ubicación Actual (Patio / Puerto / Punto)</th>
                  <th>Estado</th>
                  <th>Última Actualización</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((item) => (
                  <tr key={item.vehicle.id}>
                    <td>
                      <strong className={styles.vehiclePlate}>
                        <Truck size={14} />
                        {item.vehicle.plate}
                      </strong>
                      <small>
                        {item.vehicle.type}
                        {item.vehicle.brand ? ` · ${item.vehicle.brand}` : ""}
                      </small>
                    </td>
                    <td>{item.trailer ?? "—"}</td>
                    <td>
                      {item.driver?.name ?? "Sin conductor"}
                      {item.driver?.document && (
                        <small>{item.driver.document}</small>
                      )}
                      {item.driver?.phone && <small>{item.driver.phone}</small>}
                    </td>
                    <td>
                      {item.activeOperation ? (
                        <Link
                          className={styles.operationLink}
                          href={`/operations?operationId=${item.activeOperation.id}`}
                        >
                          <span>
                            {item.activeOperation.code}
                            {item.activeOperation.containerNumber
                              ? ` · ${item.activeOperation.containerNumber}`
                              : ""}
                          </span>
                          <small>
                            {item.activeOperation.status.replace(/_/g, " ")}
                          </small>
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{item.activeOperation?.clientName ?? "—"}</td>
                    {isManager && (
                      <td>{item.activeOperation?.analystName ?? "—"}</td>
                    )}
                    <td>
                      <span className={`${styles.locationBadge} ${styles[item.currentLocation.category]}`}>
                        {item.currentLocation.placeName}
                      </span>
                      <small>{item.currentLocation.stepLabel}</small>
                    </td>
                    <td>{formatVehicleStatus(item.vehicle.status)}</td>
                    <td>{formatDate(item.currentLocation.updatedAt)}</td>
                  </tr>
                ))}
                {filteredVehicles.length === 0 && (
                  <tr>
                    <td
                      colSpan={isManager ? 9 : 8}
                      className={styles.emptyState}
                    >
                      No hay vehículos para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!fleetQuery.isLoading && !fleetQuery.error && (
          <footer className={styles.tableFooter}>
            Mostrando {filteredVehicles.length} de {vehicles.length} vehículos
          </footer>
        )}
      </section>
    </main>
  );
}

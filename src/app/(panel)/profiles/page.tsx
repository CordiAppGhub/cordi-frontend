"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  FileSearch,
  Search,
  Ship,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import {
  ProfileKind,
  ProfileOperation,
  ProfileRecordData,
  ProfileSummary,
  profilesService,
} from "@/services/profiles.service";
import styles from "./profiles.module.css";
import { TruckLoader } from "@/components/TruckLoader";
import { useAuthStore } from "@/store/use-auth.store";

const PROFILE_TABS: Array<{
  id: ProfileKind;
  label: string;
  icon: typeof Archive;
}> = [
  { id: "containers", label: "Contenedores", icon: Archive },
  { id: "vehicles", label: "Vehículos", icon: Truck },
  { id: "trailers", label: "Tráilers / Chasises", icon: Truck },
  { id: "drivers", label: "Conductores", icon: Users },
  { id: "analysts", label: "Analistas", icon: ShieldCheck },
  { id: "shipping-lines", label: "Navieras", icon: Ship },
];

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" && value.includes("T")) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleString("es-CO");
  }
  return String(value);
}

function profileName(profile: ProfileSummary): string {
  return profile.name || profile.plate || String(profile.id);
}

function relatedValue(value: unknown, key: string): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return key in value ? (value as Record<string, unknown>)[key] : null;
}

function visibleFacts(
  facts: Array<[string, unknown]>,
): Array<[string, unknown]> {
  return facts.filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );
}

function profileFacts(
  kind: ProfileKind,
  profile: Record<string, unknown>,
): Array<[string, unknown]> {
  if (kind === "containers") {
    const yard = relatedValue(profile, "yardContainer");
    return visibleFacts([
      ["Tipo", profile.type ?? relatedValue(yard, "type")],
      ["Estado", relatedValue(yard, "status") ?? profile.status],
      ["Ubicación", relatedValue(relatedValue(yard, "location"), "name")],
      ["Cliente", relatedValue(relatedValue(yard, "client"), "razonSocial")],
      ["Naviera", relatedValue(yard, "shippingCompany")],
    ]);
  }

  if (kind === "vehicles") {
    return visibleFacts([
      ["Placa", profile.plate],
      ["Tipo", profile.type],
      ["Marca", profile.brand],
      ["Modelo", profile.modelYear],
      ["Estado", profile.status],
      ["Vence SOAT", profile.soatExpiration],
      ["Vence tecnomecánica", profile.tecnoExpiration],
      [
        "Conductor asignado",
        relatedValue(relatedValue(profile, "driver"), "name"),
      ],
      [
        "Analista asignado",
        relatedValue(relatedValue(profile, "analyst"), "name"),
      ],
    ]);
  }

  if (kind === "trailers") {
    return visibleFacts([
      ["Placa", profile.plate],
      ["Tipo", profile.trailerType],
      ["Ejes", profile.axles],
      ["Marca", profile.brand],
      ["Capacidad", profile.capacity],
      ["Estado", profile.status],
      [
        "Cabezote acoplado",
        relatedValue(relatedValue(profile, "coupledVehicle"), "plate"),
      ],
    ]);
  }

  if (kind === "shipping-lines") {
    return visibleFacts([
      ["NIT", profile.nit],
      ["Registro", profile.createdAt],
    ]);
  }

  return visibleFacts([
    ["Cédula", profile.cedula],
    ["Teléfono", profile.telefono],
    ["Correo", profile.email],
    [
      "Estado",
      profile.isActive === true
        ? "Activo"
        : profile.isActive === false
          ? "Inactivo"
          : null,
    ],
  ]);
}

export default function ProfilesPage() {
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const [selectedKind, setSelectedKind] = useState<ProfileKind>("containers");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detailPage, setDetailPage] = useState(1);
  const [selected, setSelected] = useState<ProfileSummary | null>(null);
  const restrictedKind: ProfileKind | null =
    user?.role === "ANALISTA"
      ? "analysts"
      : user?.role === "CONDUCTOR"
        ? "drivers"
        : null;
  const kind = restrictedKind ?? selectedKind;
  const visibleTabs = restrictedKind
    ? PROFILE_TABS.filter((tab) => tab.id === restrictedKind)
    : PROFILE_TABS;

  const listQuery = useQuery({
    queryKey: ["profiles", kind, search, page],
    queryFn: () => profilesService.list(kind, search, page),
    enabled: !!user && !isAuthLoading,
  });
  const detailQuery = useQuery({
    queryKey: ["profile", kind, selected?.id, detailPage],
    queryFn: () => profilesService.get(kind, selected!.id, detailPage),
    enabled: selected !== null && !!user && !isAuthLoading,
  });

  const changeKind = (nextKind: ProfileKind) => {
    if (restrictedKind) return;
    setSelectedKind(nextKind);
    setSelected(null);
    setSearch("");
    setPage(1);
    setDetailPage(1);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Consulta operativa</p>
          <h1>Perfiles y trazabilidad</h1>
          <p>Consulta expedientes y actividad asociada a las operaciones.</p>
        </div>
        <div className={styles.accessNote}>
          <ShieldCheck size={17} />
          <span>Consulta según el alcance de tu usuario</span>
        </div>
      </header>

      <nav className={styles.tabs} aria-label="Tipos de perfil">
        {visibleTabs.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            className={kind === id ? styles.activeTab : styles.tab}
            onClick={() => changeKind(id)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      <div className={styles.columns}>
        <section className={styles.directory}>
          <label className={styles.search}>
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSelected(null);
                setPage(1);
              }}
              placeholder="Buscar en los perfiles..."
              aria-label="Buscar perfiles"
            />
          </label>

          {isAuthLoading || listQuery.isLoading ? (
            <TruckLoader variant="compact" message="Cargando perfiles..." />
          ) : !user ? (
            <p className={styles.error}>
              Debes iniciar sesión para consultar perfiles.
            </p>
          ) : listQuery.error ? (
            <p className={styles.error}>
              No se pudieron cargar los perfiles. Vuelve a intentarlo.
            </p>
          ) : listQuery.data?.data.length ? (
            <>
              <p className={styles.resultCount}>
                {listQuery.data.meta.total} perfiles
              </p>
              <div className={styles.profileList}>
                {listQuery.data.data.map((profile) => (
                  <button
                    type="button"
                    key={profile.id}
                    className={`${styles.profileRow} ${selected?.id === profile.id ? styles.selectedRow : ""}`}
                    onClick={() => {
                      setSelected(profile);
                      setDetailPage(1);
                    }}
                  >
                    <span className={styles.profileIcon}>
                      {kind === "vehicles" ? (
                        <Truck size={18} />
                      ) : kind === "trailers" ? (
                        <Truck size={18} />
                      ) : kind === "shipping-lines" ? (
                        <Ship size={18} />
                      ) : kind === "drivers" || kind === "analysts" ? (
                        <Users size={18} />
                      ) : (
                        <Archive size={18} />
                      )}
                    </span>
                    <span className={styles.profileIdentity}>
                      <strong>{profileName(profile)}</strong>
                      <small>
                        {kind === "shipping-lines"
                          ? `NIT ${profile.nit ?? "—"}`
                          : kind === "trailers"
                            ? `${profile.axles ?? "—"} ejes · ${String(profile.status ?? "Estado no registrado").replaceAll("_", " ")}`
                          : String(
                              profile.status ??
                                profile.type ??
                                profile.email ??
                                "Perfil",
                            )}
                      </small>
                    </span>
                    <span className={styles.operationCount}>
                      {profile.totalOperations} ops.
                    </span>
                  </button>
                ))}
              </div>
              {listQuery.data.meta.total > listQuery.data.meta.limit && (
                <div className={styles.pagination}>
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    Anterior
                  </button>
                  <span>
                    Página {page} de{" "}
                    {Math.ceil(
                      listQuery.data.meta.total / listQuery.data.meta.limit,
                    )}
                  </span>
                  <button
                    type="button"
                    disabled={
                      page * listQuery.data.meta.limit >=
                      listQuery.data.meta.total
                    }
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className={styles.message}>No hay perfiles para mostrar.</p>
          )}
        </section>

        <section className={styles.detail}>
          {!selected ? (
            <div className={styles.emptyDetail}>
              <FileSearch size={34} />
              <h2>Selecciona un perfil</h2>
              <p>Verás sus métricas, operaciones y registro de trazabilidad.</p>
            </div>
          ) : detailQuery.isLoading ? (
            <TruckLoader variant="compact" message="Cargando expediente..." />
          ) : detailQuery.error ? (
            <p className={styles.error}>
              No se pudo cargar el expediente o no está disponible para tu
              usuario.
            </p>
          ) : detailQuery.data ? (
            <ProfileRecord
              kind={kind}
              item={selected}
              profile={detailQuery.data.profile}
              trailerCouplingHistory={
                detailQuery.data.profile.couplingHistory ?? []
              }
              metrics={detailQuery.data.metrics}
              operations={detailQuery.data.operations}
              meta={detailQuery.data.meta}
              onPageChange={setDetailPage}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}

function ProfileRecord({
  kind,
  item,
  profile,
  trailerCouplingHistory,
  metrics,
  operations,
  meta,
  onPageChange,
}: {
  kind: ProfileKind;
  item: ProfileSummary;
  profile: ProfileRecordData;
  trailerCouplingHistory: NonNullable<ProfileRecordData["couplingHistory"]>;
  metrics: {
    totalOperations: number;
    activeOperations: number;
    completedOperations: number;
    incidents: number;
    evidences: number;
    inspections: number;
    rejectedInspections: number;
    deviations: number;
    lastReportedLocation?: {
      locationName: string;
      reportedAt: string;
    } | null;
    operationsByStatus: Array<{ status: string; count: number }>;
    operationsByDestination: Array<{
      locationId: number;
      locationName: string;
      count: number;
    }>;
  };
  operations: ProfileOperation[];
  meta: { total: number; page: number; limit: number; lastPage: number };
  onPageChange: (page: number) => void;
}) {
  const name = profile.name || profile.plate || profile.id || profileName(item);
  const facts = profileFacts(kind, profile);

  return (
    <div className={styles.record}>
      <header className={styles.recordHeader}>
        <div className={styles.recordMark}>
          {kind === "vehicles" ? (
            <Truck />
          ) : kind === "trailers" ? (
            <Truck />
          ) : kind === "containers" ? (
            <Archive />
          ) : kind === "shipping-lines" ? (
            <Ship />
          ) : (
            <Users />
          )}
        </div>
        <div>
          <p className={styles.eyebrow}>
            {PROFILE_TABS.find((tab) => tab.id === kind)?.label}
          </p>
          <h2>{String(name)}</h2>
        </div>
      </header>

      {facts.length > 0 && (
        <div className={styles.facts}>
          {facts.map(([key, value]) => (
            <div className={styles.fact} key={key}>
              <span>{key}</span>
              <strong>{display(value)}</strong>
            </div>
          ))}
        </div>
      )}

      <div
        className={`${styles.metrics} ${
          metrics.lastReportedLocation !== undefined ? styles.trailerMetrics : ""
        }`}
      >
        <Metric label="Operaciones" value={metrics.totalOperations} />
        {metrics.lastReportedLocation !== undefined ? (
          <>
            <Metric label="Operaciones finalizadas" value={metrics.completedOperations} />
            <Metric
              label="Última ubicación reportada por conductor"
              value={
                metrics.lastReportedLocation
                  ? `${metrics.lastReportedLocation.locationName} · ${display(metrics.lastReportedLocation.reportedAt)}`
                  : "Sin reporte manual"
              }
            />
          </>
        ) : (
          <>
            <Metric label="Activas" value={metrics.activeOperations} />
            <Metric label="Finalizadas" value={metrics.completedOperations} />
            <Metric label="Novedades" value={metrics.incidents} />
          </>
        )}
      </div>

      {kind === "trailers" && (
        <section className={styles.couplingHistorySection}>
          <div className={styles.sectionTitle}>
            <div>
              <h3>Historial de enganches</h3>
              <p>Vehículos acoplados y fechas registradas de enganche y desenganche.</p>
            </div>
            <span className={styles.sectionCount}>
              {trailerCouplingHistory.length}
            </span>
          </div>
          {trailerCouplingHistory.length ? (
            <ol className={styles.couplingHistoryList}>
              {trailerCouplingHistory.map((coupling) => (
                <li className={styles.couplingHistoryItem} key={coupling.id}>
                  <div className={styles.couplingHistoryHeader}>
                    <strong>Cabezote {coupling.vehiclePlate}</strong>
                    {!coupling.uncoupledAt && (
                      <span className={styles.currentCouplingBadge}>
                        Acoplado actualmente
                      </span>
                    )}
                  </div>
                  <dl className={styles.couplingHistoryTimes}>
                    <div>
                      <dt>Enganchado</dt>
                      <dd>
                        {coupling.coupledAt
                          ? display(coupling.coupledAt)
                          : "Fecha no disponible (acople anterior al historial)"}
                      </dd>
                    </div>
                    <div>
                      <dt>Desenganchado</dt>
                      <dd>
                        {coupling.uncoupledAt
                          ? display(coupling.uncoupledAt)
                          : "Pendiente"}
                      </dd>
                    </div>
                    {coupling.uncoupledLocation && (
                      <div>
                        <dt>Ubicación al desenganche</dt>
                        <dd>{coupling.uncoupledLocation.name}</dd>
                      </div>
                    )}
                  </dl>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.message}>
              No hay historial de enganches registrado todavía. El historial se
              recopila desde que se habilitó el registro.
            </p>
          )}
        </section>
      )}

      <section className={styles.operationsSection}>
        <div className={styles.sectionTitle}>
          <div>
            <h3>Operaciones asociadas</h3>
            <p>Resumen de actividad vinculada a este perfil.</p>
          </div>
          <span className={styles.sectionCount}>{meta.total}</span>
        </div>

      {operations.length === 0 ? (
        <p className={styles.message}>
          No hay operaciones asociadas a este perfil.
        </p>
      ) : (
        <div className={styles.operationList}>
          {operations.map((operation) => (
            <OperationRecord
              key={operation.id}
              kind={kind}
              operation={operation}
            />
          ))}
        </div>
      )}
      </section>
      {meta.total > meta.limit && (
        <div className={styles.pagination}>
          <button
            type="button"
            disabled={meta.page <= 1}
            onClick={() => onPageChange(meta.page - 1)}
          >
            Anterior
          </button>
          <span>
            Página {meta.page} de {meta.lastPage}
          </span>
          <button
            type="button"
            disabled={meta.page >= meta.lastPage}
            onClick={() => onPageChange(meta.page + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OperationRecord({
  kind,
  operation,
}: {
  kind: ProfileKind;
  operation: ProfileOperation;
}) {
  const route = [
    operation.origen?.name,
    operation.nuevoDestino?.name || operation.destino?.name,
  ]
    .filter(Boolean)
    .join(" → ");
  const primaryFacts: Array<[string, string | null | undefined]> = [];

  if (operation.client?.razonSocial) {
    primaryFacts.push(["Cliente", operation.client.razonSocial]);
  }
  if (kind === "containers" || kind === "shipping-lines") {
    primaryFacts.push([
      "Referencia",
      operation.containerNumber ||
        operation.numeroPedido ||
        operation.documentoTransporte,
    ]);
  } else if (kind === "vehicles") {
    primaryFacts.push([
      "Conductor",
      operation.driver?.name || operation.trailer?.plate,
    ]);
  } else if (kind === "trailers") {
    primaryFacts.push([
      "Cabezote",
      operation.vehicle?.plate || operation.trailer?.plate,
    ]);
  } else if (kind === "drivers") {
    primaryFacts.push([
      "Vehículo",
      operation.vehicle?.plate || operation.trailer?.plate,
    ]);
  } else if (kind === "analysts") {
    primaryFacts.push([
      "Referencia",
      operation.numeroPedido ||
        operation.documentoTransporte ||
        operation.containerNumber,
    ]);
  }
  if (route) primaryFacts.push(["Ruta", route]);
  const visibleFacts = primaryFacts.filter(([, value]) => Boolean(value));
  const baseFreight = Number(
    operation.fleteACobrarManual ?? operation.fleteACobrar ?? 0,
  );
  const hasBaseFreight =
    operation.fleteACobrarManual != null || operation.fleteACobrar != null;
  const surchargeTotal = (operation.surcharges ?? []).reduce(
    (total, surcharge) => total + Number(surcharge.totalPrice),
    0,
  );
  const patioCharge = Number(operation.patioCobro ?? 0);
  const totalBilling = baseFreight + patioCharge + surchargeTotal;
  const hasFinancialData =
    operation.fleteACobrarManual != null ||
    operation.fleteACobrar != null ||
    patioCharge > 0 ||
    surchargeTotal > 0;
  return (
    <article className={styles.operation}>
      <header className={styles.operationHeader}>
        <div>
          <strong>#{operation.id}</strong>
          <span>{operation.type.replaceAll("_", " ")}</span>
        </div>
        <div className={styles.operationMeta}>
          <span className={styles.statusBadge}>
            {operation.status.replaceAll("_", " ")}
          </span>
          <time>{display(operation.scheduledAt || operation.createdAt)}</time>
        </div>
      </header>

      {visibleFacts.length > 0 && (
        <dl className={styles.operationFacts}>
          {visibleFacts.map(([label, value]) => (
            <div className={styles.operationFact} key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {kind === "shipping-lines" && operation.depositoDevolucion && (
        <div className={styles.returnDetails}>
          <span>
            Depósito de devolución:{" "}
            <strong>{operation.depositoDevolucion.name}</strong>
          </span>
        </div>
      )}

      {hasFinancialData && (
        <div className={styles.operationFinancial}>
          <strong>Desglose financiero</strong>
          <div className={styles.financialRow}>
            <span>Flete base</span>
            <span>
              {hasBaseFreight
                ? `$${baseFreight.toLocaleString("es-CO")}`
                : "Pendiente"}
            </span>
          </div>
          {patioCharge > 0 && (
            <div className={styles.financialRow}>
              <span>Recargo de patio</span>
              <span>${patioCharge.toLocaleString("es-CO")}</span>
            </div>
          )}
          {(operation.surcharges ?? []).map((surcharge) => (
            <div className={styles.financialRow} key={surcharge.id}>
              <span>
                {surcharge.surcharge?.name ?? surcharge.surchargeCode}
                {surcharge.quantity > 1 ? ` · ${surcharge.quantity} unid.` : ""}
                {surcharge.novedad
                  ? ` · Novedad #${surcharge.novedad.id}`
                  : ""}
              </span>
              <span>${Number(surcharge.totalPrice).toLocaleString("es-CO")}</span>
            </div>
          ))}
          <div className={`${styles.financialRow} ${styles.financialTotal}`}>
            <strong>Total cobro cliente</strong>
            <strong>
              {hasBaseFreight
                ? `$${totalBilling.toLocaleString("es-CO")}`
                : "Pendiente de tarifa base"}
            </strong>
          </div>
        </div>
      )}

    </article>
  );
}

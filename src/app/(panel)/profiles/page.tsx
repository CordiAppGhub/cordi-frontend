"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  ClipboardList,
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
  metrics,
  operations,
  meta,
  onPageChange,
}: {
  kind: ProfileKind;
  item: ProfileSummary;
  profile: Record<string, unknown>;
  metrics: {
    totalOperations: number;
    activeOperations: number;
    completedOperations: number;
    incidents: number;
    evidences: number;
    inspections: number;
    rejectedInspections: number;
    deviations: number;
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
          <p>
            {facts
              .slice(0, 2)
              .map(([label, value]) => `${label}: ${display(value)}`)
              .join(" · ")}
          </p>
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

      <div className={styles.metrics}>
        <Metric label="Operaciones" value={metrics.totalOperations} />
        <Metric label="Activas" value={metrics.activeOperations} />
        <Metric label="Finalizadas" value={metrics.completedOperations} />
        <Metric label="Novedades" value={metrics.incidents} />
        <Metric label="Evidencias" value={metrics.evidences} />
        <Metric label="Inspecciones requeridas" value={metrics.inspections} />
        <Metric label="Rechazos por mal estado" value={metrics.rejectedInspections} />
        <Metric label="Desvíos registrados" value={metrics.deviations} />
      </div>

      <section className={styles.breakdownSection}>
        <div className={styles.sectionTitle}>
          <ClipboardList size={18} />
          <h3>Operaciones por estado</h3>
        </div>
        {metrics.operationsByStatus.length === 0 ? (
          <p className={styles.message}>Aún no hay estados para mostrar.</p>
        ) : (
          <div className={styles.breakdownGrid}>
            {metrics.operationsByStatus.map(({ status, count }) => (
              <BreakdownMetric
                key={status}
                label={status.replaceAll("_", " ")}
                value={count}
                total={metrics.totalOperations}
              />
            ))}
          </div>
        )}
      </section>

      <section className={styles.breakdownSection}>
        <div className={styles.sectionTitle}>
          <ClipboardList size={18} />
          <h3>Destinos de entrega</h3>
        </div>
        {metrics.operationsByDestination.length === 0 ? (
          <p className={styles.message}>No hay destinos registrados en las operaciones.</p>
        ) : (
          <div className={styles.breakdownGrid}>
            {metrics.operationsByDestination.map(
              ({ locationId, locationName, count }) => (
                <BreakdownMetric
                  key={locationId}
                  label={locationName}
                  value={count}
                  total={metrics.totalOperations}
                />
              ),
            )}
          </div>
        )}
      </section>

      <div className={styles.sectionTitle}>
        <ClipboardList size={18} />
        <h3>Operaciones y trazabilidad</h3>
        <span>{meta.total}</span>
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

function BreakdownMetric({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className={styles.breakdownItem}>
      <div className={styles.breakdownLabel}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div
        className={styles.breakdownTrack}
        role="meter"
        aria-label={`${label}: ${value} de ${total} operaciones`}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={value}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
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
  return (
    <article className={styles.operation}>
      <header className={styles.operationHeader}>
        <div>
          <strong>Operación #{operation.id}</strong>
          <span>
            {operation.type} · {operation.status}
          </span>
        </div>
        <span>{display(operation.scheduledAt || operation.createdAt)}</span>
      </header>

      <div className={styles.operationGrid}>
        <Fact label="Estado operativo" value={operation.status.replaceAll("_", " ")} />
        <Fact label="Cliente" value={operation.client?.razonSocial} />
        <Fact label="Contenedor" value={operation.containerNumber} />
        <Fact
          label="Pedido / transporte"
          value={operation.numeroPedido || operation.documentoTransporte}
        />
        <Fact
          label="Ruta"
          value={`${operation.origen?.name || "—"} → ${operation.nuevoDestino?.name || operation.destino?.name || "—"}`}
        />
        {kind !== "shipping-lines" && operation.shippingLine && (
          <Fact label="Naviera" value={operation.shippingLine.name} />
        )}
        {operation.requiresInspection && (
          <Fact
            label="Inspección"
            value={operation.inspectionStatus || "Pendiente"}
          />
        )}
        {operation.deviations[0] && (
          <>
            <Fact
              label="Patio reasignado"
              value={operation.deviations[0].newLocation.name}
            />
            <Fact
              label="Motivo del desvío"
              value={operation.deviations[0].reason.replaceAll("_", " ")}
            />
          </>
        )}
        {kind === "shipping-lines" && (
          <Fact
            label="Destino asignado"
            value={
              operation.deviations[0]?.newLocation.name ||
              operation.destino?.name
            }
          />
        )}
        <Fact
          label="Vehículo / chasis"
          value={`${operation.vehicle?.plate || "—"} / ${operation.trailer?.plate || "—"}`}
        />
        {kind !== "drivers" && (
          <Fact label="Conductor" value={operation.driver?.name} />
        )}
        {kind !== "analysts" && (
          <Fact label="Analista" value={operation.analyst?.name} />
        )}
      </div>

      {operation.evidences.length > 0 && (
        <section className={styles.auditSection}>
          <h4>Evidencias ({operation.evidences.length})</h4>
          <div className={styles.evidenceList}>
            {operation.evidences.map((evidence) => (
              <a
                key={evidence.id}
                href={evidence.url || undefined}
                target="_blank"
                rel="noreferrer"
              >
                {evidence.type} · {display(evidence.createdAt)}
              </a>
            ))}
          </div>
        </section>
      )}

      {operation.historialNovedades.length > 0 && (
        <section className={styles.auditSection}>
          <h4>Novedades ({operation.historialNovedades.length})</h4>
          {operation.historialNovedades.map((incident) => (
            <p className={styles.auditEntry} key={incident.id}>
              <strong>
                {incident.severity} · {incident.status}
              </strong>
              <span>{incident.description}</span>
              {incident.resolutionNotes && (
                <small>{incident.resolutionNotes}</small>
              )}
            </p>
          ))}
        </section>
      )}

      {operation.events.length > 0 && (
        <section className={styles.auditSection}>
          <h4>Actividad reciente</h4>
          <ol className={styles.timeline}>
            {operation.events.map((event) => (
              <li key={event.id}>
                <time>{display(event.createdAt)}</time>
                <strong>{event.eventType}</strong>
                <span>{event.description}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}

function Fact({ label, value }: { label: string; value: unknown }) {
  return (
    <div className={styles.operationFact}>
      <span>{label}</span>
      <strong>{display(value)}</strong>
    </div>
  );
}

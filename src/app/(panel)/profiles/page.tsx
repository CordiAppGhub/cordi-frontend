'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Archive,
  ClipboardList,
  FileSearch,
  Search,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react';
import {
  ProfileKind,
  ProfileOperation,
  ProfileSummary,
  profilesService,
} from '@/services/profiles.service';
import styles from './profiles.module.css';
import { TruckLoader } from '@/components/TruckLoader';
import { useAuthStore } from '@/store/use-auth.store';

const PROFILE_TABS: Array<{
  id: ProfileKind;
  label: string;
  icon: typeof Archive;
}> = [
  { id: 'containers', label: 'Contenedores', icon: Archive },
  { id: 'vehicles', label: 'Vehículos', icon: Truck },
  { id: 'drivers', label: 'Conductores', icon: Users },
  { id: 'analysts', label: 'Analistas', icon: ShieldCheck },
];

function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string' && value.includes('T')) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleString('es-CO');
  }
  return String(value);
}

function profileName(profile: ProfileSummary): string {
  return profile.name || profile.plate || String(profile.id);
}

function relatedValue(value: unknown, key: string): unknown {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return key in value ? (value as Record<string, unknown>)[key] : null;
}

function visibleFacts(facts: Array<[string, unknown]>): Array<[string, unknown]> {
  return facts.filter(
    ([, value]) => value !== null && value !== undefined && value !== '',
  );
}

function profileFacts(
  kind: ProfileKind,
  profile: Record<string, unknown>,
): Array<[string, unknown]> {
  if (kind === 'containers') {
    const yard = relatedValue(profile, 'yardContainer');
    return visibleFacts([
      ['Tipo', profile.type ?? relatedValue(yard, 'type')],
      ['Estado', relatedValue(yard, 'status') ?? profile.status],
      ['Ubicación', relatedValue(relatedValue(yard, 'location'), 'name')],
      ['Cliente', relatedValue(relatedValue(yard, 'client'), 'razonSocial')],
      ['Naviera', relatedValue(yard, 'shippingCompany')],
    ]);
  }

  if (kind === 'vehicles') {
    return visibleFacts([
      ['Placa', profile.plate],
      ['Tipo', profile.type],
      ['Marca', profile.brand],
      ['Modelo', profile.modelYear],
      ['Estado', profile.status],
      ['Vence SOAT', profile.soatExpiration],
      ['Vence tecnomecánica', profile.tecnoExpiration],
      ['Conductor asignado', relatedValue(relatedValue(profile, 'driver'), 'name')],
      ['Analista asignado', relatedValue(relatedValue(profile, 'analyst'), 'name')],
    ]);
  }

  return visibleFacts([
    ['Cédula', profile.cedula],
    ['Teléfono', profile.telefono],
    ['Correo', profile.email],
    ['Estado', profile.isActive === true ? 'Activo' : profile.isActive === false ? 'Inactivo' : null],
  ]);
}

export default function ProfilesPage() {
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const [selectedKind, setSelectedKind] = useState<ProfileKind>('containers');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ProfileSummary | null>(null);
  const restrictedKind: ProfileKind | null =
    user?.role === 'ANALISTA'
      ? 'analysts'
      : user?.role === 'CONDUCTOR'
        ? 'drivers'
        : null;
  const kind = restrictedKind ?? selectedKind;
  const visibleTabs = restrictedKind
    ? PROFILE_TABS.filter((tab) => tab.id === restrictedKind)
    : PROFILE_TABS;

  const listQuery = useQuery({
    queryKey: ['profiles', kind, search, page],
    queryFn: () => profilesService.list(kind, search, page),
    enabled: !!user && !isAuthLoading,
  });
  const detailQuery = useQuery({
    queryKey: ['profile', kind, selected?.id],
    queryFn: () => profilesService.get(kind, selected!.id),
    enabled: selected !== null && !!user && !isAuthLoading,
  });

  const changeKind = (nextKind: ProfileKind) => {
    if (restrictedKind) return;
    setSelectedKind(nextKind);
    setSelected(null);
    setSearch('');
    setPage(1);
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
            <p className={styles.error}>Debes iniciar sesión para consultar perfiles.</p>
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
                    className={`${styles.profileRow} ${selected?.id === profile.id ? styles.selectedRow : ''}`}
                    onClick={() => setSelected(profile)}
                  >
                    <span className={styles.profileIcon}>
                      {kind === 'vehicles' ? (
                        <Truck size={18} />
                      ) : kind === 'drivers' || kind === 'analysts' ? (
                        <Users size={18} />
                      ) : (
                        <Archive size={18} />
                      )}
                    </span>
                    <span className={styles.profileIdentity}>
                      <strong>{profileName(profile)}</strong>
                      <small>
                        {String(profile.status ?? profile.type ?? profile.email ?? 'Perfil')}
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
                    Página {page} de {Math.ceil(listQuery.data.meta.total / listQuery.data.meta.limit)}
                  </span>
                  <button
                    type="button"
                    disabled={page * listQuery.data.meta.limit >= listQuery.data.meta.total}
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
              No se pudo cargar el expediente o no está disponible para tu usuario.
            </p>
          ) : detailQuery.data ? (
            <ProfileRecord
              kind={kind}
              item={selected}
              profile={detailQuery.data.profile}
              metrics={detailQuery.data.metrics}
              operations={detailQuery.data.operations}
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
  };
  operations: ProfileOperation[];
}) {
  const name = profile.name || profile.plate || profile.id || profileName(item);
  const facts = profileFacts(kind, profile);

  return (
    <div className={styles.record}>
      <header className={styles.recordHeader}>
        <div className={styles.recordMark}>
          {kind === 'vehicles' ? <Truck /> : kind === 'containers' ? <Archive /> : <Users />}
        </div>
        <div>
          <p className={styles.eyebrow}>{PROFILE_TABS.find((tab) => tab.id === kind)?.label}</p>
          <h2>{String(name)}</h2>
          <p>{facts.slice(0, 2).map(([label, value]) => `${label}: ${display(value)}`).join(' · ')}</p>
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
      </div>

      <div className={styles.sectionTitle}>
        <ClipboardList size={18} />
        <h3>Operaciones y trazabilidad</h3>
        <span>{operations.length}</span>
      </div>

      {operations.length === 0 ? (
        <p className={styles.message}>No hay operaciones asociadas a este perfil.</p>
      ) : (
        <div className={styles.operationList}>
          {operations.map((operation) => (
            <OperationRecord key={operation.id} kind={kind} operation={operation} />
          ))}
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
  return (
    <article className={styles.operation}>
      <header className={styles.operationHeader}>
        <div>
          <strong>Operación #{operation.id}</strong>
          <span>{operation.type} · {operation.status}</span>
        </div>
        <span>{display(operation.scheduledAt || operation.createdAt)}</span>
      </header>

      <div className={styles.operationGrid}>
        <Fact label="Cliente" value={operation.client?.razonSocial} />
        <Fact label="Contenedor" value={operation.containerNumber} />
        <Fact label="Pedido / transporte" value={operation.numeroPedido || operation.documentoTransporte} />
        <Fact label="Ruta" value={`${operation.origen?.name || '—'} → ${operation.destino?.name || '—'}`} />
        <Fact label="Vehículo / chasis" value={`${operation.vehicle?.plate || '—'} / ${operation.trailer?.plate || '—'}`} />
        {kind !== 'drivers' && <Fact label="Conductor" value={operation.driver?.name} />}
        {kind !== 'analysts' && <Fact label="Analista" value={operation.analyst?.name} />}
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
              <strong>{incident.severity} · {incident.status}</strong>
              <span>{incident.description}</span>
              {incident.resolutionNotes && <small>{incident.resolutionNotes}</small>}
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

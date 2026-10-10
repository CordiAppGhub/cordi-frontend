'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Clock3,
  Coins,
  RefreshCw,
  ShieldAlert,
  Truck,
} from 'lucide-react';
import { LiveClock } from '@/components/atoms/liveClock/LiveClock';
import { useAuthStore } from '@/store/use-auth.store';
import { useDashboard } from './hooks/useDashboard';
import { DashboardFilters } from '@/services/dashboard.service';
import {
  AnalystPerformance,
  DashboardPeriodMetrics,
  DashboardSummary,
} from '@/types/dashboard-types';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { ActiveDispatchesTable } from './components/ActiveDispatch';
import { TruckLoader } from '@/components/TruckLoader';
import styles from './dashboard.module.css';

const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});
const wholeNumber = new Intl.NumberFormat('es-CO');
const percentage = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 1,
});

function localDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateOffset(date: string, days: number) {
  const result = new Date(`${date}T12:00:00`);
  result.setDate(result.getDate() + days);
  return localDateInput(result);
}

function periodCompletionRate(metrics: DashboardPeriodMetrics) {
  const completedAndActive =
    metrics.completedTrips + metrics.outstandingTrips;
  return completedAndActive > 0
    ? (metrics.completedTrips / completedAndActive) * 100
    : null;
}

function comparison(current: number, previous: number, suffix = '%') {
  if (previous === 0) return current === 0 ? '0%' : 'Sin base anterior';
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return `${change > 0 ? '+' : ''}${percentage.format(change)}${suffix}`;
}

function ComparisonLabel({
  current,
  previous,
  inverse = false,
}: {
  current: number;
  previous: number;
  inverse?: boolean;
}) {
  const text = comparison(current, previous);
  const difference = current - previous;
  const isImprovement = inverse ? difference <= 0 : difference >= 0;
  const isUnchanged = difference === 0;

  return (
    <span
      className={[
        styles.comparison,
        isUnchanged
          ? styles.comparisonNeutral
          : isImprovement
            ? styles.comparisonPositive
            : styles.comparisonNegative,
      ].join(' ')}
    >
      {difference < 0 ? (
        <ArrowDownRight size={14} aria-hidden="true" />
      ) : (
        <ArrowUpRight size={14} aria-hidden="true" />
      )}
      {text}
    </span>
  );
}

function MetricCard({
  title,
  value,
  detail,
  comparisonValue,
  comparisonPrevious,
  icon,
  tone = 'blue',
  inverse,
}: {
  title: string;
  value: string;
  detail: string;
  comparisonValue?: number;
  comparisonPrevious?: number;
  icon: React.ReactNode;
  tone?: 'blue' | 'green' | 'violet' | 'amber';
  inverse?: boolean;
}) {
  return (
    <article className={styles.metricCard}>
      <div className={styles.metricTopline}>
        <span className={`${styles.metricIcon} ${styles[tone]}`}>{icon}</span>
        {comparisonValue !== undefined && comparisonPrevious !== undefined && (
          <ComparisonLabel
            current={comparisonValue}
            previous={comparisonPrevious}
            inverse={inverse}
          />
        )}
      </div>
      <p className={styles.metricTitle}>{title}</p>
      <strong className={styles.metricValue}>{value}</strong>
      <p className={styles.metricDetail}>{detail}</p>
    </article>
  );
}

function AnalystLeaderboard({
  analysts,
}: {
  analysts: AnalystPerformance[];
}) {
  return (
    <section className={styles.leaderboardCard}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>GESTIÓN COMERCIAL</p>
          <h2>Rendimiento de analistas</h2>
        </div>
        <span className={styles.chartNote}>Por operaciones del período</span>
      </div>

      {analysts.length > 0 ? (
        <div className={styles.tableScroll}>
          <table className={styles.analyticsTable}>
            <thead>
              <tr>
                <th>Analista</th>
                <th>Viajes asignados</th>
                <th>Finalizados</th>
                <th>Tasa de cierre</th>
              </tr>
            </thead>
            <tbody>
              {analysts.map((analyst, index) => (
                <tr key={analyst.id}>
                  <td>
                    <span className={styles.analystName}>
                      <span className={styles.rankBadge}>{index + 1}</span>
                      {analyst.name}
                    </span>
                  </td>
                  <td>{wholeNumber.format(analyst.totalTrips)}</td>
                  <td>{wholeNumber.format(analyst.completedTrips)}</td>
                  <td>
                    <strong className={styles.closeRate}>
                      {percentage.format(analyst.completionRate)}%
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.emptyState}>
          No hay operaciones asignadas a analistas en este período.
        </p>
      )}
    </section>
  );
}

function CriticalAlerts({ data }: { data: DashboardSummary }) {
  const alerts = data.alertasCriticas.lista;

  return (
    <section className={styles.alertsCard}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>ATENCIÓN OPERATIVA</p>
          <h2>Alertas y pendientes</h2>
        </div>
        <span
          className={
            alerts.length > 0 ? styles.alertCount : styles.chartNote
          }
        >
          {alerts.length > 0 ? `${alerts.length} alertas` : 'Sin alertas'}
        </span>
      </div>

      <div className={styles.alertList}>
        {alerts.length > 0 ? (
          alerts.slice(0, 6).map((alert, index) => (
            <div
              className={styles.alertRow}
              key={`${alert.type}-${alert.message}-${index}`}
            >
              <span className={styles.alertIcon}>
                <ShieldAlert size={16} aria-hidden="true" />
              </span>
              <span className={styles.alertMessage}>{alert.message}</span>
              <strong className={styles.alertValue}>
                {wholeNumber.format(alert.count)}
              </strong>
            </div>
          ))
        ) : (
          <p className={styles.emptyState}>
            No se detectaron SOAT vencidos o próximos a vencer, vehículos en
            mantenimiento ni desvíos activos.
          </p>
        )}
      </div>

      {data.alertasCriticas.novedades > 0 && (
        <p className={styles.pendingNotice}>
          <Clock3 size={15} aria-hidden="true" />
          {wholeNumber.format(data.alertasCriticas.novedades)} operaciones
          requieren atender novedades abiertas.
        </p>
      )}
    </section>
  );
}

function getPeriodDescription(start?: string, end?: string) {
  const formatter = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const today = new Date();
  const defaultEnd = localDateInput(today);
  const endDate = end ?? defaultEnd;
  const startDate = start ?? dateOffset(endDate, -29);
  return `${formatter.format(new Date(`${startDate}T12:00:00`))} — ${formatter.format(new Date(`${endDate}T12:00:00`))}`;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((previous) => ({
        ...previous,
        search: searchTerm.trim() || undefined,
      }));
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, isRefetching, error, refresh } =
    useDashboard(filters);
  const role = user?.role;
  const isAnalyst = role === 'ANALISTA';
  const isFleetManager = role === 'JEFE_DE_FLOTA';
  const isAdministrator = role === 'ADMIN';
  const showFleet = isFleetManager || isAdministrator;

  const roleTitle = isAnalyst
    ? 'Panel de analista'
    : isFleetManager
      ? 'Panel de jefe de flota'
      : isAdministrator
        ? 'Panel de administración'
        : 'Panel de operación';
  const roleSubtitle = isAnalyst
    ? 'Seguimiento de tus operaciones, gestión y resultados comerciales.'
    : isFleetManager
      ? 'Visibilidad operativa de vehículos, recorridos y novedades de flota.'
      : isAdministrator
        ? 'Visión consolidada del negocio, los analistas y la operación completa.'
        : 'Resumen de operaciones y actividad logística.';

  const periodDescription = useMemo(
    () => getPeriodDescription(filters.startDate, filters.endDate),
    [filters.endDate, filters.startDate],
  );

  function setPeriod(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    setFilters((previous) => ({
      ...previous,
      startDate: localDateInput(start),
      endDate: localDateInput(end),
    }));
  }

  const endDateInput = filters.endDate ?? localDateInput(new Date());
  const startDateInput = filters.startDate ?? dateOffset(endDateInput, -29);

  if (isLoading && !data) {
    return (
      <div className={styles.dashboardContainer}>
        <TruckLoader
          variant="section"
          message="Preparando tus indicadores y datos operativos..."
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.errorBanner} role="alert">
          <span>{error ?? 'No fue posible cargar los datos del dashboard.'}</span>
          <button
            className={styles.errorRetryButton}
            disabled={isRefetching}
            onClick={() => void refresh()}
            type="button"
          >
            <RefreshCw size={15} aria-hidden="true" />
            {isRefetching ? 'Reintentando...' : 'Reintentar'}
          </button>
        </div>
      </div>
    );
  }

  const { analytics } = data;
  const current = analytics.current;
  const previous = analytics.previous;
  const completionRate = periodCompletionRate(current);
  const previousCompletionRate = periodCompletionRate(previous);
  const selectedPeriodDays = filters.startDate
    ? Math.max(
        1,
        Math.ceil(
          (new Date(`${filters.endDate ?? localDateInput(new Date())}T00:00:00`).getTime() -
            new Date(`${filters.startDate}T00:00:00`).getTime()) /
            86_400_000,
        ) + 1,
      )
    : 30;

  return (
    <div className={styles.dashboardContainer}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>
            <Activity size={14} aria-hidden="true" />
            INTELIGENCIA OPERATIVA
          </span>
          <h1>{roleTitle}</h1>
          <p>{roleSubtitle}</p>
          <div className={styles.heroMeta}>
            <span>
              <BriefcaseBusiness size={14} aria-hidden="true" />
              {user?.name ?? 'Equipo Corditrans'}
            </span>
            <span className={styles.metaDivider} aria-hidden="true" />
            <span>{periodDescription}</span>
          </div>
        </div>
        <div className={styles.heroActions}>
          <LiveClock onRefresh={refresh} isRefetching={isRefetching} />
          <span className={styles.syncCaption}>
            <span
              className={`${styles.syncDot} ${
                isRefetching ? styles.syncing : ''
              }`}
            />
            {isRefetching ? 'Actualizando datos' : 'Datos actualizados'}
          </span>
        </div>
      </section>

      <section className={styles.filterBar} aria-label="Filtros del dashboard">
        <div className={styles.filterPresets}>
          {[7, 30, 90].map((days) => (
            <button
              className={`${styles.periodButton} ${
                selectedPeriodDays === days ? styles.periodButtonActive : ''
              }`}
              key={days}
              onClick={() => setPeriod(days)}
              type="button"
            >
              {days} días
            </button>
          ))}
        </div>
        <div className={styles.dateFilters}>
          <label>
            <span>Desde</span>
            <input
              type="date"
              max={endDateInput}
              value={startDateInput}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  startDate: event.target.value || undefined,
                }))
              }
            />
          </label>
          <label>
            <span>Hasta</span>
            <input
              type="date"
              min={startDateInput}
              max={localDateInput(new Date())}
              value={endDateInput}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  endDate: event.target.value || undefined,
                }))
              }
            />
          </label>
        </div>
      </section>

      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
        </div>
      )}

      <section className={styles.metricsGrid} aria-label="Indicadores clave">
        {isFleetManager ? (
          <>
            <MetricCard
              title="Vehículos en flota"
              value={wholeNumber.format(data.flota.total)}
              detail="Total de unidades registradas"
              icon={<Truck size={18} />}
              tone="blue"
            />
            <MetricCard
              title="Vehículos disponibles"
              value={wholeNumber.format(data.flota.disponible)}
              detail={
                data.flota.total > 0
                  ? `${percentage.format((data.flota.disponible / data.flota.total) * 100)}% de la flota`
                  : 'Sin vehículos registrados'
              }
              icon={<Truck size={18} />}
              tone="green"
            />
            <MetricCard
              title="Viajes en ruta"
              value={wholeNumber.format(data.flota.enRuta)}
              detail="Vehículos marcados en tránsito"
              icon={<Activity size={18} />}
              tone="violet"
            />
            <MetricCard
              title="En mantenimiento"
              value={wholeNumber.format(data.flota.enMantenimiento)}
              detail={`${wholeNumber.format(data.flota.noDisponibles ?? 0)} fuera de servicio`}
              icon={<ShieldAlert size={18} />}
              tone="amber"
            />
          </>
        ) : (
          <>
            <MetricCard
              title={isAnalyst ? 'Mis viajes' : 'Viajes del período'}
              value={wholeNumber.format(current.totalTrips)}
              detail={`${wholeNumber.format(current.completedTrips)} finalizados · ${wholeNumber.format(current.outstandingTrips)} en gestión`}
              comparisonValue={current.totalTrips}
              comparisonPrevious={previous.totalTrips}
              icon={<BriefcaseBusiness size={18} />}
              tone="blue"
            />
            <MetricCard
              title="Facturación registrada"
              value={currency.format(current.invoicedRevenue)}
              detail="Fletes, patios y recargos facturados"
              comparisonValue={current.invoicedRevenue}
              comparisonPrevious={previous.invoicedRevenue}
              icon={<Coins size={18} />}
              tone="green"
            />
            <MetricCard
              title="Costos registrados"
              value={currency.format(current.registeredCosts)}
              detail="Fletes y patios con costo informado"
              comparisonValue={current.registeredCosts}
              comparisonPrevious={previous.registeredCosts}
              icon={<Coins size={18} />}
              tone="violet"
              inverse
            />
            <MetricCard
              title="Tasa de cierre"
              value={
                completionRate === null
                  ? '—'
                  : `${percentage.format(completionRate)}%`
              }
              detail={`${wholeNumber.format(current.completedTrips)} finalizados de ${wholeNumber.format(current.completedTrips + current.outstandingTrips)} activos`}
              icon={<Activity size={18} />}
              tone="amber"
            />
          </>
        )}

        {isAdministrator && (
          <>
            <MetricCard
              title="Analistas activos"
              value={wholeNumber.format(data.administrator.analystCount)}
              detail="Usuarios habilitados para gestionar"
              icon={<BriefcaseBusiness size={18} />}
              tone="violet"
            />
            <MetricCard
              title="Clientes registrados"
              value={wholeNumber.format(data.administrator.clientCount)}
              detail="Total de clientes en el sistema"
              icon={<BriefcaseBusiness size={18} />}
              tone="amber"
            />
          </>
        )}
      </section>

      <section className={styles.comparisonBar}>
          <div>
            <span className={styles.comparisonHeading}>
              Comparativo de períodos
            </span>
            <span className={styles.comparisonSubheading}>
              Mismo número de días inmediatamente anterior
            </span>
          </div>
          <div className={styles.comparisonSummary}>
            <span>
              Viajes
              <strong>
                {comparison(current.totalTrips, previous.totalTrips)}
              </strong>
            </span>
            <span>
              Facturación
              <strong>
                {comparison(
                  current.invoicedRevenue,
                  previous.invoicedRevenue,
                )}
              </strong>
            </span>
            <span>
              Costos
              <strong>
                {comparison(current.registeredCosts, previous.registeredCosts)}
              </strong>
            </span>
            <span>
              Tasa de cierre
              <strong>
                {completionRate === null || previousCompletionRate === null
                  ? 'Sin base anterior'
                  : `${(completionRate - previousCompletionRate) > 0 ? '+' : ''}${percentage.format(completionRate - previousCompletionRate)} pp`}
              </strong>
            </span>
          </div>
      </section>

      <AnalyticsCharts data={data} showFleet={showFleet} />

      {isAdministrator && (
        <section className={styles.administratorOverview}>
          <AnalystLeaderboard analysts={analytics.analystPerformance} />
          <CriticalAlerts data={data} />
        </section>
      )}

      {isFleetManager && <CriticalAlerts data={data} />}

      <section className={styles.operationsSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>
              {isAnalyst ? 'TUS OPERACIONES' : 'SEGUIMIENTO EN TIEMPO REAL'}
            </p>
            <h2>
              {isAnalyst
                ? 'Mis operaciones activas'
                : 'Operaciones activas de la flota'}
            </h2>
          </div>
          <span className={styles.chartNote}>
            Últimos 50 registros activos
          </span>
        </div>

        <ActiveDispatchesTable
          dispatches={data.activeDispatches}
          filters={filters}
          onFiltersChange={setFilters}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </section>

      {isAnalyst && <CriticalAlerts data={data} />}

      <div className={styles.refreshFooter}>
        <span>
          <Activity size={14} aria-hidden="true" />
          Los indicadores reflejan los datos registrados para tu perfil.
        </span>
        <button
          type="button"
          className={styles.refreshButton}
          disabled={isRefetching}
          onClick={() => void refresh()}
        >
          <RefreshCw
            size={14}
            className={isRefetching ? styles.refreshing : undefined}
            aria-hidden="true"
          />
          Actualizar
        </button>
      </div>
    </div>
  );
}

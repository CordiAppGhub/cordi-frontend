'use client';

import { useMemo } from 'react';
import { DashboardSummary } from '@/types/dashboard-types';
import styles from '../dashboard.module.css';

const TYPE_LABELS: Record<string, string> = {
  EXPORTACION: 'Exportación',
  IMPORTACION: 'Importación',
  RETIRO_VACIO: 'Retiro de vacío',
  DEVOLUCION: 'Devolución',
  DESVIO: 'Desvíos',
  INSPECCION: 'Inspecciones',
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  IN_TRANSIT: 'En ruta',
  MAINTENANCE: 'Mantenimiento',
  OUT_OF_SERVICE: 'Fuera de servicio',
  CREADO: 'Sin asignar',
  PROGRAMADO: 'Programado',
  PENDIENTE: 'Pendiente',
  ASIGNADO: 'Asignado',
  EN_CURSO: 'En curso',
  PAUSADA: 'Pausado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#15936a',
  IN_TRANSIT: '#3978e5',
  MAINTENANCE: '#e1a337',
  OUT_OF_SERVICE: '#d56662',
  CREADO: '#96a2b3',
  PROGRAMADO: '#8a70ce',
  PENDIENTE: '#e1a337',
  ASIGNADO: '#4092ce',
  EN_CURSO: '#15936a',
  PAUSADA: '#d56662',
  FINALIZADO: '#15936a',
  CANCELADO: '#98a2b3',
};

const currencyCompact = new Intl.NumberFormat('es-CO', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

interface Props {
  data: DashboardSummary;
  showFleet: boolean;
}

export function AnalyticsCharts({ data, showFleet }: Props) {
  const { trend, operationTypes } = data.analytics;
  const maxTrips = Math.max(1, ...trend.map((point) => point.totalTrips));
  const maxRevenue = Math.max(
    1,
    ...trend.map((point) => point.invoicedRevenue),
  );
  const tripAxisStep = maxTrips <= 4 ? 1 : Math.ceil(maxTrips / 4);
  const tripAxisMax = Math.ceil(maxTrips / tripAxisStep) * tripAxisStep;
  const tripTicks = Array.from(
    { length: tripAxisMax / tripAxisStep + 1 },
    (_, index) => tripAxisMax - index * tripAxisStep,
  );
  const gridIntervals = tripTicks.length - 1;
  const chartWidth = 640;
  const chartHeight = 232;
  const left = 39;
  const right = 39;
  const top = 19;
  const bottom = 31;
  const innerWidth = chartWidth - left - right;
  const innerHeight = chartHeight - top - bottom;
  const pointSpacing = innerWidth / trend.length;
  const revenuePoints = trend
    .map((point, index) => {
      const x = left + pointSpacing * (index + 0.5);
      const y = top + innerHeight * (1 - point.invoicedRevenue / maxRevenue);
      return `${x},${y}`;
    })
    .join(' ');

  const operationTypesSorted = useMemo(
    () => [...operationTypes].sort((a, b) => b.count - a.count),
    [operationTypes],
  );
  const maxOperations = Math.max(
    1,
    ...operationTypesSorted.map((item) => item.count),
  );
  const vehicleStatuses = data.analytics.fleetStatus.filter((item) =>
    ['AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE', 'OUT_OF_SERVICE'].includes(
      item.status,
    ),
  );
  const operationStatuses = Object.entries(
    data.analytics.current.statusCounts,
  )
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
  const maxOperationStatus = Math.max(
    1,
    ...operationStatuses.map((item) => item.count),
  );
  const maxFleetStatus = Math.max(1, ...vehicleStatuses.map((item) => item.count));

  return (
    <div className={styles.chartsGrid}>
      <section className={styles.chartCard}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>EVOLUCIÓN DEL PERÍODO</p>
            <h2>Viajes y facturación</h2>
          </div>
          <span className={styles.chartNote}>Facturación en COP</span>
        </div>

        {trend.length > 0 ? (
          <>
            <div className={styles.chartLegend}>
              <span>
                <i className={styles.tripLegend} /> Viajes creados
              </span>
              <span>
                <i className={styles.revenueLegend} /> Facturación
              </span>
            </div>
            <div className={styles.chartScroll}>
              <svg
                className={styles.trendChart}
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label="Gráfica de viajes creados y facturación en cada intervalo del período seleccionado"
              >
                <title>
                  Viajes y facturación por intervalo. La línea verde usa la
                  escala derecha.
                </title>
                {tripTicks.map((tripTick, index) => {
                  const ratio = index / gridIntervals;
                  return (
                    <g key={tripTick}>
                      <line
                        x1={left}
                        x2={chartWidth - right}
                        y1={top + innerHeight * ratio}
                        y2={top + innerHeight * ratio}
                        className={styles.chartGridLine}
                      />
                      <text
                        x={left - 8}
                        y={top + innerHeight * ratio + 4}
                        textAnchor="end"
                        className={styles.chartAxisText}
                      >
                        {tripTick}
                      </text>
                      <text
                        x={chartWidth - right + 8}
                        y={top + innerHeight * ratio + 4}
                        textAnchor="start"
                        className={styles.chartAxisText}
                      >
                        {currencyCompact.format(maxRevenue * (1 - ratio))}
                      </text>
                    </g>
                  );
                })}
                {trend.map((point, index) => {
                  const x = left + pointSpacing * index + pointSpacing * 0.2;
                  const width = pointSpacing * 0.48;
                  const height =
                    innerHeight * (point.totalTrips / tripAxisMax);
                  return (
                    <g key={point.startDate}>
                      <rect
                        x={x}
                        y={top + innerHeight - height}
                        width={width}
                        height={Math.max(height, 1)}
                        rx={4}
                        className={styles.tripBar}
                      >
                        <title>
                          {point.label}: {point.totalTrips} viajes
                        </title>
                      </rect>
                      <text
                        x={left + pointSpacing * (index + 0.5)}
                        y={chartHeight - 8}
                        textAnchor="middle"
                        className={styles.chartAxisText}
                      >
                        {point.label}
                      </text>
                    </g>
                  );
                })}
                {trend.length > 1 && (
                  <polyline
                    points={revenuePoints}
                    fill="none"
                    className={styles.revenueLine}
                  />
                )}
                {trend.map((point, index) => {
                  const x = left + pointSpacing * (index + 0.5);
                  const y =
                    top + innerHeight * (1 - point.invoicedRevenue / maxRevenue);
                  return (
                    <circle
                      key={point.endDate}
                      cx={x}
                      cy={y}
                      r={4}
                      className={styles.revenueDot}
                    >
                      <title>
                        {point.label}: facturación{' '}
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          maximumFractionDigits: 0,
                        }).format(point.invoicedRevenue)}
                      </title>
                    </circle>
                  );
                })}
              </svg>
            </div>
          </>
        ) : (
          <p className={styles.emptyState}>
            No hay viajes registrados en este período.
          </p>
        )}
      </section>

      <section className={styles.chartCard}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>DISTRIBUCIÓN</p>
            <h2>Tipo de operación</h2>
          </div>
          <span className={styles.chartNote}>
            {data.analytics.current.totalTrips} viajes
          </span>
        </div>

        {operationTypesSorted.length > 0 ? (
          <div className={styles.breakdownList}>
            {operationTypesSorted.map((item) => (
              <div className={styles.breakdownItem} key={item.type}>
                <div className={styles.breakdownLabel}>
                  <span>{TYPE_LABELS[item.type] ?? item.type}</span>
                  <strong>{item.count}</strong>
                </div>
                <div
                  className={styles.breakdownTrack}
                  role="progressbar"
                  aria-label={TYPE_LABELS[item.type] ?? item.type}
                  aria-valuenow={item.count}
                  aria-valuemin={0}
                  aria-valuemax={maxOperations}
                >
                  <span
                    className={styles.breakdownFill}
                    style={{
                      width: `${(item.count / maxOperations) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>
            No hay operaciones registradas en este período.
          </p>
        )}
      </section>

      <section className={styles.chartCard}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>ESTADO DE LOS VIAJES</p>
            <h2>Estado operativo</h2>
          </div>
          <span className={styles.chartNote}>
            {data.analytics.current.totalTrips} viajes
          </span>
        </div>

        {operationStatuses.length > 0 ? (
          <div className={styles.breakdownList}>
            {operationStatuses.map((item) => (
              <div className={styles.breakdownItem} key={item.status}>
                <div className={styles.breakdownLabel}>
                  <span className={styles.statusLabel}>
                    <i
                      className={styles.statusDot}
                      style={{
                        backgroundColor:
                          STATUS_COLORS[item.status] ?? '#98a2b3',
                      }}
                    />
                    {STATUS_LABELS[item.status] ?? item.status}
                  </span>
                  <strong>{item.count}</strong>
                </div>
                <div
                  className={styles.breakdownTrack}
                  role="progressbar"
                  aria-label={STATUS_LABELS[item.status] ?? item.status}
                  aria-valuenow={item.count}
                  aria-valuemin={0}
                  aria-valuemax={maxOperationStatus}
                >
                  <span
                    className={styles.statusFill}
                    style={{
                      width: `${(item.count / maxOperationStatus) * 100}%`,
                      backgroundColor:
                        STATUS_COLORS[item.status] ?? '#98a2b3',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>
            No hay viajes registrados en este período.
          </p>
        )}
      </section>

      {showFleet && (
        <section className={styles.chartCard}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>DISPONIBILIDAD VEHICULAR</p>
              <h2>Estado de la flota</h2>
            </div>
            <span className={styles.chartNote}>{data.flota.total} vehículos</span>
          </div>

          {vehicleStatuses.length > 0 ? (
            <div className={styles.breakdownList}>
              {vehicleStatuses.map((item) => (
                <div className={styles.breakdownItem} key={item.status}>
                  <div className={styles.breakdownLabel}>
                    <span className={styles.statusLabel}>
                      <i
                        className={styles.statusDot}
                        style={{
                          backgroundColor:
                            STATUS_COLORS[item.status] ?? '#98a2b3',
                        }}
                      />
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                    <strong>{item.count}</strong>
                  </div>
                  <div
                    className={styles.breakdownTrack}
                    role="progressbar"
                    aria-label={STATUS_LABELS[item.status] ?? item.status}
                    aria-valuenow={item.count}
                    aria-valuemin={0}
                    aria-valuemax={maxFleetStatus}
                  >
                    <span
                      className={styles.statusFill}
                      style={{
                        width: `${(item.count / maxFleetStatus) * 100}%`,
                        backgroundColor:
                          STATUS_COLORS[item.status] ?? '#98a2b3',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>No hay vehículos registrados.</p>
          )}
        </section>
      )}
    </div>
  );
}

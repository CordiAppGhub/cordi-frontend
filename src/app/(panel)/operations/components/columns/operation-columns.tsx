import React from 'react';
import { ColumnDef } from '@/types/table';
import { Operation } from '@/types/operation-types';
import styles from '../../operations.module.css';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';
import { formatLocationLabel } from '@/utils/location';
import {
  Calendar,
  Truck,
  User,
  MapPin,
  AlertTriangle,
  Eye,
  RefreshCw,
  BadgeDollarSign,
  PackagePlus,
  Power,
  Ban,
  Unlink,
  Trash2,
} from 'lucide-react';

export const getOperationsColumns = (
  setTraceabilityId: (id: number) => void, // Puedes eliminar esto de tu vista si ya migraste 100% a setTraceContext
  onAddSurcharge: (id: number, hasPendingDriverReport: boolean) => void,
  onEditOperation: (row: Operation) => void,
  setTraceContext: (context: { type: 'OPERATION' | 'CONTAINER' | 'ANALYST' | 'DRIVER' | 'VEHICLE'; id: string | number }) => void,
  onSetDriverAccess: (id: number, isActive: boolean) => void,
  canManageDriverAccess: boolean,
  isSettingDriverAccess: boolean,
  onReassign: (operation: Operation) => void,
  canReassign: boolean,
  onReportNovedad: (operation: Operation) => void,
  onCancelOperation: (operationId: number) => void,
  canCancelOperations: boolean,
  isCancellingOperation: boolean,
  onUnassignOperation: (operation: Operation) => void,
  canUnassignOperations: boolean,
  isUnassigningOperation: boolean,
  onDeleteOperation: (operation: Operation) => void,
  canDeleteOperation: boolean,
  isDeletingOperation: boolean,
  isAnalyst = false,
): ColumnDef<Operation>[] => {
  return [
    {
      id: 'numeroPedido',
      header: 'N.º Pedido / Booking',
      type: 'text',
      renderCell: (row) => {
        const orderNumber = row.numeroPedido?.trim();
        return (
          <button
            type="button"
            onClick={() => setTraceContext({ type: 'OPERATION', id: row.id })}
            title={orderNumber || 'Sin registrar'}
            aria-label={`Ver trazabilidad del pedido ${orderNumber || 'sin registrar'}, operación ${row.id}`}
            className={styles.orderNumberBadge}
            style={{
              padding: '4px 8px',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <strong>{orderNumber || 'Sin registrar'}</strong>
          </button>
        );
      },
    },
    {
      id: 'type',
      header: 'Operación / Unidad',
      type: 'text',
      renderCell: (row) => {
        const unitDetails = row.isContainerized ? (
          <>
            <span
              className={`${styles.containerUnitBadge} ${
                row.containerNumber ? '' : styles.containerUnitPending
              }`}
              style={{
                background: row.containerNumber ? undefined : '#fef3c7',
                color: row.containerNumber ? undefined : '#92400e',
              }}
            >
              {row.containerNumber || 'Pendiente'}
            </span>
            {row.containerType && <span>· {row.containerType}</span>}
          </>
        ) : (
          <span style={{ color: '#92400e' }}>
            Carga suelta
            {row.packageCount != null
              ? ` · ${row.packageCount} bultos`
              : row.weight != null
                ? ` · ${Number(row.weight).toLocaleString('es-CO')} kg`
                : ''}
          </span>
        );

        return (
          <div className={styles.operationUnitCell}>
            <strong className={styles.operationTypeText}>
              {row.type.replace(/_/g, ' ')}
              {row.isAnticipada ? ' · ANTICIPADA' : ''}
            </strong>
            <div className={styles.operationUnitDetails}>
              {unitDetails}
            </div>
          </div>
        );
      },
    },
    {
      id: 'tipoCarga',
      header: 'Tipo de carga',
      type: 'text',
      renderCell: (row) => {
        const isContainerized =
          row.tipoCarga === 'CONTENERIZADA' || row.isContainerized;
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: isContainerized ? '#e0f2fe' : '#fef3c7',
              color: isContainerized ? '#0369a1' : '#b45309',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {isContainerized ? 'Contenerizada' : 'Suelta'}
          </span>
        );
      },
    },
    {
      id: 'scheduledAt',
      header: 'Fecha Prog.',
      type: 'text',
      renderCell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '0.875rem' }}>
          <Calendar size={14} style={{ color: '#94a3b8' }} />
          <span>{row.scheduledAt ? new Date(row.scheduledAt).toLocaleDateString('es-CO') : '--'}</span>
        </div>
      ),
    },
    {
      id: 'vehicle',
      header: 'Placa / Conductor',
      type: 'text',
      renderCell: (row) => {
        const isMaintenance = row.vehicle?.status === 'MAINTENANCE';

        return (
          <div className={styles.vehicleAssignmentCell}>
            <button
              type="button"
              onClick={() => row.vehicleId && setTraceContext({ type: 'VEHICLE', id: row.vehicleId })}
              disabled={!row.vehicleId}
              className={styles.vehiclePlateBadge}
              style={{
                color: isMaintenance ? '#b91c1c' : '#2563eb',
                backgroundColor: isMaintenance ? '#fee2e2' : '#f1f5f9',
                border: `1px solid ${isMaintenance ? '#f87171' : '#cbd5e1'}`,
                cursor: row.vehicleId ? 'pointer' : 'default',
                textDecoration: row.vehicleId ? 'underline' : 'none'
              }}
            >
              <Truck size={12} />
              {row.vehicle?.plate || 'SIN ASIGNAR'}
            </button>

            {/* 🚀 CONDUCTOR CLICABLE PARA TRAZABILIDAD DE DRIVER */}
            <button
              type="button"
              onClick={() => row.driverId && setTraceContext({ type: 'DRIVER', id: row.driverId })}
              disabled={!row.driverId}
              title={row.driverId ? "Ver perfil y trazabilidad del conductor" : ""}
              className={styles.driverNameButton}
              style={{
                color: row.driverId ? '#2563eb' : '#94a3b8',
                cursor: row.driverId ? 'pointer' : 'default',
                textDecoration: row.driverId ? 'underline' : 'none',
                transition: 'color 0.2s'
              }}
            >
              <User size={12} />
              <span className={styles.driverNameText}>
                {row.driver?.name || 'Pendiente'}
              </span>
            </button>
          </div>
        );
      }
    },
    {
      id: 'origen',
      header: 'Origen',
      type: 'text',
      renderCell: (row) => {
        const location = row.origen ? formatLocationLabel(row.origen) : '--';
        return (
          <div className={styles.operationLocationCell} title={location}>
            <MapPin size={14} style={{ flex: 'none', color: '#cbd5e1', marginTop: '2px' }} />
            <span className={styles.operationLocationText}>{location}</span>
          </div>
        );
      },
    },
    {
      id: 'lugarDescargue',
      header: 'Destino',
      type: 'text',
      renderCell: (row) => {
        const location = row.descargue || row.cargue || row.destino;
        const locationLabel = location ? formatLocationLabel(location) : '--';
        return (
          <div className={styles.operationLocationCell} title={locationLabel}>
            <MapPin size={14} style={{ flex: 'none', color: '#3b82f6', marginTop: '2px' }} />
            <span className={styles.operationLocationText}>{locationLabel}</span>
          </div>
        );
      },
    },
    {
      id: 'fechasOperativas',
      header: 'Citas y Tiempos',
      type: 'text',
      renderCell: (row) => {
        const hasCitaOrigen =
          row.type !== 'NACIONAL' && Boolean(row.fechaCitaOrigen);
        const hasCitaDestino =
          row.type !== 'NACIONAL' && Boolean(row.fechaCitaDestino);
        const hasRetiro = row.isContainerized === true && Boolean(row.fechaRetiro);

        if (!hasCitaOrigen && !hasCitaDestino && !hasRetiro) {
          return <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>--</span>;
        }

        const formatShortDate = (dateString: string) => {
          return new Date(dateString).toLocaleString('es-CO', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: '#475569' }}>
            {hasCitaOrigen && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <strong style={{ color: '#0f172a', minWidth: '45px' }}>Origen:</strong>
                <span>{formatShortDate(row.fechaCitaOrigen!)}</span>
              </div>
            )}
            {hasCitaDestino && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <strong style={{ color: '#0f172a', minWidth: '45px' }}>Destino:</strong>
                <span>{formatShortDate(row.fechaCitaDestino!)}</span>
              </div>
            )}
            {hasRetiro && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <strong style={{ color: '#ea580c', minWidth: '45px' }}>Retiro:</strong>
                <span style={{ color: '#ea580c', fontWeight: 500 }}>{formatShortDate(row.fechaRetiro!)}</span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      id: 'fleteACobrar',
      header: 'Flete a cobrar',
      type: 'text',
      renderCell: (row) => {
        const fare = row.fleteACobrarManual ?? row.fleteACobrar;
        return (
          <span style={{ color: fare == null ? '#94a3b8' : '#15803d', fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {fare == null ? 'Pendiente' : `$${Number(fare).toLocaleString('es-CO')}`}
            {row.fleteACobrarManual != null && (
              <small
                style={{
                  display: 'inline',
                  marginLeft: 4,
                  color: '#64748b',
                  fontSize: '10px',
                  fontWeight: 500,
                }}
              >
                Manual
              </small>
            )}
          </span>
        );
      },
    },
    {
      id: 'fleteAPagar',
      header: 'Flete a pagar',
      type: 'text',
      renderCell: (row) => (
        <span style={{ color: row.fleteAPagar == null ? '#94a3b8' : '#b45309', fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          {row.fleteAPagar == null ? 'Pendiente' : `$${Number(row.fleteAPagar).toLocaleString('es-CO')}`}
        </span>
      ),
    },
    {
      id: 'recargos',
      header: 'Recargos',
      type: 'text',
      renderCell: (row) => {
        const surcharges = (row.surcharges ?? []).filter(
          (surcharge) =>
            row.isContainerized === true || !surcharge.isPatioCharge,
        );
        return surcharges.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '140px' }}>
            {surcharges.map((surcharge) => (
              <div
                key={surcharge.id}
                title={surcharge.observations || surcharge.surcharge?.description}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  color: '#b45309',
                  fontSize: '0.75rem',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                <strong>{surcharge.surcharge?.name || surcharge.surchargeCode}</strong>
                <span>Venta: ${Number(surcharge.totalPrice).toLocaleString('es-CO')}</span>
                {Number(surcharge.costPrice) > 0 && (
                  <span style={{ color: '#b91c1c' }}>Costo: ${Number(surcharge.costPrice).toLocaleString('es-CO')}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <span style={{ color: '#94a3b8' }}>—</span>
        );
      },
    },
    {
      id: 'totalCobrosExtras',
      header: 'Total extras',
      type: 'text',
      renderCell: (row) => (
        <strong style={{ color: Number(row.totalCobrosExtras ?? 0) > 0 ? '#b45309' : '#94a3b8', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          {row.totalCobrosExtras == null || Number(row.totalCobrosExtras) === 0
            ? '—'
            : `$${Number(row.totalCobrosExtras).toLocaleString('es-CO')}`}
        </strong>
      ),
    },
    {
      id: 'totalFacturacion',
      header: 'Total cobro cliente',
      type: 'text',
      renderCell: (row) => {
        const hasFreight = row.fleteACobrarManual != null || row.fleteACobrar != null;
        return (
          <strong style={{ color: '#047857', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {row.totalFacturacion == null
              ? 'Pendiente'
              : hasFreight
                ? `$${Number(row.totalFacturacion).toLocaleString('es-CO')}`
                : `Solo Recargos · $${Number(row.totalFacturacion).toLocaleString('es-CO')}`}
          </strong>
        );
      },
    },
    {
      id: 'rentabilidad',
      header: 'Rentabilidad Bruta',
      type: 'text',
      renderCell: (row) => (
        <span
          style={{
            color:
              row.rentabilidadBruta === null || row.rentabilidadBruta === undefined
                ? '#94a3b8'
                : row.rentabilidadBruta >= 0
                  ? '#15803d'
                  : '#dc2626',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {row.rentabilidadBruta === null || row.rentabilidadBruta === undefined
            ? 'Pendiente'
            : `$${row.rentabilidadBruta.toLocaleString('es-CO')}`}
        </span>
      ),
    },
    {
      id: 'novedades',
      header: 'Novedad operativa',
      type: 'text',
      renderCell: (row) => {
        const issues = row.issues ?? [];
        return issues.length > 0 ? (
          <span style={{ color: '#b91c1c', fontWeight: 600, whiteSpace: 'nowrap' }}>
            <AlertTriangle size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {issues.length} reportada(s)
          </span>
        ) : (
          <span style={{ color: '#94a3b8' }}>Sin novedades</span>
        );
      },
    },
    {
      id: 'status',
      header: 'Estado',
      type: 'text',
      renderCell: (row) => {
        const tieneNovedades = Boolean(row.historialNovedades && row.historialNovedades.length > 0);
        const pendingExtraReports = row.driverExtraReports?.length ?? 0;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
            {tieneNovedades ? (
              <div style={{
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                padding: '4px 10px',
                borderRadius: '99px',
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 0 4px rgba(239,68,68,0.1)',
              }}>
                <AlertTriangle size={12} strokeWidth={3} />
                NOVEDAD
              </div>
            ) : (
              <StatusBadge status={row.status} />
            )}
            {pendingExtraReports > 0 && (
              <span
                style={{
                  backgroundColor: '#fff7ed',
                  color: '#c2410c',
                  border: '1px solid #fdba74',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertTriangle size={12} />
                {pendingExtraReports} COBRO(S) POR VALORAR
              </span>
            )}

            {row.status === 'EN_CURSO' && row.estadoViaje && (
              <span
                title="Último reporte del conductor"
                style={{
                  fontSize: '0.65rem',
                  color: '#475569',
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}
              >
                📍 {row.estadoViaje.replace(/_/g, ' ').toLowerCase()}
              </span>
            )}
          </div>
        );
      }
    },
    {
      id: 'acciones',
      header: 'Acciones',
      type: 'text',
      renderCell: (row: Operation) => {
        const hasFleetAssignment = Boolean(
          row.vehicleId || row.driverId || row.trailerId,
        );
        const hasFleetAssignmentHistory = Boolean(
          row.events?.some(
            (event) =>
              event.eventType === 'REASIGNACION_VEHICULO' ||
              event.eventType === 'REASIGNACION_CONDUCTOR',
          ),
        );
        const analystCanManageFleet =
          !isAnalyst || hasFleetAssignment || hasFleetAssignmentHistory;
        const isLooseForeignTradeOperation =
          (row.isContainerized === false || row.tipoCarga === 'SUELTA') &&
          ['IMPORTACION', 'EXPORTACION', 'EXPORTACION_ANTICIPADA'].includes(
            row.type,
          );
        const preExecutionStatus =
          [
            'CREADO',
            'PROGRAMADO',
            'PROGRAMADA',
            'PENDIENTE_PROGRAMACION',
            'LISTA_PARA_CARGUE',
            'ASIGNADO',
          ].includes(row.status) ||
          (isLooseForeignTradeOperation && row.status === 'PENDIENTE');
        return (
          <div className={styles.actionsContainer} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

            {canDeleteOperation && (
              <button
                type="button"
                onClick={() => onDeleteOperation(row)}
                disabled={isDeletingOperation}
                title="Eliminar operación permanentemente"
                aria-label={`Eliminar permanentemente la operación ${row.id}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '8px',
                  border: 'none', backgroundColor: '#fee2e2', color: '#b91c1c',
                  cursor: isDeletingOperation ? 'wait' : 'pointer',
                  opacity: isDeletingOperation ? 0.6 : 1,
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
            {canManageDriverAccess && row.driverId &&
              (row.status === 'ASIGNADO' || row.status === 'EN_CURSO') && (
                <button
                  type="button"
                  onClick={() => onSetDriverAccess(row.id, !row.isActive)}
                  disabled={isSettingDriverAccess}
                  title={
                    row.isActive
                      ? 'Desactivar operación si el conductor aún no ha iniciado pasos'
                      : 'Activar operación para el conductor'
                  }
                  aria-label={
                    row.isActive
                      ? `Deshabilitar operación ${row.id} para el conductor`
                      : `Habilitar operación ${row.id} para el conductor`
                  }
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '6px', minWidth: '92px', height: '32px', padding: '0 8px',
                    borderRadius: '8px', border: 'none',
                    backgroundColor: row.isActive ? '#dcfce7' : '#fee2e2',
                    color: row.isActive ? '#15803d' : '#b91c1c',
                    cursor: isSettingDriverAccess ? 'not-allowed' : 'pointer',
                    opacity: isSettingDriverAccess ? 0.6 : 1,
                  }}
                >
                  <Power size={16} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                    {row.isActive ? 'Desactivar' : 'Activar'}
                  </span>
                </button>
              )}

            {row.status !== 'FINALIZADO' && row.status !== 'CANCELADO' && (
            <button
              onClick={() => onEditOperation(row)}
              title="Completar / Editar Datos de Operación"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                backgroundColor: '#f3e8ff', color: '#9333ea',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <PackagePlus size={16} />
            </button>
            )}

            {canReassign &&
              analystCanManageFleet &&
              preExecutionStatus && (
                <span
                  className={styles.assignTooltipWrapper}
                  data-tooltip={
                    !row.scheduledAt
                      ? 'Falta fecha de programación'
                      : undefined
                  }
                  title={
                    !row.scheduledAt
                      ? 'Falta fecha de programación'
                      : undefined
                  }
                >
                  <button
                    type="button"
                    onClick={() => onReassign(row)}
                    disabled={!row.scheduledAt}
                    title={
                      row.scheduledAt
                        ? hasFleetAssignment
                          ? 'Reasignar flota'
                          : 'Asignar flota anteriormente desvinculada'
                        : undefined
                    }
                    aria-label={
                      !row.scheduledAt
                        ? `No se puede asignar flota a la operación ${row.id}: falta la fecha de programación`
                        : `${hasFleetAssignment ? 'Reasignar flota de' : 'Asignar flota a'} la operación ${row.id}`
                    }
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '5px', width: 'auto', minHeight: '32px', padding: '0 8px',
                      borderRadius: '8px', border: 'none',
                      backgroundColor: '#eff6ff', color: '#2563eb',
                      cursor: row.scheduledAt ? 'pointer' : 'not-allowed',
                      opacity: row.scheduledAt ? 1 : 0.55,
                      transition: 'all 0.2s', whiteSpace: 'nowrap',
                      fontSize: '0.7rem', fontWeight: 700,
                    }}
                  >
                    <RefreshCw size={16} strokeWidth={2.5} />
                    <span>
                      {hasFleetAssignment ? 'Reasignar Flota' : 'Asignar Flota'}
                    </span>
                  </button>
                </span>
              )}

            {canCancelOperations &&
              ['CREADO', 'PROGRAMADO', 'ASIGNADO'].includes(row.status) && (
                <button
                  type="button"
                  onClick={() => onCancelOperation(row.id)}
                  disabled={isCancellingOperation}
                  title="Cancelar operación"
                  aria-label={`Cancelar operación ${row.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#fef2f2', color: '#b91c1c',
                    cursor: isCancellingOperation ? 'wait' : 'pointer',
                    opacity: isCancellingOperation ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <Ban size={16} />
                </button>
              )}

            {canUnassignOperations &&
              hasFleetAssignment &&
              row.status === 'ASIGNADO' && (
              <button
                type="button"
                onClick={() => onUnassignOperation(row)}
                disabled={isUnassigningOperation}
                title="Quitar asignación de vehículo, conductor y remolque"
                aria-label={`Quitar asignación de recursos de la operación ${row.id}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#fee2e2', color: '#b91c1c',
                  cursor: isUnassigningOperation ? 'wait' : 'pointer',
                  opacity: isUnassigningOperation ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <Unlink size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={() => onReportNovedad(row)}
              title="Reportar novedad de esta operación, conductor o vehículo"
              aria-label={`Reportar novedad para operación ${row.id}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                backgroundColor: '#fff7ed', color: '#c2410c',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <AlertTriangle size={16} />
            </button>

            {/* 🚀 BOTÓN DEL OJO CONECTADO A SET_TRACE_CONTEXT */}
            <button
              onClick={() => setTraceContext({ type: 'OPERATION', id: row.id })}
              title="Ver Trazabilidad de la Operación"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                backgroundColor: '#f8fafc', color: '#475569',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <Eye size={16} />
            </button>

            <button
              onClick={() =>
                onAddSurcharge(row.id, (row.driverExtraReports?.length ?? 0) > 0)
              }
              title={
                row.driverExtraReports?.length
                  ? `Valorar: ${row.driverExtraReports[0]?.concept?.name ?? row.driverExtraReports[0]?.conceptCode ?? 'Novedad reportada'}`
                  : 'Añadir Recargo Financiero'
              }
              aria-label={
                row.driverExtraReports?.length
                  ? `Valorar ${row.driverExtraReports[0]?.concept?.name ?? row.driverExtraReports[0]?.conceptCode ?? 'novedad reportada'}`
                  : 'Añadir recargo financiero'
              }
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 'auto', maxWidth: '180px', height: '32px', padding: '0 8px', gap: 5, borderRadius: '8px', border: 'none',
                backgroundColor: '#fffbeb', color: '#d97706',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <BadgeDollarSign size={16} />
              {(row.driverExtraReports?.length ?? 0) > 0 && (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.driverExtraReports?.[0]?.concept?.name ??
                    row.driverExtraReports?.[0]?.conceptCode ??
                    'Novedad'}
                </span>
              )}
            </button>
          </div>
        );
      },
    },
  ];
};
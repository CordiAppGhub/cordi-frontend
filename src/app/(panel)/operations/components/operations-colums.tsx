import React from 'react';
import { ColumnDef } from '@/types/table';
import { Operation } from '@/types/operation-types';
import styles from '../operations.module.css';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';
import { formatLocationLabel } from '@/utils/location';
import {
  Building2,
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
  Trash2,
} from 'lucide-react';

export const getOperationsColumns = (
  setTraceabilityId: (id: number) => void, // Puedes eliminar esto de tu vista si ya migraste 100% a setTraceContext
  onAddSurcharge: (id: number) => void,
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
  onDeleteOperation: (operationId: number) => void,
  canDeleteOperations: boolean,
  isDeletingOperation: boolean,
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
            title={`Ver detalles y trazabilidad de la operación ${row.id}`}
            aria-label={`Ver trazabilidad del pedido ${orderNumber || 'sin registrar'}, operación ${row.id}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '3px',
              padding: '6px 10px',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <strong style={{ fontSize: '0.875rem' }}>{orderNumber || 'Sin registrar'}</strong>

          </button>
        );
      },
    },
    {
      id: 'type',
      header: 'Operación / Cliente',
      type: 'text',
      renderCell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <strong style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 600 }}>
            {row.type}
          </strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.75rem' }}>
            <Building2 size={12} />
            <span>{row.client?.razonSocial || 'Sin Cliente asignado'}</span>
          </div>
        </div>
      )
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => row.vehicleId && setTraceContext({ type: 'VEHICLE', id: row.vehicleId })}
              disabled={!row.vehicleId}
              style={{
                fontWeight: 700, fontSize: '0.75rem',
                color: isMaintenance ? '#b91c1c' : '#2563eb',
                backgroundColor: isMaintenance ? '#fee2e2' : '#f1f5f9',
                border: `1px solid ${isMaintenance ? '#f87171' : '#cbd5e1'}`,
                padding: '2px 8px', borderRadius: '6px',
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                cursor: row.vehicleId ? 'pointer' : 'default',
                textDecoration: row.vehicleId ? 'underline' : 'none'
              }}
            >
              <Truck size={12} />
              {row.vehicle?.plate || 'SIN ASIGNAR'}
            </button>

            {/* 🚀 CONDUCTOR CLICABLE PARA TRAZABILIDAD DE DRIVER */}
            <button
              onClick={() => row.driverId && setTraceContext({ type: 'DRIVER', id: row.driverId })}
              disabled={!row.driverId}
              title={row.driverId ? "Ver perfil y trazabilidad del conductor" : ""}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem',
                background: 'none', border: 'none', padding: 0,
                color: row.driverId ? '#2563eb' : '#94a3b8',
                cursor: row.driverId ? 'pointer' : 'default',
                textDecoration: row.driverId ? 'underline' : 'none',
                transition: 'color 0.2s'
              }}
            >
              <User size={12} />
              <span>{row.driver?.name || 'Pendiente'}</span>
            </button>
          </div>
        );
      }
    },
    {
      id: 'origen',
      header: 'Origen',
      type: 'text',
      renderCell: (row) => (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.875rem', color: '#334155' }}>
          <MapPin size={14} style={{ color: '#cbd5e1', marginTop: '2px' }} />
          <span style={{ lineHeight: 1.2 }}>{row.origen ? formatLocationLabel(row.origen) : '--'}</span>
        </div>
      )
    },
    {
      id: 'lugarDescargue',
      header: 'Destino',
      type: 'text',
      renderCell: (row) => {
        const location = row.descargue || row.cargue || row.destino;
        return (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.875rem', color: '#334155' }}>
            <MapPin size={14} style={{ color: '#3b82f6', marginTop: '2px' }} />
            <span style={{ lineHeight: 1.2 }}>{location ? formatLocationLabel(location) : '--'}</span>
          </div>
        );
      },
    },
    {
      id: 'fechasOperativas',
      header: 'Citas y Tiempos',
      type: 'text',
      renderCell: (row) => {
        const hasCitaOrigen = Boolean(row.fechaCitaOrigen);
        const hasCitaDestino = Boolean(row.fechaCitaDestino);
        const hasRetiro = Boolean(row.fechaRetiro);
        const hasDevolucion = Boolean(row.fechaLimiteDevolucion);

        if (!hasCitaOrigen && !hasCitaDestino && !hasRetiro && !hasDevolucion) {
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
            {hasDevolucion && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <strong style={{ color: '#ea580c', minWidth: '45px' }}>Límite:</strong>
                <span style={{ color: '#ea580c', fontWeight: 500 }}>{formatShortDate(row.fechaLimiteDevolucion!)}</span>
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
            {row.fleteACobrarManual != null && <small style={{ display: 'block', color: '#64748b', fontWeight: 500 }}>Manual</small>}
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
      header: 'Recargos / Patio',
      type: 'text',
      renderCell: (row) => {
        const surcharges = row.surcharges ?? [];
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
      header: 'Total extra (Novedades/Patio)',
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
        return (
          <div className={styles.actionsContainer} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

            {canManageDriverAccess && row.driverId &&
              (row.status === 'ASIGNADO' || row.status === 'EN_CURSO') && (
                <button
                  type="button"
                  onClick={() => onSetDriverAccess(row.id, !row.isActive)}
                  disabled={isSettingDriverAccess || (row.status === 'EN_CURSO' && row.isActive)}
                  title={
                    row.status === 'EN_CURSO' && row.isActive
                      ? 'No se puede deshabilitar una operación en curso'
                      : row.isActive
                        ? 'Deshabilitar operación para el conductor'
                        : 'Habilitar operación para el conductor'
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
                    cursor: isSettingDriverAccess || (row.status === 'EN_CURSO' && row.isActive)
                      ? 'not-allowed'
                      : 'pointer',
                    opacity: isSettingDriverAccess || (row.status === 'EN_CURSO' && row.isActive)
                      ? 0.6
                      : 1,
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
              row.vehicleId &&
              row.status !== 'FINALIZADO' &&
              row.status !== 'CANCELADO' && (
                <button
                  type="button"
                  onClick={() => onReassign(row)}
                  title="Reasignar conductor o vehículo"
                  aria-label={`Reasignar recursos de la operación ${row.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#eff6ff', color: '#2563eb',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <RefreshCw size={16} strokeWidth={2.5} />
                </button>
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

            {canDeleteOperations && (
              <button
                type="button"
                onClick={() => onDeleteOperation(row.id)}
                disabled={isDeletingOperation}
                title="Eliminar operación permanentemente"
                aria-label={`Eliminar operación ${row.id}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#fee2e2', color: '#b91c1c',
                  cursor: isDeletingOperation ? 'wait' : 'pointer',
                  opacity: isDeletingOperation ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <Trash2 size={16} />
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
              onClick={() => onAddSurcharge(row.id)}
              title="Añadir Recargo Financiero"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                backgroundColor: '#fffbeb', color: '#d97706',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <BadgeDollarSign size={16} />
            </button>
          </div>
        );
      },
    },
  ];
};
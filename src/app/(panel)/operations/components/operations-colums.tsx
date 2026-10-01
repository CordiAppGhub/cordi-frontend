'use client';

import React from 'react';
import { ColumnDef } from '@/types/table';
import { Operation } from '@/types/operation-types';
import { Button } from '@/components/atoms/button/button';
import { useUIStore } from '@/store/use-ui.store';
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
  PlusCircle, 
  BadgeDollarSign 
} from 'lucide-react';

export const getOperationsColumns = (
  setTraceabilityId: (id: number) => void,
  onAddSurcharge: (id: number) => void
): ColumnDef<Operation>[] => {
  return [
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
      header: 'Flaca / Conductor',
      type: 'text',
      renderCell: (row) => {
        const isMaintenance = row.vehicle?.status === 'MAINTENANCE';
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* 🚀 Etiqueta estilo Placa de Vehículo */}
            <span style={{ 
              fontWeight: 700, 
              fontSize: '0.75rem',
              color: isMaintenance ? '#b91c1c' : '#1e293b',
              backgroundColor: isMaintenance ? '#fee2e2' : '#f1f5f9',
              border: `1px solid ${isMaintenance ? '#f87171' : '#cbd5e1'}`,
              padding: '2px 8px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              width: 'fit-content',
              letterSpacing: '0.5px'
            }}>
              <Truck size={12} />
              {row.vehicle?.plate || 'SIN ASIGNAR'}
            </span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: row.driver?.name ? '#475569' : '#94a3b8' }}>
              <User size={12} />
              <span>{row.driver?.name || 'Pendiente'}</span>
            </div>
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

        // Función rápida para formatear fechas a formato corto (Ej: 01/10 14:30)
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
      id: 'cobro',
      header: 'Facturación',
      type: 'text',
      renderCell: (row) => {
        const fleteBase = row.fleteCobro || 0;
        const totalRecargos = row.surcharges?.reduce((sum, surcharge) => sum + Number(surcharge.totalPrice), 0) || 0;
        const granTotalCobro = fleteBase + totalRecargos;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ fontWeight: 700, color: '#15803d', fontSize: '0.9rem' }}>
              ${granTotalCobro.toLocaleString('es-CO')}
            </span>
            {totalRecargos > 0 && (
              <span style={{ color: '#d97706', fontSize: '0.7rem', fontWeight: 600, lineHeight: '1.2' }}>
                Base: ${fleteBase.toLocaleString('es-CO')} <br/>
                Extras: +${totalRecargos.toLocaleString('es-CO')}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'pago',
      header: 'Pago Flota',
      type: 'text',
      renderCell: (row) => (
        <span style={{ 
          color: row.fletePago ? '#0f172a' : '#94a3b8', 
          fontWeight: 600, 
          fontSize: '0.875rem',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {row.fletePago ? `$${row.fletePago.toLocaleString('es-CO')}` : 'Pendiente'}
        </span>
      ),
    },
   {
      id: 'status',
      header: 'Estado',
      type: 'text',
      renderCell: (row) => {
        // Verificamos si tiene novedades activas
        const tieneNovedades = Boolean(row.novedadesHistorial && row.novedadesHistorial.length > 0);
        
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
        const { openAssignModal } = useUIStore.getState();
        
        return (
          <div className={styles.actionsContainer} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            
            <button
              onClick={() => openAssignModal(row.id)}
              disabled={row.status !== 'CREADO'}
              title={row.status === 'CREADO' ? 'Asignar Flota' : 'Ya asignado'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                backgroundColor: row.status === 'CREADO' ? '#eff6ff' : '#f1f5f9',
                color: row.status === 'CREADO' ? '#2563eb' : '#cbd5e1',
                cursor: row.status === 'CREADO' ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              <PlusCircle size={16} strokeWidth={2.5} />
            </button>

            <button
              onClick={() => setTraceabilityId(row.id)}
              title="Ver Trazabilidad y Novedades"
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
'use client';

import React from 'react';
import { ColumnDef } from '@/types/table';
import { Operation } from '@/types/operation-types';
import { Button } from '@/components/atoms/button/button';
import { useUIStore } from '@/store/use-ui.store';
import styles from '../operations.module.css';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';

export const getOperationsColumns = (
  setTraceabilityId: (id: number) => void
): ColumnDef<Operation>[] => {
  return [
    {
      id: 'type',
      header: 'Tipo de Operación',
      type: 'text',
      renderCell: (row) => <strong style={{ color: '#1e293b' }}>{row.type}</strong>
    },
    {
      id: 'scheduledAt',
      header: 'Fecha Prog.',
      type: 'text',
      renderCell: (row) => (
        <span style={{ color: '#475569', fontSize: '0.9rem' }}>
          {row.scheduledAt ? new Date(row.scheduledAt).toLocaleDateString('es-CO') : '--'}
        </span>
      ),
    },
    {
      id: 'vehicle',
      header: 'Placa',
      type: 'text',
      renderCell: (row) => {
        // Validación extra por si el backend mandó el vehículo a mantenimiento
        const isMaintenance = row.vehicle?.status === 'MAINTENANCE';
        
        return (
          <span style={{ 
            fontWeight: 600, 
            color: isMaintenance ? '#dc2626' : (row.vehicle?.plate ? '#0f172a' : '#94a3b8'),
            backgroundColor: isMaintenance ? '#fee2e2' : 'transparent',
            padding: isMaintenance ? '2px 6px' : '0',
            borderRadius: '4px'
          }}>
            {row.vehicle?.plate || 'Sin Asignar'} {isMaintenance && '🔧'}
          </span>
        );
      }
    },
    { id: 'origen', header: 'Origen', type: 'text', renderCell: (row) => row.origen?.name || '--' },
    {
      id: 'lugarCargue',
      header: 'Lugar de Cargue',
      type: 'text',
      renderCell: (row) => {
        const isExport = row.type === 'Ingreso de Exportación' || row.type === 'Exportación';
        return isExport && row.cargue?.name ? row.cargue.name : '--';
      },
    },
    {
      id: 'lugarDescargue',
      header: 'Lugar de Descargue',
      type: 'text',
      renderCell: (row) => {
        const isImport = row.type === 'Retiro de Importación' || row.type === 'Importación' || row.type === 'RETIRO_IMPORTACION';
        const nombreDescargue = row.cargue?.name || row.descargue?.name;
        return isImport && nombreDescargue ? nombreDescargue : '--';
      },
    },
    { id: 'destino', header: 'Destino', type: 'text', renderCell: (row) => row.destino?.name || '--' },
    
    // 🛡️ AQUÍ ESTÁ LA MAGIA DEL BADGE DE NOVEDAD
    {
      id: 'status',
      header: 'Estado',
      type: 'text',
      renderCell: (row) => {
        // Verificamos si viene en el nuevo arreglo O si quedó marcado en el string viejo
        const tieneNovedades = 
          (row.novedadesHistorial && row.novedadesHistorial.length > 0) || 
          (row.novedadesHistorial !== null && row.novedadesHistorial !== undefined);
        
        if (tieneNovedades) {
          // Intentamos sacar la severidad, si no la hay, asumimos HIGH por defecto
          const topSeverity = row.novedadesHistorial?.[0]?.severity || 'HIGH';
          
          return (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              padding: '6px 12px',
              borderRadius: '99px',
              fontSize: '0.75rem',
              fontWeight: 900,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: topSeverity === 'CRITICAL' ? '0 0 10px rgba(239,68,68,0.4)' : 'none',
              letterSpacing: '0.5px'
            }}>
              🚨 CON NOVEDAD
            </div>
          );
        }

        // Si no hay novedades, pintamos el Badge normal
        return <StatusBadge status={row.status} />;
      }
    },
    {
      id: 'driver',
      header: 'Conductor',
      type: 'text',
      renderCell: (row) => (
        <span style={{ color: row.driver?.name ? '#334155' : '#94a3b8' }}>
          {row.driver?.name || 'Sin asignar'}
        </span>
      )
    },
    {
      id: 'acciones',
      header: 'Acciones de Control',
      type: 'text',
      renderCell: (row: Operation) => {
        const { openAssignModal } = useUIStore.getState();
        
        return (
          <div className={styles.actionsContainer} style={{ display: 'flex', gap: '8px' }}>
            {row.status === 'CREADO' ? (
              <Button onClick={() => openAssignModal(row.id)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                Asignar
              </Button>
            ) : (
              <Button variant="secondary" disabled style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: 0.7 }}>
                Asignado
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => setTraceabilityId(row.id)}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              🔍 Trazabilidad
            </Button>
          </div>
        );
      },
    },
  ];
};
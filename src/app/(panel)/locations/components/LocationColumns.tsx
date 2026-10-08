'use client';

import React from 'react';
import { ColumnDef } from '@/types/table';
import { ClientLocationRelation, Locations } from '@/types/location.types';

export const getLocationColumns = (
  handleOpenEdit: (location: Locations) => void,
  deleteLocation: (id: number) => void,
): ColumnDef<Locations>[] => [
  {
    id: 'name',
    header: 'Ubicación / Instalación',
    type: 'text',
    renderCell: (row) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 0' }}>
        <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</span>
        {row.address && (
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>📍 {row.address}</span>
        )}
      </div>
    ),
  },
  {
    id: 'type',
    header: 'Tipo de Instalación',
    type: 'text',
    renderCell: (loc) => {
      const hasClients = loc.clients && loc.clients.length > 0;
      return (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {loc.isPort && <span style={{ padding: '2px 8px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Puerto</span>}
          {loc.isDepot && <span style={{ padding: '2px 8px', backgroundColor: '#fef3c7', color: '#b45309', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Patio</span>}
          {hasClients && <span style={{ padding: '2px 8px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{loc.clients && loc.clients.length} Cliente(s)</span>}
          {!loc.isPort && !loc.isDepot && !hasClients && <span style={{ fontSize: '11px', color: '#64748b' }}>Zona Neutra</span>}
        </div>
      );
    },
  },
  {
    id: 'routes',
    header: 'Rutas Permitidas',
    type: 'text',
    renderCell: (loc) => (
      <div style={{ fontSize: '12px', color: '#475569' }}>
        <div>{loc.isOrigin ? '✅ Origen' : '❌ Origen'}</div>
        <div>{loc.isDestination ? '✅ Destino' : '❌ Destino'}</div>
      </div>
    ),
  },
  {
    id: 'actions',
    header: 'Acciones',
    type: 'text',
    renderCell: (loc) => (
      <div style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={() => handleOpenEdit(loc)}
          style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
        >
          Editar
        </button>
        <button
          onClick={() => deleteLocation(loc.id)}
          style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
        >
          Eliminar
        </button>
      </div>
    ),
  },
];

// 🚀 Sub-columnas que se despliegan al hacer collapse en ubicaciones con clientes
export const getClientSubColumns = (): ColumnDef<ClientLocationRelation>[] => [
  {
    id: 'razonSocial',
    header: 'Cliente / Razón Social',
    type: 'text',
    renderCell: (item) => (
      <span style={{ fontWeight: 500, color: '#0f172a' }}>
        🏢 {item.razonSocial || 'Cliente'} <span style={{ color: '#64748b', fontSize: '12px' }}>({item.nit || 'N/A'})</span>
      </span>
    ),
  },
  {
    id: 'clientInstallationType',
    header: 'Tipo de Instalación',
    type: 'text',
    renderCell: (item) => (
      <div style={{ display: 'flex', gap: '6px' }}>
        {item.isClient && (
          <span style={{ padding: '2px 8px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
            Bodega / Sede
          </span>
        )}
        {item.isDepot && (
          <span style={{ padding: '2px 8px', backgroundColor: '#fef3c7', color: '#b45309', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
            Patio de Vacíos
          </span>
        )}
      </div>
    ),
  },
];
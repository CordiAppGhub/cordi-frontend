'use client';

import React from 'react';
import { ColumnDef } from '@/types/table';
import { Location } from '@/types/location.types';

export const getLocationColumns = (
  handleOpenEdit: (location: Location) => void,
  deleteLocation: (id: number) => void
): ColumnDef<Location>[] => [
  {
    id: 'name',
    header: 'Nombre',
    type: 'text',
    renderCell: (row) => <span style={{ fontWeight: '500' }}>{row.name}</span>,
  },
  {
    id: 'type',
    header: 'Tipo de Instalación',
    type: 'text',
    renderCell: (loc) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        {loc.isPort && <span style={{ padding: '2px 8px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '12px', fontSize: '12px' }}>Puerto</span>}
        {loc.isDepot && <span style={{ padding: '2px 8px', backgroundColor: '#fef3c7', color: '#b45309', borderRadius: '12px', fontSize: '12px' }}>Patio</span>}
        {loc.isClient && <span style={{ padding: '2px 8px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '12px', fontSize: '12px' }}>Bodega</span>}
      </div>
    ),
  },
  {
    id: 'routes',
    header: 'Rutas Permitidas',
    type: 'text',
    renderCell: (loc) => (
      <div style={{ fontSize: '13px' }}>
        {loc.isOrigin ? '✅ Origen' : '❌ Origen'}<br />
        {loc.isDestination ? '✅ Destino' : '❌ Destino'}
      </div>
    ),
  },
  {
    id: 'actions',
    header: 'Acciones',
    type: 'text',
    renderCell: (loc) => (
      <div style={{ textAlign: 'right' }}>
        <button 
          onClick={() => handleOpenEdit(loc)} 
          style={{ marginRight: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Editar
        </button>
        <button 
          onClick={() => deleteLocation(loc.id)} 
          style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Eliminar
        </button>
      </div>
    ),
  },
];
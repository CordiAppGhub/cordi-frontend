import React from 'react';
import { ColumnDef } from '@/types/table';
import { Vehicle } from '@/types/vehicles';
import { Button } from '@/components/atoms/button/button';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';

export const getVehicleColumns = (
  removeVehicle: (id: number) => void
  // onEdit: (vehicle: Vehicle) => void
): ColumnDef<Vehicle>[] => [
  { id: 'plate', header: 'Placa', type: 'text', renderCell: (row: Vehicle) => <strong style={{ color: '#0f172a' }}>{row.plate}</strong> },
  
  {
    id: 'ownershipType',
    header: 'Tipo de flota',
    type: 'text', 
    renderCell: (row: Vehicle) => {
      const isOwn = row.ownershipType === 'PROPIO';
      const label = isOwn ? 'Propia' : 'Externa';
      const color = isOwn ? '#16a34a' : '#64748b';
      return (
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color, background: `${color}15`, padding: '4px 8px', borderRadius: '4px' }}>
          {label}
        </span>
      );
    } 
  },

  { id: 'affiliation', header: 'Afiliación / Propietario', type: 'text', renderCell: (row: Vehicle) => row.affiliation || '--' },
  { id: 'brand', header: 'Marca', type: 'text', renderCell: (row: Vehicle) => row.brand || '--' },
  { id: 'cargoCapacity', header: 'Capacidad', type: 'text', renderCell: (row: Vehicle) => row.cargoCapacity || '--' },
  { id: 'status', header: 'Estado', type: 'text', renderCell: (row: Vehicle) => <StatusBadge status={row.status} /> },
  { id: 'soatExpiration', header: 'Venc. SOAT', type: 'text', renderCell: (row: Vehicle) => row.soatExpiration ? new Date(row.soatExpiration).toLocaleDateString() : '--' },
  {
    id: 'actions',
    header: 'Acciones',
    type: 'text',
    renderCell: (row: Vehicle) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button style={{ padding: '6px 10px', fontSize: '1rem', background: 'transparent', border: 'none' }} onClick={() => console.log('Editar', row.id)}>✏️</Button>
        <Button style={{ padding: '6px 10px', fontSize: '1rem', background: 'transparent', border: 'none' }} onClick={() => removeVehicle(row.id)}>🗑️</Button>
      </div>
    )
  }
];
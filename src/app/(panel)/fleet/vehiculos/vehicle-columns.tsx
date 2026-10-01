import React from 'react';
import { ColumnDef } from '@/types/table';
import { Vehicle } from '@/types/vehicles';
import { Button } from '@/components/atoms/button/button';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';

export const getVehicleColumns = (
  removeVehicle: (id: number) => void
  // onEdit: (vehicle: Vehicle) => void  <-- Descomenta esto cuando armes el modal de edición
): ColumnDef<Vehicle>[] => [
  { id: 'plate', header: 'Placa', type: 'text', renderCell: (row: Vehicle) => <strong style={{ color: '#0f172a' }}>{row.plate}</strong> },
  
  // 🚀 NUEVO: Etiqueta visual para la afiliación
  { 
    id: 'affiliation', 
    header: 'Afiliación', 
    type: 'text', 

    renderCell: (row: Vehicle) => {
      // Un pequeño mapeo para que se vea más profesional que el texto plano del ENUM
      const affiliationLabels: Record<string, string> = {
        CORDIVEHICULO: 'Propio (2%)',
        CORDIHUB: 'Afiliado (10%)',
        EXTERNAL: 'Externo'
      };
      
      const label = affiliationLabels[row.affiliation || 'EXTERNAL'];
      const colorMap: Record<string, string> = {
        CORDIVEHICULO: '#16a34a', // Verde
        CORDIHUB: '#2563eb', // Azul
        EXTERNAL: '#64748b' // Gris
      };
      
      return (
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: colorMap[row.affiliation || 'EXTERNAL'], background: `${colorMap[row.affiliation || 'EXTERNAL']}15`, padding: '4px 8px', borderRadius: '4px' }}>
          {label}
        </span>
      );
    } 
  },

  { id: 'empresa', header: 'Empresa', type: 'text', renderCell: (row: Vehicle) => row.empresa || '--' },
  { id: 'brand', header: 'Marca', type: 'text', renderCell: (row: Vehicle) => row.brand || '--' },
  { id: 'capacityWeight', header: 'Capacidad', type: 'text', renderCell: (row: Vehicle) => row.capacityWeight || '--' },
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
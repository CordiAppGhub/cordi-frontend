'use client';

import React from 'react';
import { ColumnDef } from '@/types/table';
import { Driver } from '@/types/drivers';
import { Button } from '@/components/atoms/button/button';

export const getDriverColumns = (
  onEdit: (driver: Driver) => void,
  disableDriver: (id: number, name: string | null) => void,
  onNavigateDetails: (id: number) => void
): ColumnDef<Driver>[] => [
  {
    id: 'name',
    header: 'Nombre del Conductor',
    type: 'text',
    isDraggable: false,
    renderCell: (row) => <strong className="text-slate-800">{row.name || '--'}</strong>
  },
  { id: 'cedula', header: 'Cédula', type: 'text', renderCell: (row) => row.cedula },
  { id: 'telefono', header: 'Teléfono', type: 'text', renderCell: (row) => row.telefono || '--' },
  {
    id: 'vehiculo',
    header: 'Vehículo Actual',
    type: 'text',
    renderCell: (row) => {
      return row.drivenVehicles && row.drivenVehicles.length > 0
        ? <span className="px-2 py-1 bg-slate-100 rounded text-slate-700">{row.drivenVehicles[0].plate}</span>
        : <span className="text-slate-400 italic">Sin Asignar</span>;
    }
  },
  {
    id: 'availability',
    header: 'Estado Operativo',
    type: 'text',
    renderCell: (row) => (
      row.isAvailable ? (
        <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold inline-flex items-center gap-1">
          🟢 Disponible
        </span>
      ) : (
        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold inline-flex items-center gap-1">
          🔴 En Ruta / Ocupado
        </span>
      )
    ),
  },
  {
    id: 'actions',
    header: 'Acciones',
    type: 'text',
    renderCell: (row) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button
          variant="secondary"
          title="Ver Detalles"
          onClick={() => onNavigateDetails(row.id)} 
          style={{ padding: '6px 10px', fontSize: '1rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
        >
          🔍
        </Button>
        <Button
          variant="secondary"
          title="Editar"
          onClick={() => onEdit(row)}
          style={{ padding: '6px 10px', fontSize: '1rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
        >
          ✏️
        </Button>
        <Button
          variant="secondary"
          title="Desactivar conductor"
          onClick={() => disableDriver(row.id, row.name)}
          style={{ padding: '6px 10px', fontSize: '1rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#dc2626' }}
        >
          🚫
        </Button>
      </div>
    )
  }
];
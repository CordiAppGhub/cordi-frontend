// src/app/driver/components/assignment-columns.tsx
'use client';

import React from 'react';
import { ColumnDef } from '@/types/table';
import { Assignment } from '@/types/assignmentAnlist';

export const getAssignmentColumns = (
  removeAssignment: (id: number) => void
): ColumnDef<Assignment>[] => [
  {
    id: 'analyst',
    header: 'Analista Responsable',
    type: 'text',
    renderCell: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#0f172a' }}>
        <span>👤 {row.analyst?.name || 'Analista no encontrado'}</span>
      </div>
    ),
  },
  {
    id: 'client',
    header: 'Cliente Corporativo',
    type: 'text',
    renderCell: (row) => (
      <span style={{ 
        fontSize: '0.8rem', 
        backgroundColor: '#e0f2fe', 
        color: '#0369a1', 
        padding: '4px 8px', 
        borderRadius: '6px', 
        fontWeight: 500,
        border: '1px solid #bae6fd'
      }}>
        🏢 {row.clientLocation?.client?.razonSocial || 'Cliente N/A'}
      </span>
    ),
  },
  {
    id: 'location',
    header: 'Ubicación / Instalación',
    type: 'text',
    renderCell: (row) => (
      <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 500 }}>
        📍 {row.clientLocation?.location?.name || 'Ubicación N/A'}
      </span>
    ),
  },
  {
    id: 'date',
    header: 'Fecha de Asignación',
    type: 'text',
    renderCell: (row) => (
      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
      </span>
    ),
  },
  {
    id: 'actions',
    header: 'Acciones',
    type: 'text',
    renderCell: (row) => (
      <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => removeAssignment(row.id)}
          style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' }}
        >
          Revocar Permiso
        </button>
      </div>
    ),
  },
];
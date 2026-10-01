'use client';

import React from 'react';
import { ColumnDef } from '@/types/table';
import { SurchargeCatalog } from '@/types/tariff-ypes';

export const getSurchargeColumns = (): ColumnDef<SurchargeCatalog>[] => [
  {
    id: 'code',
    header: 'Código Técnico',
    type: 'text',
    renderCell: (row) => (
      <span style={{ fontWeight: 600, color: '#475569', fontFamily: 'monospace' }}>
        {row.code}
      </span>
    ),
  },
  {
    id: 'name',
    header: 'Nombre de Novedad',
    type: 'text',
    renderCell: (row) => (
      <strong style={{ color: '#0f172a' }}>
        {row.name}
      </strong>
    ),
  },
  {
    id: 'applicableTo',
    header: 'Aplica A',
    type: 'text',
    renderCell: (row) => {
      const val = row.applicableTo;
      
      if (!val) {
        return <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No definido</span>;
      }

      return (
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '12px', 
          fontSize: '0.8rem', 
          fontWeight: 'bold',
          backgroundColor: val === 'AMBOS' ? '#f3e8ff' : val === 'IMPORTACION' ? '#dcfce7' : '#e0f2fe',
          color: val === 'AMBOS' ? '#7e22ce' : val === 'IMPORTACION' ? '#166534' : '#0369a1'
        }}>
          {val}
        </span>
      );
    },
  },
  {
    id: 'basePrice',
    header: 'Precio Base (COP)',
    type: 'text',
    renderCell: (row) => (
      <strong style={{ color: '#15803d', fontSize: '1.1rem' }}>
        ${Number(row.basePrice).toLocaleString('es-CO')}
      </strong>
    ),
  },
];
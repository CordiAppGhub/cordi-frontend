'use client';

import React from 'react';
import { ColumnDef } from '@/types/table';
import { SurchargeCatalog } from '@/types/tariff-ypes';
import { Button } from '@/components/atoms/button/button';

export type SurchargeCatalogRow = SurchargeCatalog & { id: string };

export const getSurchargeColumns = (
  onEdit: (surcharge: SurchargeCatalogRow) => void,
  onDelete: (surcharge: SurchargeCatalogRow) => void,
): ColumnDef<SurchargeCatalogRow>[] => [
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
    id: 'description',
    header: 'Descripción',
    type: 'text',
    renderCell: (row) => (
      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
        {row.description || 'El valor se define manualmente en cada operación'}
      </span>
    ),
  },
  {
    id: 'actions',
    header: 'Acciones',
    type: 'text',
    renderCell: (row) => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Button
          type="button"
          variant="secondary"
          onClick={(event) => {
            event.stopPropagation();
            onEdit(row);
          }}
        >
          Editar
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(row);
          }}
        >
          Eliminar
        </Button>
      </div>
    ),
  },
];
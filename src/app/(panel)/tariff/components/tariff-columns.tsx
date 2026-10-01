'use client';

import React from 'react';
import { ColumnDef } from '@/types/table';
import { formatLocationLabel } from '@/utils/location';
import { ClientTariff } from '@/types/tariff-ypes';

export const getTariffColumns = (): ColumnDef<ClientTariff>[] => [
  {
    id: 'client',
    header: 'Cliente Titular',
    type: 'text',
    renderCell: (row) => (
      <strong style={{ color: '#0f172a' }}>
        {row.client?.razonSocial || 'Desconocido'}
      </strong>
    ),
  },
  {
    id: 'operationType',
    header: 'Tipo Operación',
    type: 'text',
    renderCell: (row) => (
      <span style={{ 
        padding: '4px 8px', 
        backgroundColor: '#e0f2fe', 
        color: '#0369a1', 
        borderRadius: '12px', 
        fontSize: '0.8rem', 
        fontWeight: 600 
      }}>
        {row.operationType}
      </span>
    ),
  },
  {
    id: 'isAnticipada',
    header: 'Modalidad',
    type: 'text',
    renderCell: (row) => (
      row.isAnticipada ? (
        <span style={{ color: '#ea580c', fontWeight: 600 }}>Anticipado</span>
      ) : (
        <span style={{ color: '#16a34a', fontWeight: 600 }}>Directo</span>
      )
    ),
  },
  {
    id: 'location',
    header: 'Cobertura / Zona',
    type: 'text',
    renderCell: (row) => {
      if (row.location) {
        return (
          <span style={{ fontSize: '0.85rem' }}>
            📍 {formatLocationLabel(row.location)}
          </span>
        );
      }
      return (
        <span style={{ 
          padding: '4px 8px', 
          backgroundColor: '#f1f5f9', 
          color: '#475569', 
          borderRadius: '12px', 
          fontSize: '0.8rem' 
        }}>
          🌐 Tarifa Plana (Cualquier Zona)
        </span>
      );
    },
  },
  {
    id: 'price',
    header: 'Precio Facturación (COP)',
    type: 'text',
    renderCell: (row) => (
      <strong style={{ color: '#16a34a', fontSize: '1.1rem' }}>
        ${row.price.toLocaleString('es-CO')}
      </strong>
    ),
  },
];
'use client';

import React from 'react';
import { ColumnDef } from '@/types/table';
import { Client } from '@/types/client.-types';

export const getClientColumns = (
  handleOpenEdit: (client: Client) => void,
  deleteClient: (id: number) => void
): ColumnDef<Client>[] => [
  {
    id: 'razonSocial',
    header: 'Razón Social',
    type: 'text',
    renderCell: (row) => (
      <div>
        <div style={{ fontWeight: '600', color: '#1e293b' }}>{row.razonSocial}</div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>NIT: {row.nit}</div>
      </div>
    ),
  },
  {
    id: 'contact',
    header: 'Contacto Principal',
    type: 'text',
    renderCell: (row) => (
      <div style={{ fontSize: '13px', color: '#475569' }}>
        {row.contactName ? <strong>{row.contactName}</strong> : <span style={{ fontStyle: 'italic' }}>Sin contacto</span>}
        <br />
        {row.contactPhone || row.contactEmail ? `${row.contactPhone || ''} ${row.contactEmail ? ` | ${row.contactEmail}` : ''}` : ''}
      </div>
    ),
  },
  {
    id: 'status',
    header: 'Estado',
    type: 'text',
    renderCell: (row) => (
      <span style={{
        padding: '4px 10px',
        backgroundColor: row.isActive ? '#dcfce7' : '#fee2e2',
        color: row.isActive ? '#166534' : '#991b1b',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {row.isActive ? 'Activo' : 'Inactivo'}
      </span>
    ),
  },
  {
    id: 'actions',
    header: 'Acciones',
    type: 'text',
    renderCell: (row) => (
      <div style={{ textAlign: 'right' }}>
        <button onClick={() => handleOpenEdit(row)} style={{ marginRight: '16px', color: '#2563eb', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}>Editar</button>
        <button onClick={() => deleteClient(row.id)} style={{ color: '#dc2626', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
      </div>
    ),
  },
];
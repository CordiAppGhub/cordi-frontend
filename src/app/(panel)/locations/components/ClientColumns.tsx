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
    header: 'Ubicaciones / Sedes',
    id: 'locations',
    renderCell: (row: Client) => {
      const locations = row.locations || [];
      
      if (locations.length === 0) {
        return <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Sin ubicaciones</span>;
      }

      return (
        <details style={{ cursor: 'pointer', outline: 'none' }}>
          <summary style={{ 
            color: '#2563eb', 
            fontWeight: 600, 
            fontSize: '0.85rem',
            listStyle: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            📍 {locations.length} {locations.length === 1 ? 'sede' : 'sedes'} 
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>▼</span>
          </summary>
          
          <div style={{
            marginTop: '6px',
            padding: '8px 10px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            position: 'absolute',
            zIndex: 10,
            minWidth: '200px'
          }}>
            {locations.map((item) => (
              <div key={item.locationId} style={{ fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '3px' }}>
                <strong style={{ color: '#0f172a' }}>{item.location?.name}</strong>
                {item.location?.address && <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{item.location?.address}</div>}
              </div>
            ))}
          </div>
        </details>
      );
    },
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
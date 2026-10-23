'use client';

import React from 'react';
import { ColumnDef } from '@/types/table';
import { Assignment, AnalystAssignmentGroup } from '@/types/assignmentAnlist';

export const groupAssignmentsByAnalyst = (
  assignments: Assignment[],
): AnalystAssignmentGroup[] => {
  const groups = new Map<number, AnalystAssignmentGroup>();
  for (const item of assignments) {
    const group = groups.get(item.analystId) ?? {
      id: item.analystId,
      analystName: item.analyst?.name || 'Analista no encontrado',
      clients: [],
    };
    group.clients.push(item);
    groups.set(item.analystId, group);
  }
  return [...groups.values()].sort((a, b) =>
    a.analystName.localeCompare(b.analystName),
  );
};

export const getAnalystGroupColumns = (): ColumnDef<AnalystAssignmentGroup>[] => [
  {
    id: 'analyst',
    header: 'Analista Responsable',
    type: 'text',
    renderCell: (row) => (
      <span style={{ fontWeight: 600, color: '#0f172a' }}>👤 {row.analystName}</span>
    ),
  },
  {
    id: 'clients',
    header: 'Clientes asignados',
    type: 'text',
    renderCell: (row) => (
      <span
        style={{
          fontSize: '0.8rem',
          backgroundColor: '#e0f2fe',
          color: '#0369a1',
          padding: '4px 8px',
          borderRadius: '6px',
          fontWeight: 500,
          border: '1px solid #bae6fd',
        }}
      >
        🏢 {row.clients.length} {row.clients.length === 1 ? 'cliente' : 'clientes'}
      </span>
    ),
  },
  {
    id: 'locations',
    header: 'Ubicaciones',
    type: 'text',
    renderCell: (row) => (
      <span style={{ fontSize: '0.85rem', color: '#334155' }}>
        📍 {row.clients.reduce((sum, c) => sum + c.locations.length, 0)}
      </span>
    ),
  },
];

export const getAssignedClientColumns = (
  removeAssignment: (clientId: number) => void,
): ColumnDef<Assignment>[] => [
  {
    id: 'client',
    header: 'Cliente Corporativo',
    type: 'text',
    renderCell: (row) => (
      <span style={{ fontWeight: 500, color: '#0f172a' }}>
        🏢 {row.client?.razonSocial || 'Cliente N/A'}{' '}
        <span style={{ color: '#64748b', fontSize: '12px' }}>({row.client?.nit || 'N/A'})</span>
      </span>
    ),
  },
  {
    id: 'location',
    header: 'Ubicaciones',
    type: 'text',
    renderCell: (row) => (
      <span style={{ fontSize: '0.85rem', color: '#334155' }}>
        📍 {row.locations.map((l) => l.name).join(', ') || 'Sin ubicaciones'}
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
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeAssignment(row.clientId);
        }}
        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' }}
      >
        Revocar
      </button>
    ),
  },
];

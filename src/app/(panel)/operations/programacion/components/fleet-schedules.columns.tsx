import React from 'react';
import { ColumnDef } from '@/types/table';
import { Select } from '@/components/atoms/select/select';
import {
  Building2,
  Truck,
  User,
  PlusCircle,
  Trash2,
  Briefcase,
} from 'lucide-react';

import { Button } from '@/components/atoms/button/button';
import { Operation, Vehicle, UserDriver } from '@/types/operation-types';
import { Client } from '@/types/client.-types';
import { Analyst } from '@/hooks/useAnalysts';

export interface GroupedSchedule {
  id: number;
  razonSocial: string;
  totalOperations: number;
  analystsStr: string;
  operations: Operation[];
}

// 🚀 Estado súper limpio sin variables de precio ni ubicaciones
export interface ScheduleRowState {
  [clientId: number]: {
    operationType: string;
    vehicleId: string;
    analystId: string;
  };
}

const operationTypes = [
  { value: 'EXPORTACION', label: 'Exportación' },
  { value: 'IMPORTACION', label: 'Importación' },
  { value: 'RETIRO_VACIO', label: 'Retiro Vacío' },
  { value: 'DEVOLUCION', label: 'Devolución' },
];

// ==========================================
// 1. COLUMNAS: MATRIZ DE ASIGNACIÓN (SÚPER BÁSICA)
// ==========================================
export const getCreationColumns = (
  vehicles: Vehicle[],
  analysts: Analyst[],
  rowStates: ScheduleRowState,
  handleFieldChange: (clientId: number, field: string, value: string) => void,
  handleSaveRow: (clientId: number) => void,
  isCreating: boolean
): ColumnDef<Client>[] => [
  {
    id: 'razonSocial',
    header: 'Cliente',
    renderCell: (row: Client) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Building2 size={14} style={{ color: '#94a3b8' }} />
        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
          {row.razonSocial}
        </span>
      </div>
    ),
  },
  {
    id: 'operationType',
    header: 'Tipo Operación',
    renderCell: (row: Client) => (
      <Select
        options={operationTypes}
        value={rowStates[row.id]?.operationType || ''}
        onChange={(e) => handleFieldChange(row.id, 'operationType', e.target.value)}
      />
    ),
  },
  {
    id: 'vehicleId',
    header: 'Placa Vehículo',
    renderCell: (row: Client) => (
      <Select
        options={vehicles.map((v) => ({ value: v.id, label: v.plate }))}
        value={rowStates[row.id]?.vehicleId || ''}
        onChange={(e) => handleFieldChange(row.id, 'vehicleId', e.target.value)}
      />
    ),
  },
  {
    id: 'analystId',
    header: 'Analista Asignado',
    renderCell: (row: Client) => (
      <Select
        options={analysts.map((a: Analyst) => ({ value: a.id, label: a.name }))}
        value={rowStates[row.id]?.analystId || ''}
        onChange={(e) => handleFieldChange(row.id, 'analystId', e.target.value)}
      />
    ),
  },
  {
    id: 'actions',
    header: 'Acción',
    renderCell: (row: Client) => (
      <Button
        type="button"
        onClick={() => handleSaveRow(row.id)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          padding: '6px 12px', borderRadius: '6px', border: 'none',
          backgroundColor: '#4f46e5', color: '#fff', fontSize: '0.75rem', fontWeight: 700,
          cursor: isCreating ? 'not-allowed' : 'pointer', opacity: isCreating ? 0.5 : 1,
          transition: 'background-color 0.2s'
        }}
      >
        <PlusCircle size={14} />
        {isCreating ? 'Guardando...' : 'Programar'}
      </Button>
    ),
  },
];

// ==========================================
// 2. COLUMNAS: PADRE DE PROGRAMADAS AGRUPADAS
// ==========================================
export const getGroupedColumns = (): ColumnDef<GroupedSchedule>[] => [
  {
    id: 'razonSocial',
    header: 'Cliente / Empresa',
    renderCell: (row: GroupedSchedule) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Building2 size={16} style={{ color: '#4f46e5' }} />
        <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.razonSocial}</span>
      </div>
    )
  },
  {
    id: 'totalOperations',
    header: 'Viajes Hoy',
    renderCell: (row: GroupedSchedule) => (
      <span style={{ backgroundColor: '#eef2ff', color: '#4338ca', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 }}>
        {row.totalOperations}
      </span>
    )
  },
  {
    id: 'analystsStr',
    header: 'Analistas en Turno',
    renderCell: (row: GroupedSchedule) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#475569' }}>
        <User size={14} />
        <span>{row.analystsStr}</span>
      </div>
    )
  },
];

// ==========================================
// 3. COLUMNAS: HIJOS (TABLA ANIDADA SÚPER BÁSICA)
// ==========================================
export const getNestedColumns = (
  cancelSchedule: (id: number) => void,
  isCancelling: boolean
): ColumnDef<Operation>[] => [ 
  {
    id: 'type',
    header: 'Operación',
    renderCell: (op: Operation) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>
        <Briefcase size={12} style={{ color: '#94a3b8' }} />
        {op.type} 
      </div>
    )
  },
  {
    id: 'vehicle',
    header: 'Vehículo Asignado',
    renderCell: (op: Operation) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', width: 'fit-content', border: '1px solid #e2e8f0' }}>
        <Truck size={12} style={{ color: '#64748b' }} />
        {op.vehicle?.plate || 'Pendiente'}
      </div>
    )
  },
  {
    id: 'analyst',
    header: 'Analista Asignado',
    renderCell: (op: Operation) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569', fontSize: '0.85rem' }}>
        <User size={12} />
        <span>{op.analystId || 'S/N'}</span>
      </div>
    )
  },
  {
    id: 'actions',
    header: 'Acciones',
    renderCell: (op: Operation) => (
      <Button
        type="button"
        disabled={isCancelling}
        onClick={() => cancelSchedule(op.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca',
          padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
          cursor: isCancelling ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
        }}
      >
        <Trash2 size={12} />
        {isCancelling ? '...' : 'Cancelar'}
      </Button>
    )
  },
];
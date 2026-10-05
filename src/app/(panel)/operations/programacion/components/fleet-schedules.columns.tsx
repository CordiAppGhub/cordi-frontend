import React from 'react';
import { ColumnDef } from '@/types/table';
import { Select } from '@/components/atoms/select/select';
import { Input } from '@/components/atoms/input/input';
import {
  Building2,
  Truck,
  User,
  PlusCircle,
  Trash2,
  DollarSign,
  Briefcase,
  MapPin
} from 'lucide-react';

// 🚀 Importa tus tipos reales desde sus archivos correspondientes
import { Locations } from '@/types/location.types';
import { Client } from '@/types/client.-types';
import { Button } from '@/components/atoms/button/button';

// Tipos adicionales para Flota
export interface VehicleData {
  id: number;
  plate: string;
  status?: string;
}

export interface AnalystData {
  id: number;
  name: string;
}

// Representa la operación que viene del backend
export interface FleetSchedule {
  id: number;
  date: string;
  operationType: string;
  fleteCobro: number | null;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  client: Client;
  location: Locations; // 🚀 Agregamos la Location que viene del backend
  analyst: AnalystData;
  vehicle: VehicleData;
  driver?: { id: number; name: string } | null;
}

// Representa la fila de la tabla agrupada
export interface GroupedSchedule {
  id: number;
  razonSocial: string;
  totalOperations: number;
  analystsStr: string;
  operations: FleetSchedule[];
}

export interface ScheduleRowState {
  [clientId: number]: {
    locationId: string;
    operationType: string;
    vehicleId: string;
    analystId: string;
    driverId: string;
    manualPrice: string;
    suggestedPrice: number | null;
    isCalculating: boolean;
  };
}

const operationTypes = [
  { value: 'EXPORTACION', label: 'Exportación' },
  { value: 'IMPORTACION', label: 'Importación' },
  { value: 'RETIRO_VACIO', label: 'Retiro Vacío' },
  { value: 'DEVOLUCION', label: 'Devolución' },
];

// ==========================================
// 1. COLUMNAS: MATRIZ DE ASIGNACIÓN (CREACIÓN)
// ==========================================
export const getCreationColumns = (
  vehicles: VehicleData[],
  analysts: AnalystData[],
  locations: Locations[],
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
    id: 'locationId',
    header: 'Sede',
    renderCell: (row) => {
      // 🚀 ¡Mucho más eficiente! Usamos directamente la relación del cliente
      const clientLocations = row.locations?.map((rel) => ({
        value: rel.locationId,
        label: rel.location.name
      })) || [];

      return (
        <Select
          options={clientLocations}
          value={rowStates[row.id]?.locationId || ''}
          onChange={(e) => handleFieldChange(row.id, 'locationId', e.target.value)}
        />
      );
    },
  },
  {
    id: 'operationType',
    header: 'Operación',
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
    header: 'Vehículo',
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
    header: 'Analista',
    renderCell: (row: Client) => (
      <Select
        options={analysts.map((a) => ({ value: a.id, label: a.name }))}
        value={rowStates[row.id]?.analystId || ''}
        onChange={(e) => handleFieldChange(row.id, 'analystId', e.target.value)}
      />
    ),
  },
  {
    id: 'tariffAndPrice',
    header: 'Flete',
    renderCell: (row: Client) => {
      const rowState = rowStates[row.id];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
            Sugerido: {rowState?.isCalculating ? (
              <span style={{ color: '#4f46e5' }}>Calculando...</span>
            ) : rowState?.suggestedPrice !== null && rowState?.suggestedPrice !== undefined ? (
              <span style={{ color: '#059669', fontWeight: 700 }}>${rowState.suggestedPrice.toLocaleString()}</span>
            ) : 'N/A'}
          </div>
          <Input
            type="text"
            placeholder="Flete manual"
            value={rowState?.manualPrice || ''}
            onChange={(e) => handleFieldChange(row.id, 'manualPrice', e.target.value)}
          />
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Acción',
    renderCell: (row: Client) => (
      <Button
        type="button"
        // disabled={isCreating}
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
    header: 'Cliente Agrupado',
    renderCell: (row: GroupedSchedule) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Building2 size={16} style={{ color: '#4f46e5' }} />
        <span style={{ fontWeight: 500, color: '#0f172a' }}>{row.razonSocial}</span>
      </div>
    )
  },
  {
    id: 'totalOperations',
    header: 'Operaciones Asignadas',
    renderCell: (row: GroupedSchedule) => (
      <span style={{ backgroundColor: '#eef2ff', color: '#4338ca', padding: '2px 8px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 }}>
        {row.totalOperations} op(s)
      </span>
    )
  },
  {
    id: 'analystsStr',
    header: 'Analistas a Cargo',
    renderCell: (row: GroupedSchedule) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#475569' }}>
        <User size={14} />
        <span>{row.analystsStr}</span>
      </div>
    )
  },
];

// ==========================================
// 3. COLUMNAS: HIJOS (TABLA ANIDADA DE PROGRAMADAS)
// ==========================================
export const getNestedColumns = (
  cancelSchedule: (id: number) => void,
  isCancelling: boolean
): ColumnDef<FleetSchedule>[] => [
  {
    id: 'location',
    header: 'Sede / Ubicación',
    renderCell: (op: FleetSchedule) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
        <MapPin size={12} style={{ color: '#3b82f6' }} />
        <span>{op.location?.name || 'S/N'}</span>
      </div>
    )
  },
  {
    id: 'type',
    header: 'Operación',
    renderCell: (op: FleetSchedule) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#334155' }}>
        <Briefcase size={12} style={{ color: '#94a3b8' }} />
        {op.operationType}
      </div>
    )
  },
  {
    id: 'vehicle',
    header: 'Vehículo',
    renderCell: (op: FleetSchedule) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', width: 'fit-content', border: '1px solid #cbd5e1' }}>
        <Truck size={12} />
        {op.vehicle?.plate || 'S/N'}
      </div>
    )
  },
  {
    id: 'analyst',
    header: 'Analista',
    renderCell: (op: FleetSchedule) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}>
        <User size={12} />
        <span>{op.analyst?.name}</span>
      </div>
    )
  },
  {
    id: 'flete',
    header: 'Flete',
    renderCell: (op: FleetSchedule) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 700 }}>
        <DollarSign size={12} />
        {op.fleteCobro ? op.fleteCobro.toLocaleString() : 'N/A'}
      </div>
    )
  },
  {
    id: 'actions',
    header: 'Acciones',
    renderCell: (op: FleetSchedule) => (
      <Button
        type="button"
        disabled={isCancelling}
        onClick={() => cancelSchedule(op.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca',
          padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700,
          cursor: isCancelling ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
        }}
      >
        <Trash2 size={12} />
        {isCancelling ? '...' : 'Cancelar'}
      </Button>
    )
  },
];
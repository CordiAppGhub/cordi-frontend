'use client';

import React, { useEffect } from 'react';

import { ColumnDef } from '@/types/table';
import { Vehicle } from '@/types/vehicles';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import UploadExcel from '@/components/organisms/fleet/UploadExcel';
import { Button } from '@/components/atoms/button/button';
import { useVehicles } from '@/hooks/use-vehicles';
import { VehicleStatusLabels } from '@/constants/enum-mapping-types';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';

export default function VehiclesPage() {
  const { vehicles, isLoading, loadVehicles, removeVehicle, uploadExcel } = useVehicles();

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const vehicleColumns: ColumnDef<Vehicle>[] = [
    { id: 'plate', header: 'Placa', type: 'text', isDraggable: false, renderCell: (row) => <strong>{row.plate}</strong> },
    { id: 'empresa', header: 'Empresa', type: 'text', renderCell: (row) => row.empresa || '--' },
    { id: 'brand', header: 'Marca', type: 'text', renderCell: (row) => row.brand || '--' },
    { id: 'modelYear', header: 'Año', type: 'text', renderCell: (row) => row.modelYear || '--' },
    { id: 'capacityWeight', header: 'Capacidad', type: 'text', renderCell: (row) => row.capacityWeight || '--' },
    { id: 'tecnoExpiration', header: 'Venc. Tecno', type: 'text', renderCell: (row) => row.tecnoExpiration ? new Date(row.tecnoExpiration).toLocaleDateString() : '--' },
    { id: 'status', header: 'Estado', type: 'text', renderCell: (row) => <StatusBadge status={row.status} /> },
    {
      id: 'soatExpiration',
      header: 'Venc. SOAT',
      type: 'text',
      renderCell: (row) => row.soatExpiration ? new Date(row.soatExpiration).toLocaleDateString() : '--'
    },
    {
      id: 'actions',
      header: 'Acciones',
      type: 'text',
      renderCell: (row) => (
        <div className="flex gap-2">
          {/* Aquí iría tu botón para abrir el modal de edición */}
          <Button style={{ padding: '6px 10px', fontSize: '1rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }} onClick={() => console.log('Editar', row.id)}>
            ✏️
          </Button>
          <Button style={{ padding: '6px 10px', fontSize: '1rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }} onClick={() => removeVehicle(row.id)}>
            🗑️
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventario de Vehículos 🚛</h1>
          <p className="text-slate-500 text-sm">Gestiona la flota de máquinas, placas y vencimientos.</p>
        </div>

      </div>

      <UploadExcel
        title="Carga Masiva de Vehículos"
        description={
          <>Sube el archivo de Excel con las columnas: <strong>PLACA, MARCA, MODELO, EMPRESA.</strong></>
        }
        onUpload={uploadExcel}
        onSuccess={loadVehicles}
      />

      <div className="space-y-4">
        {isLoading && vehicles.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-gray-100 shadow-sm">
            Cargando flota...
          </div>
        ) : (
          <PaginationTable
            data={vehicles}
            columns={vehicleColumns}
            totalPages={1}
            currentPage={1}
            onPageChange={(page) => console.log(page)}
          />
        )}
      </div>
    </div>
  );
}
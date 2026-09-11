'use client';

import React, { useEffect, useState } from 'react';
import { useDrivers } from '@/hooks/use-drivers';
import { ColumnDef } from '@/types/table';
import { Driver } from '@/types/drivers';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import UploadExcel from '@/components/organisms/fleet/UploadExcel';
import CreateDriverModal from './components/CreateDriverModal';
import { Button } from '@/components/atoms/button/button';

export default function DriversPage() {
  const { drivers, isLoading, loadDrivers, disableDriver, uploadExcel, createDriver } = useDrivers();
  const [isModalOpen, setIsModalOpen] = useState(false); // 👈 Estado para controlar el modal

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const driverColumns: ColumnDef<Driver>[] = [
    { 
      id: 'name', 
      header: 'Nombre del Conductor', 
      type: 'text', 
      isDraggable: false, 
      renderCell: (row) => <strong className="text-slate-800">{row.name || '--'}</strong> 
    },
    { id: 'cedula', header: 'Cédula', type: 'text', renderCell: (row) => row.cedula },
    { id: 'telefono', header: 'Teléfono', type: 'text', renderCell: (row) => row.telefono || '--' },
    { 
      id: 'vehiculo', 
      header: 'Vehículo Actual', 
      type: 'text', 
      renderCell: (row) => {
        return row.drivenVehicles && row.drivenVehicles.length > 0 
          ? <span className="px-2 py-1 bg-slate-100 rounded text-slate-700">{row.drivenVehicles[0].plate}</span>
          : <span className="text-slate-400 italic">Sin Asignar</span>;
      } 
    },
    {
      id: 'portalLink',
      header: 'Detalles',
      type: 'text',
      renderCell: (row) => row.portalLink
    },
    {
      id: 'actions',
      header: 'Acciones',
      type: 'text',
      renderCell: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
      
          <Button 
            variant="secondary"
            title="Editar"
            onClick={() => console.log('Abrir modal de edición', row.id)}
            style={{ padding: '6px 10px', fontSize: '1rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
          >
            ✏️
          </Button>

          <Button 
            variant="secondary"
            title="Desactivar conductor"
            onClick={() => disableDriver(row.id, row.name)}
            style={{ padding: '6px 10px', fontSize: '1rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
          >
            🚫
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Directorio de Conductores 👨‍✈️</h1>
          <p className="text-slate-500 text-sm">Gestiona el personal, sus contactos y su estado operativo.</p>
        </div>
      </div>

      <UploadExcel 
        title="Carga Masiva de Conductores"
        description={
          <>Sube el archivo de Excel con las columnas exactas: <strong>CÉDULA, NOMBRE, TELÉFONO.</strong></>
        }
        onUpload={uploadExcel}
        onSuccess={loadDrivers}
      />

      <div className="space-y-4">
        {isLoading && drivers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-gray-100 shadow-sm">
            Cargando personal...
          </div>
        ) : (
          <PaginationTable
            data={drivers}
            columns={driverColumns}
            nameButton="Crear Conductor"
            totalPages={1} 
            currentPage={1}
            onPageChange={(page) => console.log(page)}
            onOpenModal={() => setIsModalOpen(true)} // 👈 Conectado al botón de la tabla
          />
        )}
      </div>

      {/* Renderizado del Modal con estilos nativos limpios */}
      <CreateDriverModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateDriver={createDriver}
      />
    </div>
  );
}
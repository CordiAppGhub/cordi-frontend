'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation'; // 👈 Importamos el enrutador
import { useDrivers } from '@/app/(panel)/fleet/conductores/hooks/use-drivers';
import { getDriverColumns } from '../components/driver-columns';
import { Driver } from '@/types/drivers';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import UploadExcel from '@/components/organisms/fleet/UploadExcel';
import CreateDriverModal from '../components/CreateDriverModal';

export function DriversView() {
  const router = useRouter();
  const { drivers, isLoading, loadDrivers, disableDriver, uploadExcel, createDriver } = useDrivers();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);

  const isInitialized = useRef(false);
  useEffect(() => {
    if (!isInitialized.current) {
      loadDrivers();
      isInitialized.current = true;
    }
  }, [loadDrivers]);

  const handleOpenCreate = () => {
    setDriverToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (driver: Driver) => {
    setDriverToEdit(driver);
    setIsModalOpen(true);
  };

  const handleNavigateDetails = (id: number) => {
    router.push(`/fleet/conductores/${id}`);
  };

  const columns = useMemo(
    () => getDriverColumns(handleOpenEdit, disableDriver, handleNavigateDetails),
    [disableDriver]
  );

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
        description={<>Sube el archivo de Excel con las columnas exactas: <strong>CÉDULA, NOMBRE, TELÉFONO.</strong></>}
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
            columns={columns}
            nameButton="Crear Conductor"
            totalPages={1}
            currentPage={1}
            onPageChange={(page) => console.log(page)}
            onOpenModal={handleOpenCreate}
          />
        )}
      </div>

      {isModalOpen && (
        <CreateDriverModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreateDriver={createDriver}
        />
      )}
    </div>
  );
}
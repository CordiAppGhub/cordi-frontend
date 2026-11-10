'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/atoms/button/button';
import { Input } from '@/components/atoms/input/input';
import { TruckLoader } from '@/components/TruckLoader';
import { useDrivers } from '@/app/(panel)/fleet/conductores/hooks/use-drivers';
import { driversService } from '@/services/driver.service';
import CreateDriverModal from '../components/CreateDriverModal';

import { DriverCard } from '../../components/DriverCard'; 
import styles from '../../components/fleet-cards.module.css';

import { Driver } from '@/types/drivers';
import UploadExcel from '@/components/organisms/fleet/UploadExcel';

export const DriversTab = () => {
  const router = useRouter();
  const {
    createDriver,
    editDriver,
    deleteDriver,
    uploadExcel,
  } = useDrivers();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);
  const [driverSearch, setDriverSearch] = useState('');
  const [debouncedDriverSearch, setDebouncedDriverSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedDriverSearch(driverSearch.trim()),
      250,
    );
    return () => window.clearTimeout(timeoutId);
  }, [driverSearch]);

  const driversQuery = useQuery({
    queryKey: [
      'drivers',
      'paginated',
      currentPage,
      pageSize,
      debouncedDriverSearch,
    ],
    queryFn: () =>
      driversService.getPaginated(
        currentPage,
        pageSize,
        debouncedDriverSearch,
      ),
    placeholderData: keepPreviousData,
  });

  const drivers = driversQuery.data?.data ?? [];
  const totalDrivers = driversQuery.data?.total ?? 0;
  const totalPages = driversQuery.data?.totalPages ?? 1;

  const displayedPage = driversQuery.data?.page ?? currentPage;
  const handleOpenCreate = () => {
    setDriverToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (driver: Driver) => {
    setDriverToEdit(driver);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDriverToEdit(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
          Personal Operativo
        </h2>
        <Button 
          variant="primary" 
          onClick={handleOpenCreate}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#16a34a', border: 'none' }}
        >
          <Plus size={18} /> Registrar Conductor
        </Button>
      </div>

      <UploadExcel
        title="Importación masiva de conductores"
        description={
          <>
            Carga un archivo Excel (.xlsx o .xls). La primera fila debe contener
            encabezados CONDUCTOR, CEDULA, TELEFONO y AFILIACION. Para
            AFILIACION usa CORDIVEHICULOS, CORDIHUB o TERCEROS. Los registros
            existentes se actualizarán por cédula; también se repararán
            registros cruzados por la importación anterior cuando la
            coincidencia sea única.
            Máximo 250 conductores por archivo.
          </>
        }
        onUpload={uploadExcel}
      />

      <label className={styles.plateSearch}>
        <span>
          <Search size={16} aria-hidden="true" />
          Buscar conductor por nombre o cédula
        </span>
        <div className={styles.plateSearchInput}>
          <Input
            type="search"
            value={driverSearch}
            onChange={(event) => {
              setDriverSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Nombre o número de cédula"
            aria-label="Buscar conductor por nombre o cédula"
          />
        </div>
      </label>

      {driversQuery.isLoading ? (
        <TruckLoader variant="compact" message="Sincronizando personal operativo..." />
      ) : driversQuery.isError ? (
        <div className={styles.searchEmptyState} role="alert">
          No se pudieron cargar los conductores.{' '}
          <button type="button" onClick={() => void driversQuery.refetch()}>
            Reintentar
          </button>
        </div>
      ) : totalDrivers === 0 && !debouncedDriverSearch ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '60px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1' }}>
          No hay conductores registrados.
        </div>
      ) : totalDrivers === 0 ? (
        <div className={styles.searchEmptyState}>
          No se encontraron conductores para “{driverSearch}”.
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {drivers.map((driver) => (
            <DriverCard 
              key={driver.id} 
              driver={driver} 
              onClickDetail={(id) => router.push(`/fleet/conductores/${id}`)}
              onEdit={handleOpenEdit}
              onDelete={deleteDriver}
            />
          ))}
        </div>
      )}

      {totalDrivers > 0 && (
        <div className={styles.cardPagination}>
          <span className={styles.cardPaginationSummary}>
            {totalDrivers} conductor(es)
            {debouncedDriverSearch && ` para “${debouncedDriverSearch}”`}
            {driversQuery.isFetching && ' · Actualizando…'}
          </span>
          <div className={styles.cardPaginationControls}>
            <button
              type="button"
              onClick={() => setCurrentPage(Math.max(1, displayedPage - 1))}
              disabled={displayedPage <= 1 || driversQuery.isFetching}
            >
              Anterior
            </button>
            <span>
              Página {displayedPage} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, displayedPage + 1))
              }
              disabled={displayedPage >= totalPages || driversQuery.isFetching}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <CreateDriverModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onCreateDriver={createDriver}
          onEditDriver={editDriver}
          driverToEdit={driverToEdit}
        />
      )}
    </div>
  );
};
'use client';

import React, { useCallback, useState, useMemo } from 'react';
import { Button } from '@/components/atoms/button/button';
import { Locations } from '@/types/location.types';
import { useLocations } from '../hooks/useLocation';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { LocationModal } from '../components/locationModal/locationModal';
import { getLocationColumns, getClientSubColumns } from '../components/LocationColumns';
import { TruckLoader } from '@/components/TruckLoader';
import styles from '../locations.module.css';

export const LocationsView: React.FC = () => {
  const { locations, isLoadingLocations, deleteLocation } = useLocations();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<Locations | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleOpenCreate = () => {
    setLocationToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = useCallback((location: Locations) => {
    setLocationToEdit(location);
    setIsModalOpen(true);
  }, []);

  const columns = useMemo(
    () => getLocationColumns(handleOpenEdit, deleteLocation),
    [deleteLocation, handleOpenEdit]
  );

  // 🚀 Definimos las sub-columnas del collapse
  const subColumns = useMemo(() => getClientSubColumns(), []);

  const totalPages = Math.ceil((locations?.length || 0) / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return locations.slice(startIndex, startIndex + itemsPerPage);
  }, [locations, currentPage]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Directorio de Empresas (Nodos)</h2>
          <p className={styles.subtitle}>Gestión de ubicaciones físicas, puertos y plantas asociadas.</p>
        </div>
        <Button onClick={handleOpenCreate} variant="primary">
          + Nueva Empresa
        </Button>
      </div>

      {isLoadingLocations ? (
        <TruckLoader variant="compact" message="Cargando ubicaciones..." />
      ) : (
        <div className={styles.table}>
          <PaginationTable
            data={paginatedData}
            columns={columns}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            // 🚀 Propiedades nativas de colapso integradas
            isCollapsible={true}
            subColumns={subColumns}
            getSubRows={(row) => row.clients || []}
          />
        </div>
      )}

      {isModalOpen && (
        <LocationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          locationToEdit={locationToEdit}
        />
      )}
    </div>
  );
};
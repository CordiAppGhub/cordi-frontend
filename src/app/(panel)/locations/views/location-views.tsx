'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/atoms/button/button';
import { Location } from '@/types/location.types';
import { useLocations } from '../hooks/useLocation';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { LocationModal } from '../components/locationModal/locationModal';
import { getLocationColumns } from '../components/location-columns';


export const LocationsView: React.FC = () => {
  const { locations, isLoadingLocations, deleteLocation, refreshLocations } = useLocations();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<Location | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Carga inicial protegida
  const isInitialized = useRef(false);
  useEffect(() => {
    if (!isInitialized.current) {
      refreshLocations();
      isInitialized.current = true;
    }
  }, [refreshLocations]);

  const handleOpenCreate = () => {
    setLocationToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (location: Location) => {
    setLocationToEdit(location);
    setIsModalOpen(true);
  };

  // Memoizamos las columnas inyectando las acciones
  const columns = useMemo(
    () => getLocationColumns(handleOpenEdit, deleteLocation),
    [deleteLocation]
  );

  const totalPages = Math.ceil((locations?.length || 0) / itemsPerPage) || 1;
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return locations.slice(startIndex, startIndex + itemsPerPage);
  }, [locations, currentPage]);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Directorio de Empresas (Nodos)</h1>
        <Button onClick={handleOpenCreate} variant="primary">
          + Nueva Empresa
        </Button>
      </div>

      {isLoadingLocations ? (
        <p>Cargando información...</p>
      ) : (
        <PaginationTable
          data={paginatedData}
          columns={columns}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
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
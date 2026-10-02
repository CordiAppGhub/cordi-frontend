'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/atoms/button/button';
import { Locations } from '@/types/location.types';
import { useLocations } from '../hooks/useLocation';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { LocationModal } from '../components/locationModal/locationModal';
import { getLocationColumns } from '../components/LocationColumns';

export const LocationsView: React.FC = () => {
  const { locations, isLoadingLocations, deleteLocation, refreshLocations } = useLocations();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<Locations | null>(null);
  

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const handleOpenEdit = (location: Locations) => {
    setLocationToEdit(location);
    setIsModalOpen(true);
  };

 

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
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Directorio de Empresas (Nodos)</h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>Gestión de ubicaciones físicas, puertos y plantas asociadas.</p>
        </div>
        <Button onClick={handleOpenCreate} variant="primary">
          + Nueva Empresa
        </Button>
      </div>

      {isLoadingLocations ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando información...</div>
      ) : (
        <div style={{ width: '100%' }}>
          <PaginationTable
            data={paginatedData}
            columns={columns}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
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
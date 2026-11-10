'use client';

import React, { useCallback, useState, useMemo } from 'react';
import { Button } from '@/components/atoms/button/button';
import { Locations } from '@/types/location.types';
import { useLocations } from '../hooks/useLocation';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { LocationModal } from '../components/locationModal/locationModal';
import { getLocationColumns, getClientSubColumns } from '../components/LocationColumns';
import { TruckLoader } from '@/components/TruckLoader';
import { PageHeader } from '@/components/molecules/page-header/page-header';
import { TabOption, Tabs } from '@/components/molecules/tabs/tabs';
import styles from '../locations.module.css';

export const LocationsView: React.FC = () => {
  const { locations, isLoadingLocations, deleteLocation } = useLocations();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<Locations | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
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
    () =>
      getLocationColumns(
        handleOpenEdit,
        deleteLocation,
        activeCategory === 'all' || activeCategory === 'CLIENT_SITE',
      ),
    [activeCategory, deleteLocation, handleOpenEdit],
  );

  const subColumns = useMemo(() => getClientSubColumns(), []);

  const categoryTabs: TabOption[] = useMemo(
    () => [
      { id: 'all', label: 'Todos', badge: locations.length },
      {
        id: 'OWN_YARD',
        label: 'Patios Propios (Corditrans)',
        badge: locations.filter((location) => location.isOwnYard).length,
      },
      {
        id: 'PORT',
        label: 'Puertos',
        badge: locations.filter((location) => location.isPort).length,
      },
      {
        id: 'EMPTY_YARD',
        label: 'Patios de Vacíos',
        badge: locations.filter((location) => location.isDepot).length,
      },
      {
        id: 'CLIENT_SITE',
        label: 'Bodegas / Sedes Clientes',
        badge: locations.filter(
          (location) =>
            !location.isOwnYard && !location.isPort && !location.isDepot,
        ).length,
      },
    ],
    [locations],
  );

  const filteredLocations = useMemo(
    () =>
      activeCategory === 'all'
        ? locations
        : activeCategory === 'OWN_YARD'
          ? locations.filter((location) => location.isOwnYard)
          : activeCategory === 'PORT'
            ? locations.filter((location) => location.isPort)
            : activeCategory === 'EMPTY_YARD'
              ? locations.filter((location) => location.isDepot)
              : locations.filter(
                  (location) =>
                    !location.isOwnYard &&
                    !location.isPort &&
                    !location.isDepot,
                ),
    [activeCategory, locations],
  );
  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLocations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLocations, currentPage]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Directorio de Empresas (Nodos)"
        description="Gestión de ubicaciones físicas, puertos y plantas asociadas."
        titleLevel={2}
        className={styles.header}
        titleClassName={styles.title}
        descriptionClassName={styles.subtitle}
        actions={
          <Button onClick={handleOpenCreate} variant="primary">
            + Nueva Empresa
          </Button>
        }
      />

      {isLoadingLocations ? (
        <TruckLoader variant="compact" message="Cargando ubicaciones..." />
      ) : (
        <>
          <Tabs
            tabs={categoryTabs}
            activeTab={activeCategory}
            onChange={handleCategoryChange}
          />
          <div className={styles.table}>
            <PaginationTable
              data={paginatedData}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              hideSearch
              isCollapsible={true}
              subColumns={subColumns}
              getSubRows={(row) => row.clients || []}
            />
          </div>
        </>
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
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/atoms/button/button';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { RouteTariffModal } from '../components/route-tariff-modal';
import { getClientGroupColumns, getTariffColumns, groupTariffsByClient } from '../components/tariff-columns';
import { useTariffs } from '../hooks/useTariff';
import { SurchargeFormsModal } from '../components/SurchargeFormModal';
import { getSurchargeColumns } from '../components/surcharge-columns';

// IMPORTACIONES PARA VEHÍCULOS

import { AffiliationTariff } from '@/types/tariff-ypes';

import { Tabs, TabOption } from '@/components/molecules/tabs/tabs';
import { VehicleTariffModal } from '../components/ModalVehicleTariff';
import { getVehicleTariffColumns } from '../components/Vehicle-Tariff-columns';
import { TruckLoader } from '@/components/TruckLoader';
import styles from '../tariffs.module.css';

type TabState = 'BASE' | 'NOVEDADES' | 'VEHICULOS';

export const TariffsView: React.FC = () => {
  const { 
    clientTariffs, 
    surcharges, 
    vehicleTariffs,
    isLoadingTariffs, 
    error,
    refreshTariffs, 
    refreshSurcharges,
    fetchVehicleTariffs
  } = useTariffs();
  
  const [activeTab, setActiveTab] = useState<TabState>('BASE');
  
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [isSurchargeModalOpen, setIsSurchargeModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [selectedVehicleTariff, setSelectedVehicleTariff] = useState<AffiliationTariff | null>(null);

  const [currentPageBase, setCurrentPageBase] = useState(1);
  const [currentPageSurcharge, setCurrentPageSurcharge] = useState(1);
  const [currentPageVehicle, setCurrentPageVehicle] = useState(1);
  const itemsPerPage = 10;

  const isInitialized = useRef(false);
  useEffect(() => {
    if (!isInitialized.current) {
      refreshTariffs();
      refreshSurcharges();
      fetchVehicleTariffs();
      isInitialized.current = true;
    }
  }, [refreshTariffs, refreshSurcharges, fetchVehicleTariffs]);


  const tabOptions: TabOption[] = useMemo(() => [
    { id: 'BASE', label: 'Tarifas de Viaje' },
    { id: 'NOVEDADES', label: 'Novedades y Recargos' },
    { id: 'VEHICULOS', label: 'Tarifas de Vehículos' },
  ], []);

 
  const tariffColumns = useMemo(() => getTariffColumns(), []);
  const clientGroupColumns = useMemo(() => getClientGroupColumns(), []);
  const clientGroups = useMemo(() => groupTariffsByClient(clientTariffs || []), [clientTariffs]);
  const totalPagesBase = Math.ceil(clientGroups.length / itemsPerPage) || 1;
  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPageBase - 1) * itemsPerPage;
    return clientGroups.slice(startIndex, startIndex + itemsPerPage);
  }, [clientGroups, currentPageBase]);

  const surchargeColumns = useMemo(() => getSurchargeColumns(), []);
  const totalPagesSurcharge = Math.ceil((surcharges?.length || 0) / itemsPerPage) || 1;
  const paginatedSurcharges = useMemo(() => {
    const startIndex = (currentPageSurcharge - 1) * itemsPerPage;
    return (surcharges || []).slice(startIndex, startIndex + itemsPerPage);
  }, [surcharges, currentPageSurcharge]);

  const vehicleColumns = useMemo(() => getVehicleTariffColumns((tariff) => {
    setSelectedVehicleTariff(tariff);
    setIsVehicleModalOpen(true);
  }), []);
  const totalPagesVehicle = Math.ceil((vehicleTariffs?.length || 0) / itemsPerPage) || 1;
  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPageVehicle - 1) * itemsPerPage;
    return (vehicleTariffs || []).slice(startIndex, startIndex + itemsPerPage);
  }, [vehicleTariffs, currentPageVehicle]);


  
  const handleOpenMainModal = () => {
    if (activeTab === 'BASE') setIsTariffModalOpen(true);
    else if (activeTab === 'NOVEDADES') setIsSurchargeModalOpen(true);
    else if (activeTab === 'VEHICULOS') {
      setSelectedVehicleTariff(null);
      setIsVehicleModalOpen(true);
    }
  };

  return (
    <div className={styles.page}>
      
      <div className={styles.header}>
        <h1 className={styles.title}>
          {activeTab === 'BASE' && 'Tarifario de Viajes (Base)'}
          {activeTab === 'NOVEDADES' && 'Catálogo de Novedades y Recargos'}
          {activeTab === 'VEHICULOS' && 'Configuración de Rentabilidad (Flotas)'}
        </h1>
        <Button onClick={handleOpenMainModal} variant="primary">
          {activeTab === 'BASE' && '+ Nueva Tarifa Base'}
          {activeTab === 'NOVEDADES' && '+ Nueva Novedad / Excepción'}
          {activeTab === 'VEHICULOS' && '+ Nueva Tarifa de Flota'}
        </Button>
      </div>

      <div className={styles.tabs}>
        <Tabs 
          tabs={tabOptions}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as TabState)}
        />
      </div>

      {error ? (
        <p className={styles.error}>{error}</p>
      ) : isLoadingTariffs ? (
        <TruckLoader variant="compact" message="Cargando tarifas..." />
      ) : (
        <>
          {activeTab === 'BASE' && (
            <PaginationTable
              data={paginatedGroups} columns={clientGroupColumns}
              currentPage={currentPageBase} totalPages={totalPagesBase} onPageChange={setCurrentPageBase}
              isCollapsible
              subColumns={tariffColumns}
              getSubRows={(row) => row.tariffs}
            />
          )}

          {activeTab === 'NOVEDADES' && (
            <PaginationTable
              data={paginatedSurcharges} columns={surchargeColumns}
              currentPage={currentPageSurcharge} totalPages={totalPagesSurcharge} onPageChange={setCurrentPageSurcharge}
            />
          )}

          {activeTab === 'VEHICULOS' && (
            <PaginationTable
              data={paginatedVehicles} columns={vehicleColumns}
              currentPage={currentPageVehicle} totalPages={totalPagesVehicle} onPageChange={setCurrentPageVehicle}
            />
          )}
        </>
      )}

      <RouteTariffModal isOpen={isTariffModalOpen} onClose={() => setIsTariffModalOpen(false)} />

      {isSurchargeModalOpen && (
        <div className={styles.surchargeOverlay}>
          <div className={styles.surchargeDialog}>
            <h2 className={styles.surchargeTitle}>Registrar Concepto de Novedad / Recargo</h2>
            <SurchargeFormsModal onClose={() => setIsSurchargeModalOpen(false)} />
          </div>
        </div>
      )}

      {isVehicleModalOpen && (
        <VehicleTariffModal 
          isOpen={isVehicleModalOpen}
          onClose={() => setIsVehicleModalOpen(false)}
          initialData={selectedVehicleTariff}
        />
      )}
    </div>
  );
};
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/atoms/button/button';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { RouteTariffModal } from '../components/route-tariff-modal';
import { getTariffColumns } from '../components/tariff-columns';
import { useTariffs } from '../hooks/useTariff';
import { SurchargeFormsModal } from '../components/SurchargeFormModal';
import { getSurchargeColumns } from '../components/surcharge-columns';

// IMPORTACIONES PARA VEHÍCULOS

import { AffiliationTariff } from '@/types/tariff-ypes';

// 🚀 NUEVO: Importamos tu componente de Tabs (ajusta la ruta si es necesario)
import { Tabs, TabOption } from '@/components/molecules/tabs/tabs';
import { VehicleTariffModal } from '../components/ModalVehicleTariff';
import { getVehicleTariffColumns } from '../components/Vehicle-Tariff-columns';

type TabState = 'BASE' | 'NOVEDADES' | 'VEHICULOS';

export const TariffsView: React.FC = () => {
  const { 
    clientTariffs, 
    surcharges, 
    vehicleTariffs,
    isLoadingTariffs, 
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

  // ==========================================
  // CONFIGURACIÓN DE LAS PESTAÑAS
  // ==========================================
  const tabOptions: TabOption[] = useMemo(() => [
    { id: 'BASE', label: 'Tarifas de Viaje' },
    { id: 'NOVEDADES', label: 'Novedades y Recargos' },
    { id: 'VEHICULOS', label: 'Tarifas de Vehículos' },
  ], []);

  // ==========================================
  // LÓGICA DE TABLAS
  // ==========================================
  const tariffColumns = useMemo(() => getTariffColumns(), []);
  const totalPagesBase = Math.ceil((clientTariffs?.length || 0) / itemsPerPage) || 1;
  const paginatedTariffs = useMemo(() => {
    const startIndex = (currentPageBase - 1) * itemsPerPage;
    return (clientTariffs || []).slice(startIndex, startIndex + itemsPerPage);
  }, [clientTariffs, currentPageBase]);

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

  // ==========================================
  // HANDLER BOTÓN PRINCIPAL
  // ==========================================
  const handleOpenMainModal = () => {
    if (activeTab === 'BASE') setIsTariffModalOpen(true);
    else if (activeTab === 'NOVEDADES') setIsSurchargeModalOpen(true);
    else {
      setSelectedVehicleTariff(null);
      setIsVehicleModalOpen(true);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      
      {/* HEADER DINÁMICO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>
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

      {/* 🚀 NUEVO: USO DE TU COMPONENTE TABS */}
      <div style={{ marginBottom: '24px' }}>
        <Tabs 
          tabs={tabOptions}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as TabState)}
        />
      </div>

      {/* RENDERIZADO DE TABLAS */}
      {isLoadingTariffs ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Cargando datos...</p>
      ) : (
        <>
          {activeTab === 'BASE' && (
            <PaginationTable
              data={paginatedTariffs} columns={tariffColumns}
              currentPage={currentPageBase} totalPages={totalPagesBase} onPageChange={setCurrentPageBase}
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

      {/* MODALES */}
      <RouteTariffModal isOpen={isTariffModalOpen} onClose={() => setIsTariffModalOpen(false)} />

      {isSurchargeModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px' }}>Registrar Novedad</h2>
            <SurchargeFormsModal onClose={() => setIsSurchargeModalOpen(false)} />
          </div>
        </div>
      )}

      {/* MODAL DE VEHÍCULOS */}
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
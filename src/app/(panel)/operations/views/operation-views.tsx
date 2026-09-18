'use client';

import React, { useEffect, useRef, useState} from 'react';
import { useUIStore } from '@/store/use-ui.store';
import { useOperations } from '../hooks/useOperations';

import { AssignModal } from '../components/assign-modal/assign-modal';
import { CreateModal } from '../components/create-modal/create-modal';
import { OperationTraceability } from '../components/details/OperationTraceability';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { Button } from '@/components/atoms/button/button';

import styles from '../operations.module.css';
import { getOperationsColumns } from '../components/operations-colums';
import { NovedadModal } from '@/components/organisms/novedades-modal/novedades-modal';
import { Operation } from '@/types/operation-types';

const tabs = [
  { id: 'TODAS', label: 'Todas las Operaciones' },
  { id: 'EXPORTACION', label: 'Exportación' },
  { id: 'IMPORTACION', label: 'Importación' },
  { id: 'RETIRO_VACIO', label: 'Retiro Vacío' },
  { id: 'DEVOLUCION', label: 'Devolución' },
];

export function OperationsView() {
  const { operations, meta, isLoadingOperations, error, fetchOperations } = useOperations();

  const { openCreateModal, openAssignModal } = useUIStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('TODAS');
  const [traceabilityId, setTraceabilityId] = useState<number | null>(null);

  // Estados para Novedades
  const [isNovedadModalOpen, setIsNovedadModalOpen] = useState(false);
  const [selectedOperationForNovedad, setSelectedOperationForNovedad] = useState<Operation | null>(null);

  const handleOpenOperationNovedad = (operationId: number) => {
    const operation = operations.find((op) => op.id === operationId);
    if (operation) {
      setSelectedOperationForNovedad(operation);
      setIsNovedadModalOpen(true);
    }
  };

  const handleOpenReassign = (operationId: number) => {
    setTraceabilityId(null);
    openAssignModal(operationId);
  };

  const isInitialized = useRef(false);
  useEffect(() => {
    if (!isInitialized.current) {
      fetchOperations({ page: 1, limit: 10 });
      isInitialized.current = true;
    }
  }, [fetchOperations]);

  const columns = getOperationsColumns(setTraceabilityId);

  const applyFilters = (overrides?: { tab?: string; page?: number }) => {
    const currentTab = overrides?.tab || activeTab;
    fetchOperations({
      page: overrides?.page || 1,
      limit: 10,
      type: currentTab === 'TODAS' ? undefined : currentTab,
      search: searchTerm || undefined,
      status: statusFilter || undefined,
    });
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    applyFilters({ tab: tabId, page: 1 });
  };

  const traceabilityOperation = operations.find(op => String(op.id) === String(traceabilityId));
  const isPausada =
    traceabilityOperation?.status === 'PAUSADA' ||
    traceabilityOperation?.estadoViaje === 'PAUSADA';

  return (
    <div className={styles.layout}>
      {/* HEADER */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleContainer}>
          <span className={styles.headerNumber}>2</span>
          <div>
            <h1 className={styles.titleText}>Torre de Control — Operaciones Activas</h1>
            <p className={styles.subtitleText}>Control centralizado de despachos, flujos logísticos y flotas.</p>
          </div>
        </div>
        <Button onClick={openCreateModal} style={{ padding: '10px 18px', fontWeight: 600 }}>
          + Nueva Operación
        </Button>
      </div>

      {/* TABS */}
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* FILTROS */}
      <div className={styles.filtersBar}>
        <input
          type="text"
          placeholder="Buscar por cliente, ID o detalles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.selectInput}
        >
          <option value="">Todos los estados</option>
          <option value="CREADO">Creados</option>
          <option value="ASIGNADO">Asignados</option>
          <option value="EN_CURSO">En Curso</option>
          <option value="PAUSADA">Pausados (Novedad)</option>
          <option value="FINALIZADO">Finalizado</option>
        </select>
        <Button onClick={() => applyFilters({ page: 1 })} disabled={isLoadingOperations} variant="secondary">
          {isLoadingOperations ? 'Buscando...' : '🔍 Filtrar Datos'}
        </Button>
      </div>

      {error && <div className={styles.errorMessage} role="alert">⚠️ {error}</div>}

      <div className={styles.tableCard}>
        <PaginationTable
          data={operations ?? []}
          nameButton="+ Nueva Operación"
          columns={columns}
          totalPages={meta?.totalPages ?? 1}
          currentPage={meta?.page ?? 1}
          onPageChange={(newPage) => applyFilters({ page: newPage })}
          onOpenModal={openCreateModal}
        />
      </div>

      {selectedOperationForNovedad && (
        <NovedadModal
          isOpen={isNovedadModalOpen}
          onClose={() => {
            setIsNovedadModalOpen(false);
            setSelectedOperationForNovedad(null);
          }}
          onSuccess={() => {
            alert('Novedad reportada con éxito en la Torre de Control.');
            fetchOperations();
          }}
          operationId={selectedOperationForNovedad.id}
          vehicleId={selectedOperationForNovedad.vehicle?.id}
          driverId={selectedOperationForNovedad.driver?.id}
          rawOperation={selectedOperationForNovedad}
          operationTitle={`${selectedOperationForNovedad.type} — ${selectedOperationForNovedad.origen?.name || 'Ruta'}`}
        />
      )}

      <AssignModal />
      <CreateModal />

      {/* OVERLAY DE TRAZABILIDAD */}
      {traceabilityId && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
            zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.2rem'
          }}
          onClick={() => setTraceabilityId(null)}
        >
          <div
            style={{
              backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '950px',
              maxHeight: '90vh', overflowY: 'auto', padding: '28px', position: 'relative',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setTraceabilityId(null)}
              style={{
                position: 'absolute', top: '20px', right: '20px',
                background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%',
                fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', transition: 'background 0.2s'
              }}
            >
              &times;
            </button>

            <div style={{ marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Torre de Control — Trazabilidad #{traceabilityId}
              </h2>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleOpenOperationNovedad(traceabilityId)}
                  style={{
                    backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca',
                    padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  🚨 Reportar Novedad
                </button>

                {/* 🛑 BOTÓN INTELIGENTE: Solo sale si el viaje se varó (PAUSADA) */}
                {isPausada && (
                  <button
                    onClick={() => handleOpenReassign(traceabilityId)}
                    style={{
                      backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
                      padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    ⚠️ Reasignar Emergencia
                  </button>
                )}
              </div>
            </div>

            <OperationTraceability operationId={traceabilityId} />
          </div>
        </div>
      )}
    </div>
  );
}
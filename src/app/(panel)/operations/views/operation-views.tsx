'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useUIStore } from '@/store/use-ui.store';
import { useTrafico } from '../hooks/useOperations';

import { CreateModal } from '../components/create-modal/create-modal';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { Button } from '@/components/atoms/button/button';
import { SuperModal } from '@/components/organisms/modal/modal';

import styles from '../operations.module.css';
import { getOperationsColumns } from '../components/operations-colums';
import { ApplySurchargeModal } from '../components/ApplySurchargeModal'; 
import { NovedadForm } from '../../novedades/components/novedades-modal/novedades-modal';

import Swal from 'sweetalert2';
import { Operation } from '@/types/operation-types';
import { OperationForm } from '../components/formOperation';
import { TraceabilityDrawer } from '@/components/organisms/TraceabilityDrawer/TraceabilityDrawer';
import { getClientColumns } from '../components/client-columns';
import { useAuthStore } from '@/store/use-auth.store';
import { OperationFilters } from '../components/OptionFilters';
import { Loader } from 'lucide-react';

const tabs = [
  { id: 'TODAS', label: 'Todas las Operaciones' },
  { id: 'EXPORTACION', label: 'Exportación' },
  { id: 'IMPORTACION', label: 'Importación' },
  { id: 'RETIRO_VACIO', label: 'Retiro Vacío' },
  { id: 'DEVOLUCION', label: 'Devolución' },
];

export function OperationsView() {
  const { operations, meta, isLoadingOperations, error, fetchOperations, setFilters } = useTrafico();
  const { user } = useAuthStore();
  const { openCreateModal, openAssignModal } = useUIStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('TODAS');
  
  const [modalTab, setModalTab] = useState<'DETAILS' | 'NOVEDAD'>('DETAILS');
  const [surchargeModalOpId, setSurchargeModalOpId] = useState<number | null>(null);

  // 🚀 ESTADOS PARA EL MODAL DE EDICIÓN / COMPLETAR DATOS
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [operationToEdit, setOperationToEdit] = useState<Operation | null>(null);

  // 🚀 ESTADO PARA LA TRAZABILIDAD INTELIGENTE MULTIDIMENSIONAL
  const [traceContext, setTraceContext] = useState<{ 
    type: 'OPERATION' | 'CONTAINER' | 'ANALYST' | 'DRIVER' | 'VEHICLE'; 
    id: string | number 
  } | null>(null);

  const handleEditOperation = (operation: Operation) => {
    setOperationToEdit(operation);
    setIsEditModalOpen(true);
  };

  const handleOpenReassign = (operationId: number) => {
    setTraceContext(null);
    openAssignModal(operationId);
  };

  const isInitialized = useRef(false);
  useEffect(() => {
    if (!isInitialized.current) {
      fetchOperations({ page: 1, limit: 10 });
      isInitialized.current = true;
    }
  }, [fetchOperations]);

  const operationColumns = getOperationsColumns(
    () => {},
    setSurchargeModalOpId,
    handleEditOperation,
    setTraceContext
  );

  const clientColumns = getClientColumns(user?.role);

  const applyFilters = (overrides?: { tab?: string; page?: number }) => {
    const currentTab = overrides?.tab || activeTab;
    fetchOperations({
      page: overrides?.page || 1,
      limit: 10,
      type: currentTab === 'TODAS' ? undefined : currentTab,
      status: statusFilter || undefined,
    });
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    applyFilters({ tab: tabId, page: 1 });
  };

  // Variables calculadas para el modal de trazabilidad (si es una operación)
  const isOperationContext = traceContext?.type === 'OPERATION';
  const traceabilityOperationId = isOperationContext ? Number(traceContext?.id) : null;
  const traceabilityOperation = operations.find(op => op.id === traceabilityOperationId);
  
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

      <OperationFilters 
        onFilter={setFilters} 
        isLoading={isLoadingOperations} 
      />

      <div className={styles.tableCard}>
        {isLoadingOperations ? (
          <div className={styles.loaderContainer}>
            <Loader />
          </div>
        ):<PaginationTable
          data={operations ?? []}
          nameButton="+ Nueva Operación"
          
          // --- PADRE (CLIENTE) ---
          columns={clientColumns} 
          
          isCollapsible={true} 
          subColumns={operationColumns} 
          getSubRows={(row) => row.operations} 
          
          // --- PAGINACIÓN ---
          totalPages={meta?.total ?? 1}
          currentPage={meta?.page ?? 1}
          onPageChange={(newPage) => setFilters({ page: newPage })}
          onOpenModal={() => openCreateModal()}
        />}
       
      </div>

      <CreateModal />

      <ApplySurchargeModal 
        isOpen={surchargeModalOpId !== null} 
        operationId={surchargeModalOpId} 
        onClose={() => {
          setSurchargeModalOpId(null);
          fetchOperations(); 
        }} 
      />

      {/* 🚀 MODAL PARA COMPLETAR / EDITAR DATOS DESDE LA FILA */}
      <SuperModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setOperationToEdit(null);
          fetchOperations();
        }}
        title={operationToEdit ? `Completar Operación #${operationToEdit.id}` : "Editar Operación"}
        width="680px"
      >
        <OperationForm 
          onClose={() => {
            setIsEditModalOpen(false);
            setOperationToEdit(null);
            fetchOperations();
          }} 
          scheduleBase={operationToEdit} 
        />
      </SuperModal>


      <TraceabilityDrawer 
        isOpen={traceContext !== null} 
        context={traceContext} 
        onClose={() => setTraceContext(null)} 
      />

      {/* 🚀 MODAL PARA TRAZABILIDAD INTELIGENTE MULTIDIMENSIONAL */}
      {/* <SuperModal
        isOpen={traceContext !== null}
        onClose={() => {
          setTraceContext(null);
          setModalTab('DETAILS'); 
        }}
        width="1000px" 
      >
        {traceContext && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Torre de Control — Trazabilidad Inteligente
                </h2>

                {isPausada && modalTab === 'DETAILS' && traceabilityOperationId && (
                  <button
                    onClick={() => handleOpenReassign(traceabilityOperationId)}
                    style={{
                      backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
                      padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    ⚠️ Reasignar Emergencia
                  </button>
                )}
              </div>
              
              {isOperationContext && (
                <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
                  <button
                    onClick={() => setModalTab('DETAILS')}
                    style={{
                      background: 'none', border: 'none', padding: '8px 4px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                      color: modalTab === 'DETAILS' ? '#2563eb' : '#64748b',
                      borderBottom: modalTab === 'DETAILS' ? '3px solid #2563eb' : '3px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    Radiografía y Liquidación
                  </button>
                  <button
                    onClick={() => setModalTab('NOVEDAD')}
                    style={{
                      background: 'none', border: 'none', padding: '8px 4px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                      color: modalTab === 'NOVEDAD' ? '#dc2626' : '#64748b',
                      borderBottom: modalTab === 'NOVEDAD' ? '3px solid #dc2626' : '3px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    🚨 Reportar Novedad
                  </button>
                </div>
              )}
            </div>
          
          </div>
        )}
      </SuperModal> */}

    </div>
  );
}
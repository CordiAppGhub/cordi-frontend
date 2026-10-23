'use client';

import React, { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { useUIStore } from '@/store/use-ui.store';
import { useTrafico } from '../hooks/useOperations';

import { CreateDrawerOperation } from '../components/create-modal/create-modal';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { Button } from '@/components/atoms/button/button';
import { SuperModal } from '@/components/organisms/modal/modal';

import styles from '../operations.module.css';
import { getOperationsColumns } from '../components/operations-colums';
import { ApplySurchargeModal } from '../components/ApplySurchargeModal';
import { OperationIssueForm } from '../components/operation-issue-form';

import { Operation } from '@/types/operation-types';
import { OperationsClientGroup } from '@/types/operation-types';
import { ColumnDef } from '@/types/table';
import { OperationForm } from '../components/formOperation';
import { TraceabilityDrawer } from '@/components/organisms/TraceabilityDrawer/TraceabilityDrawer';
import { getClientColumns } from '../components/client-columns';
import { useAuthStore } from '@/store/use-auth.store';
import { OperationFilters } from '../components/OptionFilters';
import { Loader } from 'lucide-react';
import { OperationAmparosPanel } from '../components/amparados/OperationAmparosPanel';
import { OperationResourceModal } from '../components/OperationResourceModal';
import { OperationHistoryView } from './operation-history-view';
import { useOperationHistoryStore } from '@/store/use-operation-history.store';
import { useCancelOperation } from '../hooks/use-cancel-operation';
import { useDeleteOperation } from '../hooks/use-delete-operation';
import { useQuery } from '@tanstack/react-query';
import {
  GetOperationsParams,
  operationService,
} from '@/services/operation.service';

function ClientOperationsExpansion({
  group,
  columns,
  filters,
}: {
  group: OperationsClientGroup;
  columns: ColumnDef<Operation>[];
  filters: GetOperationsParams;
}) {
  const filterKey = JSON.stringify({
    status: filters.status,
    type: filters.type,
    date: filters.date,
    placa: filters.placa,
    numeroPedido: filters.numeroPedido,
    containerNumber: filters.containerNumber,
    conductor: filters.conductor,
  });
  const [pagination, setPagination] = useState({ filterKey, page: 1 });
  const page = pagination.filterKey === filterKey ? pagination.page : 1;
  const setPage = (nextPage: number) =>
    setPagination({ filterKey, page: nextPage });
  const [limit, setLimit] = useState(10);

  const params: GetOperationsParams = {
    page,
    limit,
    status: filters.status,
    type: filters.type,
    date: filters.date,
    placa: filters.placa,
    numeroPedido: filters.numeroPedido,
    containerNumber: filters.containerNumber,
    conductor: filters.conductor,
  };
  const operationsQuery = useQuery({
    queryKey: ['trafico-client-operations', group.clientId, params],
    queryFn: () =>
      operationService.getActiveOperationsByClient(group.clientId, params),
  });
  const operations = operationsQuery.data?.data ?? [];
  const totalPages = Math.max(1, operationsQuery.data?.meta.lastPage ?? 1);

  return (
    <div style={{ padding: '12px 16px 16px 48px', background: '#f8fafc' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <span>
          {operationsQuery.data?.meta.total ?? group.totalOperaciones} operaciones
        </span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Mostrar
          <select
            aria-label={`Operaciones por página para ${group.clientName}`}
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
          >
            {[5, 10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      {operationsQuery.isLoading ? (
        <p role="status">Cargando operaciones...</p>
      ) : operationsQuery.error ? (
        <p role="alert">
          {operationsQuery.error instanceof Error
            ? operationsQuery.error.message
            : 'No se pudieron cargar las operaciones del cliente.'}
        </p>
      ) : operations.length === 0 ? (
        <p>No hay operaciones para mostrar.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    style={{
                      padding: '9px 12px',
                      background: '#f1f5f9',
                      color: '#475569',
                      textAlign: 'left',
                    }}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operations.map((operation) => (
                <tr key={operation.id}>
                  {columns.map((column) => (
                    <td
                      key={`${operation.id}-${column.id}`}
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      {column.renderCell
                        ? column.renderCell(operation)
                        : String(Reflect.get(operation, column.id) ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 10,
          marginTop: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page <= 1 || operationsQuery.isFetching}
        >
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || operationsQuery.isFetching}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

const tabs = [
  { id: 'TODAS', label: 'Todas las Operaciones' },
  { id: 'EXPORTACION', label: 'Exportación' },
  { id: 'IMPORTACION', label: 'Importación' },
  { id: 'RETIRO_VACIO', label: 'Retiro Vacío' },
  { id: 'DEVOLUCION', label: 'Devolución' },
  { id: 'NACIONAL', label: 'Nacional' },
  { id: 'CARGA_SUELTA_URBANA', label: 'Carga Suelta Urbana' },
  { id: 'CARGA_SUELTA_NACIONAL', label: 'Carga Suelta Nacional' },
  { id: 'MOVIMIENTO_INTERNO', label: 'Mov. Interno' },
];

export function OperationsView() {
  const {
    operations,
    queryParams,
    meta,
    isLoadingOperations,
    error,
    fetchOperations,
    setFilters,
    setDriverAccess,
    isSettingDriverAccess,
    updateOperation,
  } = useTrafico();
  const { cancelOperation, isCancellingOperation } = useCancelOperation();
  const { deleteOperation, isDeletingOperation } = useDeleteOperation();
  const { user } = useAuthStore();
  const { openCreateModal } = useUIStore();
  const section = useOperationHistoryStore((state) => state.section);
  const setSection = useOperationHistoryStore((state) => state.setSection);

  const [activeTab, setActiveTab] = useState('TODAS');

  const [surchargeModalOpId, setSurchargeModalOpId] = useState<number | null>(null);
  const [novedadOperation, setNovedadOperation] = useState<Operation | null>(null);

  // 🚀 ESTADOS PARA EL MODAL DE EDICIÓN / COMPLETAR DATOS
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [operationToEdit, setOperationToEdit] = useState<Operation | null>(null);
  const [operationToReassign, setOperationToReassign] = useState<Operation | null>(null);

  // 🚀 ESTADO PARA LA TRAZABILIDAD INTELIGENTE MULTIDIMENSIONAL
  const [traceContext, setTraceContext] = useState<{
    type: 'OPERATION' | 'CONTAINER' | 'ANALYST' | 'DRIVER' | 'VEHICLE';
    id: string | number
  } | null>(null);

  const handleEditOperation = (operation: Operation) => {
    setOperationToEdit(operation);
    setIsEditModalOpen(true);
  };

  const handleOpenReassign = (operation: Operation) => setOperationToReassign(operation);
  const handleReportNovedad = (operation: Operation) => setNovedadOperation(operation);
  const handleCancelOperation = async (operationId: number) => {
    const result = await Swal.fire({
      title: '¿Cancelar operación?',
      text: `La operación #${operationId} quedará marcada como cancelada.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#dc2626',
    });
    if (result.isConfirmed) await cancelOperation(operationId);
  };

  const handleDeleteOperation = async (operationId: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar operación?',
      text: `La operación #${operationId} se eliminará permanentemente y no podrá recuperarse.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#dc2626',
    });
    if (result.isConfirmed) await deleteOperation(operationId);
  };

  const isInitialized = useRef(false);
  useEffect(() => {
    if (!isInitialized.current) {
      fetchOperations({ page: 1, limit: 10 });
      isInitialized.current = true;
    }
  }, [fetchOperations]);

  const operationColumns = getOperationsColumns(
    () => { },
    setSurchargeModalOpId,
    handleEditOperation,
    setTraceContext,
    (operationId, isActive) => {
      void setDriverAccess(operationId, isActive);
    },
    user?.role === 'ADMIN' || user?.role === 'ANALISTA',
    isSettingDriverAccess,
    handleOpenReassign,
    user?.role === 'ADMIN' || user?.role === 'JEFE_DE_FLOTA' || user?.role === 'ANALISTA',
    handleReportNovedad,
    (operationId) => {
      void handleCancelOperation(operationId);
    },
    user?.role === 'ADMIN' || user?.role === 'JEFE_DE_FLOTA',
    isCancellingOperation,
    (operationId) => {
      void handleDeleteOperation(operationId);
    },
    user?.role === 'ADMIN',
    isDeletingOperation,
  ).filter((column) =>
    [
      'numeroPedido',
      'type',
      'scheduledAt',
      'vehicle',
      'origen',
      'lugarDescargue',
      'fleteACobrar',
      'fleteAPagar',
      'patioCosto',
      'patioCobro',
      'recargos',
      'totalCobrosExtras',
      'totalFacturacion',
      'rentabilidad',
      'status',
      'acciones',
    ].includes(
      String(column.id),
    ),
  );

  const clientColumns = getClientColumns();

  const applyFilters = (overrides?: { tab?: string; page?: number }) => {
    const currentTab = overrides?.tab || activeTab;
    fetchOperations({
      page: overrides?.page || 1,
      limit: 10,
      type: currentTab === 'TODAS' ? undefined : currentTab,
    });
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    applyFilters({ tab: tabId, page: 1 });
  };

  return (
    <div className={styles.layout}>
      {/* HEADER */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleContainer}>
          <span className={styles.headerNumber}>2</span>
          <div>
            <h1 className={styles.titleText}>
              {section === 'active'
                ? 'Operaciones y viajes'
                : 'Historial de operaciones'}
            </h1>
            <p className={styles.subtitleText}>
              {section === 'history'
                ? 'Consulta operaciones finalizadas o canceladas según el alcance de tu usuario.'
                : user?.role === 'ANALISTA'
                  ? 'Registra la solicitud de operación; el jefe de flota asignará el vehículo.'
                    : 'La asignación inicial se realiza en Solicitudes de flota. Aquí puedes reasignar operaciones que ya tienen vehículo.'}
            </p>
          </div>
        </div>
        {section === 'active' && (
          <Button onClick={openCreateModal} style={{ padding: '10px 18px', fontWeight: 600 }}>
            {user?.role === 'ANALISTA' ? '+ Nueva solicitud' : '+ Nueva Operación'}
          </Button>
        )}
      </div>

      <div className={styles.tabsContainer} aria-label="Vista de operaciones">
        {[
          { id: 'active' as const, label: 'Actuales' },
          { id: 'history' as const, label: 'Historial' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSection(tab.id)}
            className={`${styles.tabButton} ${section === tab.id ? styles.tabButtonActive : ''}`}
            aria-pressed={section === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {section === 'active' ? (
        <>
          <OperationAmparosPanel
            enabled={
              user?.role === 'ADMIN' ||
              user?.role === 'JEFE_DE_FLOTA' ||
              user?.role === 'ANALISTA'
            }
          />

          <div className={styles.tabsContainer} aria-label="Tipo de operación">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ''}`}
                aria-pressed={activeTab === tab.id}
              >
                {tab.label}
              </button>
            ))}
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
            ) : <PaginationTable
              data={operations ?? []}
              nameButton="+ Nueva Operación"
              hideSearch
              columns={clientColumns}
              isCollapsible={true}
              subColumns={operationColumns}
              renderExpandedContent={(row) => (
                <ClientOperationsExpansion
                  group={row}
                  columns={operationColumns}
                  filters={queryParams}
                />
              )}
              totalPages={meta?.total ?? 1}
              currentPage={meta?.page ?? 1}
              onPageChange={(newPage) => setFilters({ page: newPage })}
              onOpenModal={() => openCreateModal()}
            />}
          </div>
        </>
      ) : (
        <OperationHistoryView
          onOpenOperation={(operationId) =>
            setTraceContext({ type: 'OPERATION', id: operationId })
          }
        />
      )}

      <CreateDrawerOperation />

      <ApplySurchargeModal
        isOpen={surchargeModalOpId !== null}
        operationId={surchargeModalOpId}
        onClose={() => {
          setSurchargeModalOpId(null);
          fetchOperations();
        }}
      />

      <SuperModal
        isOpen={Boolean(novedadOperation)}
        onClose={() => setNovedadOperation(null)}
        title={novedadOperation ? `Novedad operativa · Operación #${novedadOperation.id}` : 'Reportar novedad operativa'}
        width="680px"
      >
        {novedadOperation && (
          <OperationIssueForm
            operationId={novedadOperation.id}
            onCancel={() => setNovedadOperation(null)}
            onSuccess={() => {
              setNovedadOperation(null);
              void fetchOperations();
            }}
          />
        )}
      </SuperModal>

      {/* 🚀 MODAL PARA COMPLETAR / EDITAR DATOS DESDE LA FILA */}
      <OperationForm
        key={`edit-${operationToEdit?.id ?? 'new'}`}
        isOpen={isEditModalOpen}
        scheduleBase={operationToEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setOperationToEdit(null);
          fetchOperations();
        }}
      />
      <OperationResourceModal
        key={operationToReassign?.id ?? 'closed'}
        operation={operationToReassign}
        onClose={() => setOperationToReassign(null)}
        onSave={async (operationId, resources) => {
          const saved = await updateOperation(operationId, resources);
          if (saved) await fetchOperations();
          return saved;
        }}
      />

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
'use client';

import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useUIStore } from '@/store/use-ui.store';
import { useTrafico } from '../hooks/use-operations';

import { CreateDrawerOperation } from '../components/forms/create-operation-drawer';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { Button } from '@/components/atoms/button/button';
import { Select } from '@/components/atoms/select/select';
import { SuperModal } from '@/components/organisms/modal/modal';

import styles from '../operations.module.css';
import { getOperationsColumns } from '../components/columns/operation-columns';
import { ApplySurchargeModal } from '../components/actions/apply-surcharge-modal';
import { OperationIssueForm } from '../components/forms/operation-issue-form';

import { Operation } from '@/types/operation-types';
import { OperationsClientGroup } from '@/types/operation-types';
import { ColumnDef } from '@/types/table';
import { OperationForm } from '../components/forms/operation-form';
import { TraceabilityDrawer } from '@/components/organisms/TraceabilityDrawer/TraceabilityDrawer';
import { getClientColumns } from '../components/columns/client-columns';
import { useAuthStore } from '@/store/use-auth.store';
import { OperationFilters } from '../components/filters/operation-filters';
import { Loader } from 'lucide-react';
import { OperationAmparosPanel } from '../components/amparados/operation-amparos-panel';
import { OperationDispatchDrawer } from '../components/actions/operation-dispatch-drawer';
import { OperationHistoryView } from './history/operation-history-view';
import { ImportOperationsExcelModal } from '../components/forms/import-operations-excel-modal';
import { PendingDriverExtraReports } from '../components/actions/pending-driver-extra-reports';
import { useOperationHistoryStore } from '@/store/use-operation-history.store';
import { useCancelOperation } from '../hooks/use-cancel-operation';
import { useQuery } from '@tanstack/react-query';
import { useDeleteOperation } from '../hooks/use-delete-operation';
import {
  GetOperationsParams,
  operationService,
} from '@/services/operation.service';

const financialColumnIds = new Set([
  'fleteACobrar',
  'fleteAPagar',
  'recargos',
  'totalCobrosExtras',
  'totalFacturacion',
  'rentabilidad',
]);

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
    search: filters.search,
    isContainerized: filters.isContainerized,
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
    search: filters.search,
    isContainerized: filters.isContainerized,
  };
  const operationsQuery = useQuery({
    queryKey: ['trafico-client-operations', group.clientId, params],
    queryFn: () =>
      operationService.getActiveOperationsByClient(group.clientId, params),
  });
  const operations = operationsQuery.data?.data ?? [];
  const totalPages = Math.max(1, operationsQuery.data?.meta.lastPage ?? 1);
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(
    () => new Set(),
  );
  const operationsByBooking = new Map<string | null, Operation[]>();
  for (const operation of operations) {
    const booking = operation.numeroPedido?.trim() || null;
    const bookingOperations = operationsByBooking.get(booking) ?? [];
    bookingOperations.push(operation);
    operationsByBooking.set(booking, bookingOperations);
  }
  const bookingGroups = [...operationsByBooking.entries()].sort(
    ([first], [second]) =>
      first === null
        ? 1
        : second === null
          ? -1
          : first.localeCompare(second, "es", { sensitivity: "base" }),
  );
  const renderOperationRow = (operation: Operation) => (
    <tr key={operation.id}>
      {columns.map((column) => (
        <td
          key={`${operation.id}-${column.id}`}
          className={[
            financialColumnIds.has(column.id) ? styles.financialCell : '',
            column.id === 'status' ? styles.statusCell : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ borderBottom: '1px solid #e2e8f0' }}
        >
          {column.renderCell
            ? column.renderCell(operation)
            : String(Reflect.get(operation, column.id) ?? '-')}
        </td>
      ))}
    </tr>
  );

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
          <Select
            aria-label={`Operaciones por página para ${group.clientName}`}
            value={limit}
            style={{ width: 'auto' }}
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
          </Select>
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
          <table className={styles.operationTable}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={
                      financialColumnIds.has(column.id)
                        ? styles.financialHeader
                        : undefined
                    }
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                    }}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookingGroups.map(([booking, bookingOperations]) =>
                booking && bookingOperations.length > 1 ? (
                  <React.Fragment key={booking}>
                    <tr>
                      <td
                        colSpan={columns.length}
                        style={{
                          padding: '8px 10px',
                          background: '#eef2f8',
                          borderBottom: '1px solid #dbe3ee',
                        }}
                      >
                        <button
                          type="button"
                          aria-expanded={expandedBookings.has(booking)}
                          onClick={() =>
                            setExpandedBookings((current) => {
                              const next = new Set(current);
                              if (next.has(booking)) next.delete(booking);
                              else next.add(booking);
                              return next;
                            })
                          }
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            padding: 0,
                            border: 0,
                            background: 'transparent',
                            color: '#1e3a8a',
                            cursor: 'pointer',
                            font: 'inherit',
                            fontWeight: 700,
                            textAlign: 'left',
                          }}
                        >
                          <span aria-hidden="true">
                            {expandedBookings.has(booking) ? '▼' : '▶'}
                          </span>
                          Pedido #{booking} · {bookingOperations.length}{' '}
                          operaciones
                        </button>
                      </td>
                    </tr>
                    {expandedBookings.has(booking) &&
                      bookingOperations.map(renderOperationRow)}
                  </React.Fragment>
                ) : (
                  bookingOperations.map(renderOperationRow)
                ),
              )}
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
        <Button
          variant="secondary"
          type="button"
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page <= 1 || operationsQuery.isFetching}
        >
          Anterior
        </Button>
        <span>
          Página {page} de {totalPages}
        </span>
        <Button
          variant="secondary"
          type="button"
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || operationsQuery.isFetching}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}

const tabs = [
  { id: 'TODAS', label: 'Todas las Operaciones' },
  { id: 'EXPORTACION', label: 'Exportación' },
  { id: 'IMPORTACION', label: 'Importación' },
  { id: 'RETIRO_VACIO', label: 'Retiro Vacío' },
  { id: 'DEVOLUCION_VACIO', label: 'Devolución de Vacío' },
  { id: 'NACIONAL', label: 'Nacional' },
  { id: 'MOVIMIENTO_INTERNO', label: 'Movimiento Interno' },
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
    unassignVehicle,
    isUnassigningVehicle,
  } = useTrafico();
  const { cancelOperation, isCancellingOperation } = useCancelOperation();
  const { deleteOperation, isDeletingOperation } = useDeleteOperation();
  const { user } = useAuthStore();
  const { openCreateModal } = useUIStore();
  const section = useOperationHistoryStore((state) => state.section);
  const setSection = useOperationHistoryStore((state) => state.setSection);

  const [activeTab, setActiveTab] = useState('TODAS');
  const [historyCount, setHistoryCount] = useState<number | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [surchargeModalOpId, setSurchargeModalOpId] = useState<number | null>(null);
  const [reviewExtraReportOperationId, setReviewExtraReportOperationId] =
    useState<number | null>(null);
  const [novedadOperation, setNovedadOperation] = useState<Operation | null>(null);

  // 🚀 ESTADOS PARA EL MODAL DE EDICIÓN / COMPLETAR DATOS
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [operationToEdit, setOperationToEdit] = useState<Operation | null>(null);
  const [operationToDispatch, setOperationToDispatch] = useState<Operation | null>(null);

  // 🚀 ESTADO PARA LA TRAZABILIDAD INTELIGENTE MULTIDIMENSIONAL
  const [traceContext, setTraceContext] = useState<{
    type: 'OPERATION' | 'CONTAINER' | 'ANALYST' | 'DRIVER' | 'VEHICLE';
    id: string | number
  } | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const operationId = Number(url.searchParams.get('operationId'));
    if (!Number.isInteger(operationId) || operationId <= 0) return;
    setTraceContext({ type: 'OPERATION', id: operationId });
    url.searchParams.delete('operationId');
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  const handleEditOperation = (operation: Operation) => {
    setOperationToEdit(operation);
    setIsEditModalOpen(true);
  };

  const handleOpenReassign = (operation: Operation) => setOperationToDispatch(operation);
  const handleReportNovedad = (operation: Operation) => setNovedadOperation(operation);
  const handleDeleteOperation = async (operation: Operation) => {
    const result = await Swal.fire({
      title: 'Eliminar definitivamente',
      text: `Se eliminará la operación #${operation.id}, sus operaciones hijas, evidencias, novedades y trazabilidad, incluso si está en curso. Las operaciones amparadas o vinculadas que no sean hijas se conservan, pero perderán el vínculo. No se puede deshacer. Los archivos externos no se eliminan automáticamente. Escribe ELIMINAR para confirmar.`,
      input: 'text',
      inputValidator: (value) => value === 'ELIMINAR' ? undefined : 'Escribe ELIMINAR para confirmar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar definitivamente',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#dc2626',
    });
    if (result.isConfirmed) {
      await deleteOperation(operation.id);
    }
  };
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

  const UNASSIGN_BLOCKED_STATUSES: Operation['status'][] = [
    'EN_CURSO', 'CIERRE_FISICO', 'FINALIZADO', 'CANCELADO', 'PAUSADA', 'DESVIO_REPORTADO',
  ];

  const handleUnassignOperation = async (operation: Operation) => {
    if (UNASSIGN_BLOCKED_STATUSES.includes(operation.status)) {
      await Swal.fire({
        title: 'Acción no permitida',
        text: `No se puede quitar la asignación de la operación #${operation.id} porque se encuentra en estado "${operation.status}".`,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }
    const result = await Swal.fire({
      title: '¿Quitar la asignación?',
      text: `Se retirarán el vehículo, el conductor, el remolque y el flete asignado de la operación #${operation.id}. La solicitud seguirá existiendo para volver a asignarla.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar asignación',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#dc2626',
    });
    if (result.isConfirmed) await unassignVehicle(operation.id);
  };

  const operationColumns = getOperationsColumns(
    () => { },
    (operationId, hasPendingDriverReport) => {
      if (hasPendingDriverReport) {
        setReviewExtraReportOperationId(operationId);
      } else {
        setSurchargeModalOpId(operationId);
      }
    },
    handleEditOperation,
    setTraceContext,
    (operationId, isActive) => {
      void setDriverAccess(operationId, isActive);
    },
    user?.role === 'ADMIN' ||
      user?.role === 'JEFE_DE_FLOTA' ||
      user?.role === 'ANALISTA',
    isSettingDriverAccess,
    handleOpenReassign,
    user?.role === 'ADMIN' || user?.role === 'JEFE_DE_FLOTA' || user?.role === 'ANALISTA',
    handleReportNovedad,
    (operationId) => {
      void handleCancelOperation(operationId);
    },
    user?.role === 'ADMIN' || user?.role === 'JEFE_DE_FLOTA',
    isCancellingOperation,
    (operation) => {
      void handleUnassignOperation(operation);
    },
    user?.role === 'ADMIN' ||
      user?.role === 'JEFE_DE_FLOTA' ||
      user?.role === 'ANALISTA',
    isUnassigningVehicle,
    (operation) => { void handleDeleteOperation(operation); },
    user?.role === 'ADMIN' || user?.role === 'JEFE_DE_FLOTA',
    isDeletingOperation,
    user?.role === 'ANALISTA',
  ).filter((column) =>
    [
      'numeroPedido',
      'type',
      'tipoCarga',
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
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleContainer}>
          <h1 className={styles.titleText}>Operaciones y viajes</h1>
          <p className={styles.subtitleText}>
            Control operativo, programación y consulta de viajes.
          </p>
        </div>
        <div className={styles.viewTabs} role="tablist" aria-label="Vista de operaciones">
          {[
            { id: 'active' as const, label: 'Actuales' },
            { id: 'history' as const, label: 'Historial' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={section === tab.id}
              onClick={() => setSection(tab.id)}
              className={`${styles.viewTabButton} ${
                section === tab.id ? styles.viewTabButtonActive : ''
              }`}
            >
              {tab.label}
              {tab.id === 'history' && historyCount !== null && (
                <span className={styles.viewTabCount}>{historyCount}</span>
              )}
            </button>
          ))}
        </div>
        {section === 'active' && (
          <div className={styles.headerActions}>
            <Button
              onClick={() => setIsImportModalOpen(true)}
              variant="secondary"
            >
              Cargar Excel
            </Button>
            <Button onClick={openCreateModal} className={styles.createOperationButton}>
              {user?.role === 'ANALISTA' ? '+ Nueva solicitud' : '+ Nueva Operación'}
            </Button>
          </div>
        )}
      </div>

      {section === 'active' ? (
        <>
          <div className={styles.insightGrid}>
            <PendingDriverExtraReports
              autoOpenOperationId={reviewExtraReportOperationId}
              onAutoOpenHandled={() => setReviewExtraReportOperationId(null)}
            />
            <OperationAmparosPanel
              enabled={
                user?.role === 'ADMIN' ||
                user?.role === 'JEFE_DE_FLOTA' ||
                user?.role === 'ANALISTA'
              }
            />
          </div>

          <section className={styles.workspaceCard}>
            <div className={styles.operationTypeTabs} role="tablist" aria-label="Tipo de operación">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`${styles.operationTypeTab} ${
                    activeTab === tab.id ? styles.operationTypeTabActive : ''
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <OperationFilters
              onFilter={setFilters}
              isLoading={isLoadingOperations}
            />
            {error && <div className={styles.errorMessage} role="alert">⚠️ {error}</div>}
            <div className={styles.tableCard}>
              {isLoadingOperations ? (
                <div className={styles.loaderContainer}>
                  <Loader />
                </div>
              ) : <PaginationTable
                data={operations ?? []}
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
              />}
            </div>
          </section>
        </>
      ) : (
        <section className={styles.workspaceCard}>
          <OperationHistoryView
            onCountChange={setHistoryCount}
            onOpenOperation={(operationId) =>
              setTraceContext({ type: 'OPERATION', id: operationId })
            }
          />
        </section>
      )}

      <CreateDrawerOperation />
      {isImportModalOpen && (
        <ImportOperationsExcelModal
          onClose={() => setIsImportModalOpen(false)}
          onCreated={fetchOperations}
        />
      )}

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
      <OperationDispatchDrawer
        key={operationToDispatch?.id ?? 'closed'}
        operation={operationToDispatch}
        isAnalyst={user?.role === 'ANALISTA'}
        allowAnalystFleetReassignment
        onClose={() => setOperationToDispatch(null)}
        onAssigned={() => {
          setOperationToDispatch(null);
          void fetchOperations();
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
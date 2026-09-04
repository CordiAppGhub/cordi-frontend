'use client';

import React, { useState } from 'react';

import { useUIStore } from '@/store/use-ui.store';
import { AssignModal } from '@/components/organisms/assign-modal/assign-modal';
import { CreateModal } from '@/app/(panel)/operations/components/create-modal/create-modal';
import { Button } from '@/components/atoms/button/button';
import { Operation } from '@/types/operation-types';
import { useOperations } from './hooks/useOperations';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { ColumnDef } from '@/types/table';
import { OperationTraceability } from './components/details/OperationTraceability';

import styles from './operations.module.css';
import { Badge } from '@/components/atoms/badge.tsx/badge';

export default function OperationsPage() {
  const { operations, meta, isLoadingOperations, error, fetchOperations } = useOperations();
  const { openAssignModal, openCreateModal } = useUIStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('TODAS');
  const [traceabilityId, setTraceabilityId] = useState<number | null>(null);

  // Definición de las pestañas operativas de la Torre de Control
  const tabs = [
    { id: 'TODAS', label: 'Todas las Operaciones' },
    { id: 'EXPORTACION', label: 'Exportación' },
    { id: 'IMPORTACION', label: 'Importación' },
    { id: 'RETIRO_VACIO', label: 'Retiro Vacío' },
    { id: 'DEVOLUCION', label: 'Devolución' },
  ];

  // Manejador de cambio de pestañas manteniendo filtros activos
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    fetchOperations({
      page: 1,
      limit: 10,
      type: tabId === 'TODAS' ? undefined : tabId,
      search: searchTerm || undefined,
      status: statusFilter || undefined,
    });
  };

  // Manejador del botón de búsqueda / filtrado avanzado
  const handleFilter = () => {
    fetchOperations({
      page: 1,
      limit: 10,
      type: activeTab === 'TODAS' ? undefined : activeTab,
      search: searchTerm || undefined,
      status: statusFilter || undefined,
    });
  };

  // Manejador de paginación
  const handlePageChange = (newPage: number) => {
    fetchOperations({
      page: newPage,
      limit: 10,
      type: activeTab === 'TODAS' ? undefined : activeTab,
      search: searchTerm || undefined,
      status: statusFilter || undefined,
    });
  };

  // Helper para pintar los badges de estado con diseño Enterprise
  const renderStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CREADO': return <Badge variant="info">Creado</Badge>;
      case 'ASIGNADO': return <Badge variant="warning">Asignado</Badge>;
      case 'EN_CURSO': return <Badge variant="success">En Curso</Badge>;
      case 'FINALIZADO': return <Badge variant="success">Finalizado</Badge>;
      default: return <Badge variant="default">{status || 'N/A'}</Badge>;
    }
  };

  const columns: ColumnDef<Operation>[] = [
    { 
      id: 'type', 
      header: 'Tipo de Operación', 
      type: 'text',
      renderCell: (row) => <strong style={{ color: '#1e293b' }}>{row.type}</strong>
    },
    {
      id: 'scheduledAt',
      header: 'Fecha Prog.',
      type: 'text',
      renderCell: (row: any) => (
        <span style={{ color: '#475569', fontSize: '0.9rem' }}>
          {row.scheduledAt ? new Date(row.scheduledAt).toLocaleDateString('es-CO') : '--'}
        </span>
      ),
    },
    { 
      id: 'vehicle', 
      header: 'Placa', 
      type: 'text', 
      renderCell: (row) => (
        <span style={{ fontWeight: 600, color: row.vehicle?.plate ? '#0f172a' : '#94a3b8' }}>
          {row.vehicle?.plate || 'Sin Asignar'}
        </span>
      ) 
    },
    { id: 'origen', header: 'Origen', type: 'text', renderCell: (row) => row.origen?.name || '--' },
    {
      id: 'lugarCargue',
      header: 'Lugar de Cargue',
      type: 'text',
      renderCell: (row) => {
        const isExport = row.type === 'Ingreso de Exportación' || row.type === 'Exportación';
        if (isExport && row.cargue?.name) return row.cargue.name;
        return '--';
      },
    },
    {
      id: 'lugarDescargue',
      header: 'Lugar de Descargue',
      type: 'text',
      renderCell: (row) => {
        const isImport = row.type === 'Retiro de Importación' || row.type === 'Importación';
        const nombreDescargue = row.cargue?.name || row.descargue?.name;
        if (isImport && nombreDescargue) return nombreDescargue;
        return '--';
      },
    },
    { id: 'destino', header: 'Destino', type: 'text', renderCell: (row) => row.destino?.name || '--' },
    { 
      id: 'status', 
      header: 'Estado', 
      type: 'text', 
      renderCell: (row) => renderStatusBadge(row.status) 
    },
    { 
      id: 'driver', 
      header: 'Conductor', 
      type: 'text', 
      renderCell: (row) => (
        <span style={{ color: row.driver?.name ? '#334155' : '#94a3b8' }}>
          {row.driver?.name || 'Sin asignar'}
        </span>
      ) 
    },
    {
      id: 'acciones',
      header: 'Acciones de Control',
      type: 'text',
      renderCell: (row: Operation) => (
        <div className={styles.actionsContainer}>
          {row.status === 'CREADO' ? (
            <Button onClick={() => openAssignModal(row.id)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Asignar
            </Button>
          ) : (
            <Button variant="secondary" disabled style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: 0.7 }}>
              Asignado
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={() => setTraceabilityId(row.id)}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            🔍 Trazabilidad
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.layout}>
      
      {/* HEADER DE LA VISTA */}
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

      {/* --- SISTEMA DE PESTAÑAS (TABS) MODERNAS --- */}
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* --- ZONA DE FILTROS EMPRESARIALES Y BÚSQUEDA --- */}
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
          <option value="FINALIZADO">Finalizado</option>
        </select>
        <Button onClick={handleFilter} disabled={isLoadingOperations} variant="secondary">
          {isLoadingOperations ? 'Buscando...' : '🔍 Filtrar Datos'}
        </Button>
      </div>

      {error && <div className={styles.errorMessage} role="alert">⚠️ {error}</div>}

      {/* TABLA PRINCIPAL DE DATOS */}
      <div className={styles.tableCard}>
        <PaginationTable
          data={operations ?? []}
          nameButton="+ Nueva Operación"
          columns={columns}
          totalPages={meta?.totalPages ?? 1}
          currentPage={meta?.page ?? 1}
          onPageChange={handlePageChange}
          onOpenModal={openCreateModal}
        />
      </div>

      {/* MODALES DE ACCIÓN */}
      <AssignModal />
      <CreateModal />

      {/* MODAL DE TRAZABILIDAD (VISOR EMPRESARIAL) */}
      {traceabilityId && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
            zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
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

            <div style={{ marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Torre de Control — Trazabilidad de Operación #{traceabilityId}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                Monitoreo en tiempo real de validaciones de IA, estados y evidencias fotográficas de ruta.
              </p>
            </div>

            {/* COMPONENTE DE TRAZABILIDAD INTERNA */}
            <OperationTraceability operationId={traceabilityId} />

          </div>
        </div>
      )}
    </div>
  );
}
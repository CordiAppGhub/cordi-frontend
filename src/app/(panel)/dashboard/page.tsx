'use client';

import React from 'react';
import { useAuthStore } from '@/store/use-auth.store';
import { useDashboard } from './hooks/useDashboard';
import styles from './dashboard.module.css';

// Importamos los componentes reutilizables de alto impacto
import { KpiCard } from '@/components/molecules/kpi-card/KpiCard';

import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { Button } from '@/components/atoms/button/button';
import { Badge } from '@/components/atoms/badge.tsx/badge';
import { ColumnDef } from '@/types/table';


interface DispatchRow {
    id: number;
    route: string;
    driverName: string;
    vehiclePlate: string;
    status: string;
  }

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const { data, isLoading, error, refresh } = useDashboard();

  // 1. Helper para los Badges de Estado
  const renderStatus = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case 'DISPONIBLE': 
        return <Badge variant="success">Disponible</Badge>;
      case 'EN_PROGRESO': 
      case 'EN TRANSITO':
        return <Badge variant="info">En tránsito</Badge>;
      case 'CON_NOVEDAD':
      case 'EN MANTENIMIENTO': 
        return <Badge variant="warning">Con novedad</Badge>;
      default: 
        return <Badge variant="default">{estado || 'Sin estado'}</Badge>;
    }
  };

  // 2. Definición de Columnas adaptadas a tus datos de despachos
  const dispatchColumns: ColumnDef<DispatchRow>[] = [
    { 
      id: 'vehiclePlate', 
      header: 'Placa', 
      type: 'text', 
      renderCell: (row: any) => <strong style={{ color: '#1e293b' }}>{row.vehiclePlate}</strong> 
    },
    { id: 'driverName', header: 'Conductor', type: 'text' },
    { 
      id: 'status', 
      header: 'Estado', 
      type: 'text', 
      renderCell: (row: any) => renderStatus(row.status) 
    },
    { id: 'route', header: 'Ruta / Viaje', type: 'text' },
    { 
      id: 'accion', 
      header: 'Próxima acción', 
      type: 'text', 
      renderCell: (row: any) => (
        row.status === 'DISPONIBLE' 
          ? <Button style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Asignar viaje</Button>
          : <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Monitorear</span>
      )
    }
  ];

  return (
    <div className={styles.dashboardLayout}>
      
      {/* HEADER PRINCIPAL */}
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <h2>CORDITRANS <span>TMS</span></h2>
        </div>
        <div className={styles.userInfo}>
          <span>Hola, {user?.name || 'Analista'}</span>
          <span className={styles.roleBadge}>{user?.role}</span>
          <button onClick={logout} className={styles.logoutBtn}>Cerrar Sesión</button>
        </div>
      </header>

      <main className={styles.mainContent}>
        
        {/* SUB-HEADER (Estilo Torre de Control) */}
        <div className={styles.pageHeader}>
          <div className={styles.headerTitle}>
            <span className={styles.headerNumber}>1</span>
            Torre de Control <span className={styles.headerSubtitle}>— Vista general de la flota</span>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.timeText}>🕒 {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            <button onClick={refresh} className={styles.refreshBtn} disabled={isLoading}>
              {isLoading ? 'Actualizando...' : 'Actualizado: ahora 🔄'}
            </button>
          </div>
        </div>

        {error && <div className={styles.errorMessage} role="alert">⚠️ {error}</div>}

        {/* 1. SECCIÓN: KPIs SUPERIORES (6 Columnas) */}
        <section className={styles.kpiRow}>
          <KpiCard 
            title="Total Flota" 
            value={isLoading ? '...' : (data?.kpis.disponibles || 0) + (data?.kpis.enProgreso || 0) + (data?.kpis.conNovedad || 0)} 
          />
          <KpiCard 
            title="Disponibles" 
            value={isLoading ? '...' : data?.kpis.disponibles ?? 0} 
            variant="success" 
          />
          <KpiCard 
            title="En Progreso" 
            value={isLoading ? '...' : data?.kpis.enProgreso ?? 0} 
            variant="info" 
          />
          <KpiCard 
            title="Con Novedad" 
            value={isLoading ? '...' : data?.kpis.conNovedad ?? 0} 
            variant="danger" 
          />
          <KpiCard 
            title="Completados Hoy" 
            value={isLoading ? '...' : data?.kpis.completadosHoy ?? 0} 
            variant="info" 
          />
          <KpiCard 
            title="Facturación Estimada" 
            value="$ -- M" // Aquí puedes conectar tu métrica financiera futura
            variant="default" 
          />
        </section>

        {/* 2. SECCIÓN: TABLA DE FLOTA EN TIEMPO REAL */}
        <section className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>Estado de la flota (tiempo real)</h2>
            <Button variant="secondary">Filtros</Button>
          </div>
          
          <PaginationTable
            data={data?.activeDispatches || []}
            columns={dispatchColumns}
            totalPages={1}
            currentPage={1}
            onPageChange={() => {}}
          />
        </section>

        {/* 3. SECCIÓN: WIDGETS INFERIORES */}
        <section className={styles.bottomRow}>
          
          {/* Widget 1: Mapa (Placeholder interactivo) */}
          <div className={styles.widgetCard}>
            <h3 className={styles.widgetTitle}>Ubicación en mapa</h3>
            <div className={styles.mapContainer}>
              <span className={styles.mapText}>🗺️ Integración de GPS pendiente</span>
            </div>
          </div>

          {/* Widget 2: Alertas (Conectado a tu data.alerts) */}
          <div className={styles.widgetCard}>
            <h3 className={styles.widgetTitle}>Alertas críticas</h3>
            <div className={styles.alertList}>
              {isLoading && <p className={styles.emptyText}>Cargando alertas...</p>}
              {!isLoading && (!data?.alerts || data.alerts.length === 0) && (
                <p className={styles.emptyText}>No hay alertas críticas en este momento.</p>
              )}
              {!isLoading && data?.alerts?.map((alert: any, idx: number) => (
                <div key={idx} className={styles.alertItem}>
                  <span>
                    <span className={styles.alertIcon}>
                      {alert.type === 'SOAT' ? '🔴' : '🟠'}
                    </span> 
                    {alert.message}
                  </span>
                  <strong>1</strong> {/* Si agrupas las alertas, aquí va el conteo */}
                </div>
              ))}
            </div>
            <a href="#" className={styles.ghostLink}>Ver todas las alertas</a>
          </div>

          {/* Widget 3: Combustible / Rendimiento (Mockup visual) */}
          <div className={styles.widgetCard}>
            <h3 className={styles.widgetTitle}>Combustible - Flota (hoy)</h3>
            <div className={styles.alertItem}>
              <span>⛽ Galones consumidos</span>
              <strong>1.248</strong>
            </div>
            <div className={styles.alertItem}>
              <span>💰 Valor combustible</span>
              <strong>$ 12.65 M</strong>
            </div>
            <div className={styles.alertItem}>
              <span>⏱️ Km recorridos</span>
              <strong>9.845</strong>
            </div>
            <div className={styles.alertItem}>
              <span>📈 Rendimiento prom.</span>
              <strong>6.42 km/gal</strong>
            </div>
            <a href="#" className={styles.ghostLink}>Ver detalle por placa</a>
          </div>

        </section>

      </main>
    </div>
  );
}
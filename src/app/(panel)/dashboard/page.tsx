'use client';

import React from 'react';
import { useAuthStore } from '@/store/use-auth.store';
import { useDashboard } from './hooks/useDashboard';
import styles from './dashboard.module.css';

import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { Button } from '@/components/atoms/button/button';
import { ColumnDef } from '@/types/table';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';

interface DispatchRow {
  id: number;
  vehiclePlate: string;
  driverName: string;
  status: string;
  cliente: string;
  viajeActual: string;
  ultimaUbicacion: string;
  proximaAccion: string;
}

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const { data, isLoading, isRefetching, refresh } = useDashboard();

  // Columnas adaptadas 100% a la imagen de referencia
  const dispatchColumns: ColumnDef<DispatchRow>[] = [
    { id: 'vehiclePlate', header: 'Placa', type: 'text', renderCell: (row) => <strong style={{ color: '#0f172a' }}>{row.vehiclePlate}</strong> },
    { id: 'driverName', header: 'Conductor', type: 'text' },
    { id: 'status', header: 'Estado', type: 'text', renderCell: (row) => <StatusBadge status={row.status} /> },
    { id: 'cliente', header: 'Cliente', type: 'text' },
    { id: 'viajeActual', header: 'Viaje actual', type: 'text' },
    { id: 'ultimaUbicacion', header: 'Última ubicación', type: 'text' },
    {
      id: 'proximaAccion',
      header: 'Próxima acción',
      type: 'text',
      renderCell: (row) => (
        row.proximaAccion === 'Asignar viaje' ? (
          <Button style={{ padding: '4px 12px', fontSize: '0.8rem', background: '#2563eb' }}>Asignar viaje</Button>
        ) : row.proximaAccion === 'Resolver novedad' ? (
          <Button style={{ padding: '4px 12px', fontSize: '0.8rem', background: '#dc2626' }}>Resolver</Button>
        ) : (
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{row.proximaAccion}</span>
        )
      )
    }
  ];

  if (isLoading) return <div className={styles.loading}>Cargando torre de control...</div>;

  return (
    <div className={styles.dashboardContainer}>
      
      {/* HEADER: Idéntico al mockup */}
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className={styles.headerNumber}>1</div>
          <h1 className={styles.title}>
            Torre de Control de {user?.name?.split(' ')[0] || 'Corditrans'} <span style={{ color: '#64748b', fontWeight: 400 }}>– Vista general de la flota</span>
          </h1>
        </div>
        <div className={styles.headerRight}>
          <span>🕒 {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
          <span style={{ cursor: 'pointer' }} onClick={refresh}>Actualizado: {isRefetching ? '...' : 'ahora'} 🔄</span>
        </div>
      </div>

      {/* TOP CARDS (Las 5 métricas principales) */}
      <div className={styles.topCardsGrid}>
        <div className={styles.card}>
          <h2>{data?.topCards?.totalFlota || 0}</h2>
          <p>Mulas totales</p>
        </div>
        <div className={styles.card}>
          <h2 style={{ color: '#16a34a' }}>{data?.topCards?.operativas || 0}</h2>
          <p style={{ color: '#16a34a' }}>Operativas</p>
        </div>
        <div className={styles.card}>
          <h2 style={{ color: '#f59e0b' }}>{data?.topCards?.enMantenimiento || 0}</h2>
          <p>En mantenimiento</p>
        </div>
        <div className={styles.card}>
          <h2 style={{ color: '#dc2626' }}>{data?.topCards?.noDisponibles || 0}</h2>
          <p style={{ color: '#dc2626' }}>No disponibles</p>
        </div>
        <div className={styles.card}>
          <h2 style={{ color: '#2563eb' }}>{data?.topCards?.viajesHoy || 0}</h2>
          <p>Viajes hoy</p>
        </div>
      </div>

      {/* TABLA CENTRAL */}
      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Estado de la flota (tiempo real)</h3>
          <div className={styles.tableControls}>
            <input type="text" placeholder="🔍 Buscar placa, conductor o cliente..." className={styles.searchInput} />
            <Button variant="secondary" style={{ background: 'white', color: '#0f172a', border: '1px solid #cbd5e1' }}>Filtros</Button>
          </div>
        </div>
        <PaginationTable
          data={data?.activeDispatches || []}
          columns={dispatchColumns}
          totalPages={1}
          currentPage={1}
          onPageChange={() => { }}
        />
      </div>

      {/* WIDGETS INFERIORES */}
      <div className={styles.bottomWidgetsGrid}>
        
        {/* Mapa */}
        <div className={styles.widgetCard}>
          <h3>Ubicación en mapa</h3>
          <div className={styles.mapPlaceholder}>
             <div className={styles.mapInner}>+ Mapa interactivo de rutas</div>
          </div>
        </div>

        {/* Alertas Críticas */}
        <div className={styles.widgetCard}>
          <h3>Alertas críticas</h3>
          <ul className={styles.alertList}>
             <li>
               <span><span style={{ color: '#dc2626' }}>⚠️</span> Mantenimientos pendientes</span>
               <span style={{ fontWeight: 'bold' }}>{data?.alertasCriticas?.mantenimiento || 0}</span>
             </li>
             <li>
               <span><span style={{ color: '#f59e0b' }}>⚠️</span> SOAT por vencer</span>
               <span style={{ fontWeight: 'bold' }}>{data?.alertasCriticas?.soatVencido || 0}</span>
             </li>
             <li>
               <span><span style={{ color: '#dc2626' }}>🚨</span> Viajes con Novedad (Pausados)</span>
               <span style={{ fontWeight: 'bold' }}>{data?.alertasCriticas?.novedades || 0}</span>
             </li>
          </ul>
          <a href="/novedades" className={styles.widgetLink}>Ver todas las alertas</a>
        </div>

        {/* Reemplazo de Combustible -> Central de Novedades */}
        <div className={styles.widgetCard}>
          <h3>Central de Novedades (Hoy)</h3>
          <ul className={styles.alertList} style={{ gap: '12px' }}>
             {data?.alertasCriticas?.novedades > 0 ? (
                <>
                  <li style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <strong>Fallas reportadas activas</strong>
                    <span style={{ color: '#64748b' }}>Revise el centro de novedades para proceder con la reasignación.</span>
                  </li>
                </>
             ) : (
                <li style={{ fontSize: '0.85rem', color: '#16a34a' }}>✅ No hay novedades graves bloqueando la operación.</li>
             )}
          </ul>
          <a href="/novedades" className={styles.widgetLink}>Ir al gestor de novedades</a>
        </div>
      </div>

      {/* STRIP DE INDICADORES (Footer) */}
      <div className={styles.bottomStrip}>
        <div className={styles.stripItem}>
          <span>Viajes Totales</span>
          <strong>{data?.kpis?.totalViajes || 0}</strong>
        </div>
        <div className={styles.stripItem}>
          <span>Eficiencia Operativa</span>
          <strong style={{ color: '#16a34a' }}>{data?.kpis?.tasaEficiencia || 100}% <span style={{ fontSize: '0.7rem' }}>↑</span></strong>
        </div>
        <div className={styles.stripItem}>
          <span>Disponibilidad Flota</span>
          <strong>{data?.topCards?.totalFlota ? Math.round((data.flota.disponible / data.flota.total) * 100) : 0}%</strong>
        </div>
        <div className={styles.stripItem}>
          <span>Utilización Flota</span>
          <strong>{data?.topCards?.totalFlota ? Math.round((data.flota.enRuta / data.flota.total) * 100) : 0}%</strong>
        </div>
      </div>

    </div>
  );
}
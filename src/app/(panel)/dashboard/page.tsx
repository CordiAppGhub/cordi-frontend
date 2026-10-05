'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/use-auth.store';
import { useDashboard } from './hooks/useDashboard';
import { DashboardFilters } from '@/services/dashboard.service';
import styles from './dashboard.module.css';

import { KpiCard } from '@/components/molecules/kpi-card/KpiCard';
import { LiveClock } from '@/components/atoms/liveClock/LiveClock';
import { AlertsWidget } from '@/components/molecules/alerts/AlertsWidget';
import { ActiveDispatchesTable } from './components/ActiveDispatch';

export default function DashboardPage() {
  const { user } = useAuthStore();
  
  const [filters, setFilters] = useState<DashboardFilters>({});
  
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm || undefined }));
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, isRefetching, refresh } = useDashboard(filters);

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando torre de control...</div>;
  if (!data) return null;

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
       
        <div className={styles.headerRight} style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
          <LiveClock onRefresh={refresh} isRefetching={isRefetching} />
        </div>
      </div>

      <div className={styles.topCardsGrid}>
        <KpiCard title="Total Flota" value={data.flota.total} variant="default" />
        <KpiCard title="Disponibles" value={data.flota.disponible} variant="success" />
        <KpiCard title="En Ruta" value={data.flota.enRuta} variant="info" />
        <KpiCard title="En Mantenimiento" value={data.flota.enMantenimiento} variant="warning" />
        <KpiCard 
          title="Facturación Hoy" 
          value={`$ ${(data.kpis.ingresosEstimados / 1000000).toFixed(1)}M`} 
          variant="success" 
        />
      </div>

      <ActiveDispatchesTable
        dispatches={data.activeDispatches} 
        filters={filters}
        onFiltersChange={setFilters}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

    </div>
  );
}
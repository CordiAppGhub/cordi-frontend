'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Bell, X } from 'lucide-react';
import { TabOption, Tabs } from '@/components/molecules/tabs/tabs';
import { SuperModal } from '@/components/organisms/modal/modal';
import { dashboardService } from '@/services/dashboard.service';
import styles from '@/components/organisms/navbar/navbar.module.css';
import React from 'react';

interface DriverHeaderNavProps {
  activeTab: 'current' | 'history' | 'profile';
  setActiveTab: (tab: 'current' | 'history' | 'profile') => void;
  historyCount?: number; 
  onLogout: () => void;
}

export function DriverHeaderNav({ activeTab, setActiveTab, historyCount = 0, onLogout }: DriverHeaderNavProps) {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const alertsQuery = useQuery({
    queryKey: ['dashboard', 'operation-alerts'],
    queryFn: dashboardService.getOperationAlerts,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const reassignmentAlerts = (alertsQuery.data ?? []).filter(
    (alert) => alert.type === 'RESOURCE_REASSIGNMENT',
  );

  const tabOptions: TabOption[] = [
    { 
      id: 'current', 
      label: 'Viaje Actual', 
      icon: '🚛' 
    },
    { 
      id: 'history', 
      label: 'Historial y Pagos', 
      icon: '📜',
      badge: historyCount > 0 ? historyCount : undefined 
    },
    {
      id: 'profile',
      label: 'Mi perfil',
      icon: '👤',
    },
  ];

  return (
    <>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'white', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
      <div style={{ flex: 1, maxWidth: '420px' }}>
        <Tabs 
          tabs={tabOptions} 
          activeTab={activeTab} 
          onChange={(tabId) => setActiveTab(tabId as 'current' | 'history' | 'profile')}
          fullWidth={true}
        />
      </div>
      
      <button
        type="button"
        onClick={() => setAlertsOpen(true)}
        aria-label={`Alertas de reasignación: ${reassignmentAlerts.length}`}
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', background: 'white', color: '#334155', cursor: 'pointer' }}
      >
        <Bell size={17} aria-hidden="true" />
        Alertas
        {reassignmentAlerts.length > 0 && (
          <span style={{ borderRadius: 999, padding: '2px 6px', background: '#dc2626', color: 'white', fontSize: 11, fontWeight: 700 }}>
            {reassignmentAlerts.length > 99 ? '99+' : reassignmentAlerts.length}
          </span>
        )}
      </button>

      <button 
        onClick={onLogout} 
        style={{ color: '#dc2626', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', padding: '8px 12px' }}
      >
        Cerrar Sesión
      </button>
    </div>
    <SuperModal
      isOpen={alertsOpen}
      onClose={() => setAlertsOpen(false)}
      title="Alertas de reasignación"
      width="600px"
    >
      {alertsQuery.isError ? (
        <p role="alert">No se pudieron cargar tus alertas de reasignación.</p>
      ) : alertsQuery.isPending ? (
        <p>Cargando alertas...</p>
      ) : reassignmentAlerts.length === 0 ? (
        <p>No tienes alertas de reasignación pendientes.</p>
      ) : (
        <ul className={styles.operationAlertList}>
          {reassignmentAlerts.map((alert) => (
            <li className={styles.operationAlertDetail} key={alert.id}>
              <div className={styles.operationAlertDetailHeading}>
                <AlertTriangle size={17} aria-hidden="true" />
                <strong>{alert.title}</strong>
                <span className={styles.highSeverity}>Reasignación</span>
              </div>
              <p><strong>{alert.operationLabel}:</strong> {alert.message}</p>
              <time dateTime={alert.occurredAt}>
                {new Intl.DateTimeFormat('es-CO', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(alert.occurredAt))}
              </time>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => setAlertsOpen(false)}
        className={styles.closeAlertModal}
        style={{ marginTop: 16 }}
      >
        <X size={16} aria-hidden="true" />
        Cerrar
      </button>
    </SuperModal>
    </>
  );
}
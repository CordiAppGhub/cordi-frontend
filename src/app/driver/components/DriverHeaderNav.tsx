'use client';

import { TabOption, Tabs } from '@/components/molecules/tabs/tabs';
import React from 'react';

interface DriverHeaderNavProps {
  activeTab: 'current' | 'history';
  setActiveTab: (tab: 'current' | 'history') => void;
  historyCount?: number; 
  onLogout: () => void;
}

export function DriverHeaderNav({ activeTab, setActiveTab, historyCount = 0, onLogout }: DriverHeaderNavProps) {
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
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'white', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
      <div style={{ flex: 1, maxWidth: '420px' }}>
        <Tabs 
          tabs={tabOptions} 
          activeTab={activeTab} 
          onChange={(tabId) => setActiveTab(tabId as 'current' | 'history')} 
          fullWidth={true}
        />
      </div>
      
      <button 
        onClick={onLogout} 
        style={{ color: '#dc2626', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', padding: '8px 12px' }}
      >
        Cerrar Sesión
      </button>
    </div>
  );
}
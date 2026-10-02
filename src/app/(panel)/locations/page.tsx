'use client';

import React, { useState } from 'react';
import { Users, Building2 } from 'lucide-react';
import { TabOption, Tabs } from '@/components/molecules/tabs/tabs';
import { ClientsView } from './views/clienViews';
import { LocationsView } from './views/location-views';
import { AssignmentsView } from './views/AssignmentsView';

export default function ComercialDirectoryPage() {
  const [activeTab, setActiveTab] = useState('clients');

  const tabsConfig: TabOption[] = [
    {
      id: 'clients',
      label: 'Portafolio de Clientes',
      icon: <Users size={18} />,
    },
    {
      id: 'locations',
      label: 'Ubicaciones y Nodos (Empresas)',
      icon: <Building2 size={18} />,
    },
    {
      id: 'assignments',
      label: 'Asignaciones',
      icon: <Users size={18} />,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
          Directorio Comercial y Logístico
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>
          Gestión unificada de clientes de facturación y nodos operativos (puertos, plantas y bodegas).
        </p>
      </div>

      <Tabs 
        tabs={tabsConfig} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', width: '100%' }}>
        {activeTab === 'clients' && <ClientsView />}
        {activeTab === 'locations' && <LocationsView />}
        {activeTab === 'assignments' && <AssignmentsView />}
      </div>

    </div>
  );
}
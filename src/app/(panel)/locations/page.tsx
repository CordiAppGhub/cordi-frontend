'use client';

import React, { useState } from 'react';
import { Users, Building2, Ship } from 'lucide-react';
import { TabOption, Tabs } from '@/components/molecules/tabs/tabs';
import { ClientsView } from './views/clienViews';
import { LocationsView } from './views/location-views';
import { AssignmentsView } from './views/AssignmentsView';
import { ShippingLinesView } from './views/shipping-lines-view';
import styles from './locations.module.css';

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
    {
      id: 'shipping-lines',
      label: 'Navieras',
      icon: <Ship size={18} />,
    },
  ];

  return (
    <div className={styles.directoryPage}>
      
      <div className={styles.directoryHeader}>
        <h1 className={styles.directoryTitle}>
          Directorio Comercial y Logístico
        </h1>
        <p className={styles.directorySubtitle}>
          Gestión unificada de clientes de facturación y nodos operativos (puertos, plantas y bodegas).
        </p>
      </div>

      <Tabs 
        tabs={tabsConfig} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      <div className={styles.directoryPanel}>
        {activeTab === 'clients' && <ClientsView />}
        {activeTab === 'locations' && <LocationsView />}
        {activeTab === 'assignments' && <AssignmentsView />}
        {activeTab === 'shipping-lines' && <ShippingLinesView />}
      </div>

    </div>
  );
}
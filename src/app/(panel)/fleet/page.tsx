'use client';

import React, { useState } from 'react';
import { Truck, Users } from 'lucide-react';
import styles from './fleet.module.css';
import { DriversTab } from './conductores/views/DriversTab';
import { VehiclesTab } from './vehiculos/VehiclesTab';



export default function FleetPage() {
  const [activeTab, setActiveTab] = useState<'vehiculos' | 'conductores' | 'asignaciones'>('vehiculos');

  return (
    <div className={styles.fleetContainer}>
      
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Flota & Conductores <span className={styles.liveBadge}>Live</span>
          </h1>
          <p className={styles.subtitle}>Gestión unificada de tractocamiones, personal y asignaciones</p>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'vehiculos' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('vehiculos')}
        >
          <Truck size={16} /> Vehículos & Chasis
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'conductores' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('conductores')}
        >
          <Users size={16} /> Conductores
        </button>
      </div>

      <div className={styles.tabContent}>
        <div style={{ display: activeTab === 'vehiculos' ? 'block' : 'none' }}>
          <VehiclesTab />
        </div>
        
        <div style={{ display: activeTab === 'conductores' ? 'block' : 'none' }}>
          <DriversTab />
        </div>
      </div>

    </div>
  );
}
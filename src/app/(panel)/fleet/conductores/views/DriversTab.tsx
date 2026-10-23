'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/atoms/button/button';
import { TruckLoader } from '@/components/TruckLoader';
import { useDrivers } from '@/app/(panel)/fleet/conductores/hooks/use-drivers';
import CreateDriverModal from '../components/CreateDriverModal';

import { DriverCard } from '../../components/DriverCard'; 
import styles from '../../components/fleet-cards.module.css';

import { Driver } from '@/types/drivers';

export const DriversTab = () => {
  const router = useRouter();
  const { drivers, isLoading, loadDrivers, createDriver, editDriver, deleteDriver } = useDrivers();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      loadDrivers();
      isInitialized.current = true;
    }
  }, [loadDrivers]);

  const handleOpenCreate = () => {
    setDriverToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (driver: Driver) => {
    setDriverToEdit(driver);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDriverToEdit(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
          Personal Operativo
        </h2>
        <Button 
          variant="primary" 
          onClick={handleOpenCreate}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#16a34a', border: 'none' }}
        >
          <Plus size={18} /> Registrar Conductor
        </Button>
      </div>

      {isLoading && drivers.length === 0 ? (
        <TruckLoader variant="compact" message="Sincronizando personal operativo..." />
      ) : drivers.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '60px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1' }}>
          No hay conductores registrados.
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {drivers.map((driver) => (
            <DriverCard 
              key={driver.id} 
              driver={driver} 
              onClickDetail={(id) => router.push(`/fleet/conductores/${id}`)}
              onEdit={handleOpenEdit}
              onDelete={deleteDriver}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <CreateDriverModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onCreateDriver={createDriver}
          onEditDriver={editDriver}
          driverToEdit={driverToEdit}
        />
      )}
    </div>
  );
};
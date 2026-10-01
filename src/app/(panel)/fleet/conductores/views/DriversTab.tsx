'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/atoms/button/button';
import UploadExcel from '@/components/organisms/fleet/UploadExcel';
import { useDrivers } from '@/app/(panel)/fleet/conductores/hooks/use-drivers';
import CreateDriverModal from '../components/CreateDriverModal';
import { Driver } from '@/types/drivers';

// Importamos la tarjeta y sus estilos
import { DriverCard } from '../../components/DriverCard'; 
import styles from '../../components/fleet-cards.module.css';

export const DriversTab = () => {
  const router = useRouter();
  const { drivers, isLoading, loadDrivers, uploadExcel, createDriver } = useDrivers();
  
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Módulo de Carga Excel */}
      {/* <UploadExcel
        title="Carga Masiva de Conductores"
        description={<>Sube el archivo de Excel con las columnas exactas: <strong>CÉDULA, NOMBRE, TELÉFONO.</strong></>}
        onUpload={uploadExcel}
        onSuccess={loadDrivers}
      /> */}

      {/* Cabecera del Grid */}
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

      {/* Grid de Tarjetas o Estado de Carga */}
      {isLoading && drivers.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>
          Sincronizando personal operativo...
        </div>
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
              // Al hacer clic en la tarjeta, llevamos al detalle del conductor
              onClickDetail={(id) => router.push(`/fleet/conductores/${id}`)} 
            />
          ))}
        </div>
      )}

      {/* Modal de Creación */}
      {isModalOpen && (
        <CreateDriverModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreateDriver={createDriver}
        />
      )}
    </div>
  );
};
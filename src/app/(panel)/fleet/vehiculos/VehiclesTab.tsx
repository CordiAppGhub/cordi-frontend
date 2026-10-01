'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/atoms/button/button';
import UploadExcel from '@/components/organisms/fleet/UploadExcel';
import { useVehicles } from '@/hooks/use-vehicles';
import { useAssignments } from '@/hooks/useFleet'; // 👈 1. Importamos el hook de asignaciones

// Importamos la tarjeta, estilos y modales
import styles from '../components/fleet-cards.module.css';
import CreateVehicleModal from './CreateVehicleModal';
import AssignDriverModal from '@/app/(panel)/fleet/asignaciones/components/AssignDriverModal'; // 👈 2. El modal de asignar
import { VehicleCard } from '../components/VehicleCard';

export const VehiclesTab = () => {
  const { vehicles, isLoading, loadVehicles, createVehicle, uploadExcel } = useVehicles();
  const { activeAssignments, loadActive, assignDriver, unassignVehicle } = useAssignments(); // 👈 3. Extraemos las funciones de asignación
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>(undefined);
  
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      loadVehicles();
      loadActive(); // 👈 4. Cargamos las asignaciones activas al montar
      isInitialized.current = true;
    }
  }, [loadVehicles, loadActive]);

  const handleCreateVehicle = async (formData: any) => {
    const success = await createVehicle(formData);
    if (success) {
      loadVehicles();
    }
  };

  // 🚀 Función para abrir el modal de asignación desde cualquier tarjeta
  const handleOpenAssignModal = (vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
    setIsAssignModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Cabecera del Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
          Directorio de Tractocamiones
        </h2>
        <Button 
          variant="primary" 
          onClick={() => setIsCreateModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2563eb' }}
        >
          <Plus size={18} /> Nuevo Vehículo
        </Button>
      </div>

      {/* Grid de Tarjetas o Estado de Carga */}
      {isLoading && vehicles.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>
          Sincronizando inventario de vehículos...
        </div>
      ) : vehicles.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '60px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1' }}>
          No hay vehículos registrados en la flota.
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {vehicles.map((vehicle) => {
            // Buscamos si este vehículo tiene un conductor amarrado
            const assignment = activeAssignments.find((a) => a.vehicleId === vehicle.id);

            return (
              <div key={vehicle.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <VehicleCard 
                  vehicle={vehicle} 
                  onClickEdit={(id) => console.log('Editar vehículo', id)} 
                />
                
                {/* 🚀 Vínculo rápido de Conductor integrado en la tarjeta */}
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {assignment ? (
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b' }}>Conductor: </span>
                      <strong style={{ color: '#0f172a' }}>{assignment.driver.name}</strong>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Sin conductor asignado</span>
                  )}

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {assignment ? (
                      <button
                        onClick={() => unassignVehicle(vehicle.id, vehicle.plate)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        Liberar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenAssignModal(vehicle.id)}
                        style={{ background: '#eff6ff', border: '1px solid #dbeafe', color: '#1d4ed8', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        + Asignar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Creación */}
      <CreateVehicleModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateVehicle={handleCreateVehicle}
      />

      {/* Modal de Asignación de Conductor */}
      <AssignDriverModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={assignDriver}
        initialVehicleId={selectedVehicleId}
      />

    </div>
  );
};
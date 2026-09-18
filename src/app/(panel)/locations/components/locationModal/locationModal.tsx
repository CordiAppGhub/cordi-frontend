'use client';

import React, { useState } from 'react';
import styles from './location-modal.module.css';
import { useLocations } from '@/app/(panel)/locations/hooks/useLocation';
import { Button } from '@/components/atoms/button/button';
import { Input } from '@/components/atoms/input/input';
import { locationSchema } from '@/schemas/location.schema';
import { Location } from '@/types/location.types';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationToEdit?: Location | null;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, locationToEdit }) => {
  const { createLocation, updateLocation, isLoadingLocations } = useLocations();
  
  const [formData, setFormData] = useState(() => {
    if (locationToEdit) {
      return {
        name: locationToEdit.name,
        address: locationToEdit.address || '',
        isPort: locationToEdit.isPort,
        isDepot: locationToEdit.isDepot,
        isClient: locationToEdit.isClient,
        isOrigin: locationToEdit.isOrigin,
        isDestination: locationToEdit.isDestination,
      };
    }
    return {
      name: '', address: '', isPort: false, isDepot: false, isClient: false, isOrigin: true, isDestination: true,
    };
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Inyectamos analystId temporal (luego vendrá de tu AuthContext)
    const validation = locationSchema.safeParse({ ...formData, analystId: 1 }); 
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        fieldErrors[String(issue.path[0])] = issue.message; 
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      if (locationToEdit) {
        await updateLocation(locationToEdit.id, formData);
      } else {
        await createLocation(formData);
      }
      onClose();
    } catch (error) {
      console.error("Error guardando ubicación", error);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className={styles.title}>{locationToEdit ? 'Editar Ubicación' : 'Registrar Nueva Ubicación'}</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label className="text-sm font-semibold mb-1 block text-gray-700">Nombre del Lugar / Patio</label>
            <Input 
              placeholder="Ej: Sociedad Portuaria SPRC"
              value={formData.name}
              onChange={(e: any) => handleChange('name', e.target.value)}
              error={errors.name}
            />
          </div>

          <div className="form-group">
            <label className="text-sm font-semibold mb-1 block text-gray-700">Dirección (Opcional)</label>
            <Input 
              placeholder="Ej: Manga, Terminal Marítimo"
              value={formData.address}
              onChange={(e: any) => handleChange('address', e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '10px' }}>
            {/* ROLES LOGÍSTICOS */}
            <div style={{ border: '1px solid #eee', padding: '10px', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>TIPO DE INSTALACIÓN</h4>
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', fontSize: '14px' }}>
                <input type="checkbox" checked={formData.isPort} onChange={(e) => handleChange('isPort', e.target.checked)} /> Es Puerto / Terminal
              </label>
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', fontSize: '14px' }}>
                <input type="checkbox" checked={formData.isDepot} onChange={(e) => handleChange('isDepot', e.target.checked)} /> Es Patio de Vacíos
              </label>
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px' }}>
                <input type="checkbox" checked={formData.isClient} onChange={(e) => handleChange('isClient', e.target.checked)} /> Es Bodega Privada
              </label>
            </div>

            {/* PERMISOS DE RUTA */}
            <div style={{ border: '1px solid #eee', padding: '10px', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>PERMISOS DE RUTA</h4>
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', fontSize: '14px' }}>
                <input type="checkbox" checked={formData.isOrigin} onChange={(e) => handleChange('isOrigin', e.target.checked)} /> Puede ser Origen
              </label>
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px' }}>
                <input type="checkbox" checked={formData.isDestination} onChange={(e) => handleChange('isDestination', e.target.checked)} /> Puede ser Destino
              </label>
            </div>
          </div>

          <div className={styles.actions} style={{ marginTop: '20px' }}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoadingLocations}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isLoadingLocations}>
              {isLoadingLocations ? 'Guardando...' : 'Guardar Ubicación'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
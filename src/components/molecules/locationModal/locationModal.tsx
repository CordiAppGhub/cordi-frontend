'use client';

import React, { useState, useEffect } from 'react';
import { useLocations } from '../../../hooks/useLocation';
import { locationSchema } from '../../../schemas/location.schema';
import { Input } from '../../atoms/input/input';
import { Button } from '../../atoms/button/button';
import { Location } from '../../../types/location.types';
import styles from '../../organisms/assign-modal/assign-modal.module.css';

export interface Tarifa {
  id?: number;
  operacion: string;
  valor: number | string;
}

// 1. 👇 LO MOVEMOS AFUERA DEL COMPONENTE para evitar el error del useEffect
const defaultState = {
  name: '', 
  address: '', 
  isPort: false, 
  isDepot: false, 
  isClient: false, 
  isOrigin: true, 
  isDestination: true,
  tarifas: [] as Tarifa[]
};

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
        tarifas: (locationToEdit as Location & { tarifas?: Tarifa[] }).tarifas || [], 
      };
    }
    return {
      name: '', address: '', isPort: false, isDepot: false, isClient: false, isOrigin: true, isDestination: true,
      tarifas: [] as Tarifa[]
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

 

  if (!isOpen) return null;

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // ==========================================
  // MANEJO DINÁMICO DEL TARIFARIO
  // ==========================================
  const handleAddTarifa = () => {
    setFormData((prev) => ({
      ...prev,
      tarifas: [...prev.tarifas, { operacion: '', valor: '' }]
    }));
  };

  const handleRemoveTarifa = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tarifas: prev.tarifas.filter((_, i) => i !== index)
    }));
  };

  const handleTarifaChange = (index: number, field: keyof Tarifa, value: string) => {
    const newTarifas = [...formData.tarifas];
    newTarifas[index] = { ...newTarifas[index], [field]: field === 'valor' ? Number(value) || '' : value };
    setFormData((prev) => ({ ...prev, tarifas: newTarifas }));
  };

  // ==========================================
  // ENVÍO DE DATOS
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validamos que las tarifas no tengan campos vacíos si existen
    const invalidTarifas = formData.tarifas.some(t => !t.operacion || !t.valor);
    if (invalidTarifas) {
      setErrors({ ...errors, tarifas: 'Todas las tarifas deben tener operación y valor.' });
      return;
    }

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
      <div className={styles.modal} style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className={styles.title}>{locationToEdit ? 'Editar Empresa' : 'Registrar Nueva Empresa'}</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label className="text-sm font-semibold mb-1 block text-gray-700">Nombre de la Empresa / Patio</label>
            <Input 
              placeholder="Ej: Contecar, Gamalog..."
              value={formData.name}
              onChange={(e: any) => handleChange('name', e.target.value)}
              error={errors.name}
            />
          </div>

          <div className="form-group">
            <label className="text-sm font-semibold mb-1 block text-gray-700">Dirección (Opcional)</label>
            <Input 
              placeholder="Ej: Mamonal Km 1"
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
                <input type="checkbox" checked={formData.isClient} onChange={(e) => handleChange('isClient', e.target.checked)} /> Es Bodega Cliente
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

          {/* ========================================== */}
          {/* SECCIÓN DEL TARIFARIO */}
          {/* ========================================== */}
          <div style={{ border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px', marginTop: '8px', backgroundColor: '#f9fafb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>Tarifario de Operaciones</h4>
              <Button type="button" variant="secondary" onClick={handleAddTarifa} style={{ padding: '4px 8px', fontSize: '12px' }}>
                + Añadir Tarifa
              </Button>
            </div>

            {errors.tarifas && <p style={{ color: 'red', fontSize: '12px', marginBottom: '8px' }}>{errors.tarifas}</p>}

            {formData.tarifas.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', fontStyle: 'italic' }}>
                No hay tarifas configuradas para este cliente.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formData.tarifas.map((tarifa, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ flex: 2 }}>
                      <Input 
                        placeholder="Operación (Ej: Urbano Directo Exportacion)" 
                        value={tarifa.operacion}
                        onChange={(e: any) => handleTarifaChange(index, 'operacion', e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Input 
                        type="number"
                        placeholder="Valor ($)" 
                        value={tarifa.valor.toString()}
                        onChange={(e: any) => handleTarifaChange(index, 'valor', e.target.value)}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTarifa(index)}
                      style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: '18px' }}
                      title="Eliminar tarifa"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.actions} style={{ marginTop: '20px' }}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoadingLocations}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isLoadingLocations}>
              {isLoadingLocations ? 'Guardando...' : 'Guardar Empresa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
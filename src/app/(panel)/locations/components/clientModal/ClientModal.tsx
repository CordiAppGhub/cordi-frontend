'use client';

import React, { useState } from 'react';
import styles from './client-modal.module.css';
import { Button } from '@/components/atoms/button/button';
import { Input } from '@/components/atoms/input/input';
import { useClients } from '@/hooks/useClient';
import { clientSchema } from '@/schemas/client-schema';
import { Client } from '@/types/client.-types';


interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, clientToEdit }) => {
  const { createClient, updateClient, isLoadingClients } = useClients();
  
  const [formData, setFormData] = useState(() => ({
    nit: clientToEdit?.nit || '',
    razonSocial: clientToEdit?.razonSocial || '',
    contactName: clientToEdit?.contactName || '',
    contactPhone: clientToEdit?.contactPhone || '',
    contactEmail: clientToEdit?.contactEmail || '',
    isActive: clientToEdit ? clientToEdit.isActive : true,
  }));
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = clientSchema.safeParse(formData); 
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        fieldErrors[String(issue.path[0])] = issue.message; 
      });
      setErrors(fieldErrors);
      return;
    }

    const success = clientToEdit 
      ? await updateClient(clientToEdit.id, formData)
      : await createClient(formData);
      
    if (success) onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>{clientToEdit ? 'Editar Perfil Comercial' : 'Alta de Nuevo Cliente'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.fullWidth}>
              <label className="text-sm font-semibold mb-1 block text-gray-700">Razón Social *</label>
              <Input 
                placeholder="Ej: Gamalog S.A.S"
                value={formData.razonSocial}
                onChange={(e: any) => handleChange('razonSocial', e.target.value)}
                error={errors.razonSocial}
              />
            </div>
            
            <div>
              <label className="text-sm font-semibold mb-1 block text-gray-700">NIT *</label>
              <Input 
                placeholder="Ej: 900.123.456-7"
                value={formData.nit}
                onChange={(e: any) => handleChange('nit', e.target.value)}
                error={errors.nit}
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block text-gray-700">Estado Comercial</label>
              <label style={{ display: 'flex', alignItems: 'center', height: '42px', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.isActive} 
                  onChange={(e) => handleChange('isActive', e.target.checked)} 
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: '14px', color: formData.isActive ? '#16a34a' : '#ef4444', fontWeight: '500' }}>
                  {formData.isActive ? 'Activo (Permite Operaciones)' : 'Inactivo (Bloqueado)'}
                </span>
              </label>
            </div>

            <div className={styles.fullWidth}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginTop: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>Datos de Contacto (Facturación/Operaciones)</h4>
            </div>

            <div className={styles.fullWidth}>
              <Input 
                placeholder="Nombre del contacto principal"
                value={formData.contactName}
                onChange={(e: any) => handleChange('contactName', e.target.value)}
              />
            </div>
            <div>
              <Input 
                placeholder="Teléfono móvil o fijo"
                value={formData.contactPhone}
                onChange={(e: any) => handleChange('contactPhone', e.target.value)}
              />
            </div>
            <div>
              <Input 
                placeholder="Correo electrónico"
                type="email"
                value={formData.contactEmail}
                onChange={(e: any) => handleChange('contactEmail', e.target.value)}
                error={errors.contactEmail}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoadingClients}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={isLoadingClients}>
              {isLoadingClients ? 'Procesando...' : 'Guardar Cliente'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
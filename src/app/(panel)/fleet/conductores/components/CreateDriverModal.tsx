'use client';

import { SuperModal } from '@/components/organisms/modal/modal';
import React, { useState } from 'react';

interface CreateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDriver: (data: { cedula: string; name?: string; telefono?: string }) => Promise<boolean>;
}

export default function CreateDriverModal({ isOpen, onClose, onCreateDriver }: CreateDriverModalProps) {
  const [cedula, setCedula] = useState('');
  const [name, setName] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula) return;

    setIsSubmitting(true);
    const success = await onCreateDriver({
      cedula,
      name: name ? name.toUpperCase() : undefined,
      telefono: telefono ? telefono.replace(/\s+/g, '') : undefined,
    });
    setIsSubmitting(false);

    if (success) {
      setCedula('');
      setName('');
      setTelefono('');
      onClose();
    }
  };

  return (
    <SuperModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Registrar Nuevo Conductor"
      width="450px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
            Cédula *
          </label>
          <input
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="Ej: 1143396664"
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#f9fafb',
              fontSize: '0.95rem',
            }}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
            Nombre Completo
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: DANIEL FLOREZ"
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#f9fafb',
              fontSize: '0.95rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
            Teléfono (Para WhatsApp)
          </label>
          <input
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej: 3105617132"
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#f9fafb',
              fontSize: '0.95rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !cedula}
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 500,
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Conductor'}
          </button>
        </div>

      </form>
    </SuperModal>
  );
}
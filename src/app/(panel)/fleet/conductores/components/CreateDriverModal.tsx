import { SuperModal } from '@/components/organisms/modal/modal';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/atoms/button/button';
import { Driver } from '@/types/drivers';

interface CreateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDriver?: (data: { cedula: string; name?: string; telefono?: string }) => Promise<boolean>;
  onEditDriver?: (id: number, data: { cedula?: string; name?: string; telefono?: string }) => Promise<boolean>;
  driverToEdit?: Driver | null;
}

export default function CreateDriverModal({
  isOpen,
  onClose,
  onCreateDriver,
  onEditDriver,
  driverToEdit,
}: CreateDriverModalProps) {
  const [cedula, setCedula] = useState('');
  const [name, setName] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (driverToEdit) {
      setCedula(driverToEdit.cedula || '');
      setName(driverToEdit.name || '');
      setTelefono(driverToEdit.telefono || '');
    } else {
      setCedula('');
      setName('');
      setTelefono('');
    }
  }, [driverToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula) return;

    setIsSubmitting(true);
    try {
      let success = false;
      if (driverToEdit && onEditDriver) {
        success = await onEditDriver(driverToEdit.id, {
          cedula,
          name: name ? name.toUpperCase() : undefined,
          telefono: telefono ? telefono.replace(/\s+/g, '') : undefined,
        });
      } else if (onCreateDriver) {
        success = await onCreateDriver({
          cedula,
          name: name ? name.toUpperCase() : undefined,
          telefono: telefono ? telefono.replace(/\s+/g, '') : undefined,
        });
      }

      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(driverToEdit);

  return (
    <SuperModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? 'Editar Conductor' : 'Registrar Nuevo Conductor'}
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
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              width: 'auto',
              minHeight: 'auto',
              padding: '10px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={!cedula}
            style={{
              width: 'auto',
              minHeight: 'auto',
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {isEditing ? 'Guardar Cambios' : 'Registrar Conductor'}
          </Button>
        </div>

      </form>
    </SuperModal>
  );
}
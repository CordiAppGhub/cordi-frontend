import { SuperModal } from '@/components/organisms/modal/modal';
import React, { useState } from 'react';
import { Button } from '@/components/atoms/button/button';
import { Select } from '@/components/atoms/select/select';
import { Driver } from '@/types/drivers';
import type { CreateDriverDto, UpdateDriverDto } from '@/types/drivers';
import type { VehicleAffiliation } from '@/types/vehicles';

interface CreateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDriver?: (data: CreateDriverDto) => Promise<boolean>;
  onEditDriver?: (id: number, data: UpdateDriverDto) => Promise<boolean>;
  driverToEdit?: Pick<
    Driver,
    'id' | 'cedula' | 'name' | 'telefono' | 'affiliation'
  > | null;
}

const affiliationOptions: { value: VehicleAffiliation; label: string }[] = [
  { value: 'CORDIVEHICULOS', label: 'Cordivehículos' },
  { value: 'CORDIHUB', label: 'Cordihub' },
  { value: 'TERCEROS', label: 'Terceros' },
];

const isVehicleAffiliation = (
  value: string,
): value is VehicleAffiliation =>
  affiliationOptions.some((option) => option.value === value);

export default function CreateDriverModal({
  isOpen,
  onClose,
  onCreateDriver,
  onEditDriver,
  driverToEdit,
}: CreateDriverModalProps) {
  const [cedula, setCedula] = useState(driverToEdit?.cedula ?? '');
  const [name, setName] = useState(driverToEdit?.name ?? '');
  const [telefono, setTelefono] = useState(driverToEdit?.telefono ?? '');
  const [affiliation, setAffiliation] = useState<VehicleAffiliation | ''>(
    driverToEdit?.affiliation ?? '',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(driverToEdit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula || !affiliation || (!isEditing && !name.trim())) return;

    setIsSubmitting(true);
    try {
      let success = false;
      if (driverToEdit && onEditDriver) {
        success = await onEditDriver(driverToEdit.id, {
          cedula,
          name: name ? name.toUpperCase() : undefined,
          telefono: telefono ? telefono.replace(/\s+/g, '') : undefined,
          affiliation,
        });
      } else if (onCreateDriver) {
        success = await onCreateDriver({
          cedula,
          name: name.trim().toUpperCase(),
          telefono: telefono ? telefono.replace(/\s+/g, '') : undefined,
          affiliation,
        });
      }

      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Nombre Completo{!isEditing && ' *'}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: DANIEL FLOREZ"
            required={!isEditing}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
            Empresa de afiliación *
          </label>
          <Select
            value={affiliation}
            onChange={(event) => {
              const value = event.target.value;
              if (value === '') {
                setAffiliation('');
              } else if (isVehicleAffiliation(value)) {
                setAffiliation(value);
              }
            }}
            options={affiliationOptions}
            required
            aria-label="Empresa de afiliación del conductor"
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
            disabled={!cedula || !affiliation || (!isEditing && !name.trim())}
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
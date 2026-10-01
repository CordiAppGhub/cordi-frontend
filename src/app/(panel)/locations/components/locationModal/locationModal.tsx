'use client';

import React, { useState } from 'react';
import { useLocations } from '../../hooks/useLocation';
import { useClients } from '@/hooks/useClient'; 
import { Locations } from '@/types/location.types';
import { locationSchema } from '@/schemas/location.schema';
import { SuperModal } from '@/components/organisms/modal/modal';
import { SuperForm } from '@/components/organisms/form/form';
import { FormField } from '@/components/organisms/form/types/form.types';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationToEdit?: Locations | null;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, locationToEdit }) => {
  const { createLocation, updateLocation, isLoadingLocations } = useLocations();
  const { clients, isLoadingClients } = useClients();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  // Extraemos los IDs de los clientes que ya operan en esta ubicación al editar
  const initialClientIds = locationToEdit?.clients
    ? locationToEdit.clients.map((item) => String(item.clientId))
    : [];

  const defaultValues = locationToEdit ? {
    name: locationToEdit.name,
    address: locationToEdit.address || '',
    isPort: locationToEdit.isPort,
    isDepot: locationToEdit.isDepot,
    isClient: locationToEdit.isClient,
    isOrigin: locationToEdit.isOrigin,
    isDestination: locationToEdit.isDestination,
    exigeCita: locationToEdit.exigeCita || false, // 🚀 NUEVO: Cargamos el estado si estamos editando
    clientIds: initialClientIds,
  } : {
    name: '', 
    address: '', 
    isPort: false, 
    isDepot: false, 
    isClient: false, 
    isOrigin: true, 
    isDestination: true,
    exigeCita: false, // 🚀 NUEVO: Por defecto no exige cita
    clientIds: [],
  };

  const formFields: FormField[] = [
    { name: 'name', label: 'Nombre del Lugar / Parque', type: 'text', placeholder: 'Ej: Parqueamérica' },
    { name: 'address', label: 'Dirección (Opcional)', type: 'text', placeholder: 'Ej: Manga, Terminal Marítimo' },
    
    // SELECTOR MÚLTIPLE DE CLIENTES OPERATIVOS
    {
      name: 'clientIds',
      label: 'Clientes que operan en esta ubicación',
      type: 'multiselect',
      options: clients.map((c) => ({
        value: String(c.id),
        label: `${c.razonSocial} (NIT: ${c.nit})`,
      })),
      disabled: isLoadingClients,
      placeholder: 'Selecciona los clientes asociados...',
    },

    { name: 'isPort', label: 'Tipo: Es Puerto / Terminal', type: 'checkbox' },
    { name: 'isDepot', label: 'Tipo: Es Patio de Vacíos', type: 'checkbox' },
    { name: 'isClient', label: 'Tipo: Es Bodega Privada', type: 'checkbox' },
    { name: 'isOrigin', label: 'Ruta: Puede ser Origen', type: 'checkbox' },
    { name: 'isDestination', label: 'Ruta: Puede ser Destino', type: 'checkbox' },
    
    { 
      name: 'exigeCita', 
      label: 'Operación: Exige agendamiento de cita previa', 
      type: 'checkbox' 
    },
  ];

  const handleSubmit = async (formData: Record<string, any>) => {
    // Convertimos los IDs seleccionados a un arreglo numérico para la API
    const rawClientIds = Array.isArray(formData.clientIds) ? formData.clientIds : [];
    const clientIds = rawClientIds.map((id: string | number) => Number(id)).filter(Boolean);

    const payload = {
      ...formData,
      name: formData.name?.trim(),
      exigeCita: Boolean(formData.exigeCita),
      clientIds,
    };

    const validation = locationSchema.safeParse(payload);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        fieldErrors[String(issue.path[0])] = issue.message;
      });
      setValidationErrors(fieldErrors);
      return;
    }

    try {
      if (locationToEdit) {
        await updateLocation(locationToEdit.id, validation.data);
      } else {
        await createLocation(validation.data);
      }
      onClose();
    } catch (error) {
      console.error("Error guardando ubicación", error);
    }
  };

  return (
    <SuperModal
      isOpen={isOpen}
      onClose={onClose}
      title={locationToEdit ? 'Editar Ubicación' : 'Registrar Nueva Ubicación'}
      width="600px"
    >
      <SuperForm
        fields={formFields}
        defaultValues={defaultValues}
        errors={validationErrors}
        isLoading={isLoadingLocations || isLoadingClients}
        submitText={locationToEdit ? 'Actualizar Ubicación' : 'Guardar Ubicación'}
        cancelText="Cancelar"
        onSubmit={handleSubmit}
        onCancel={onClose}
        onChange={() => setValidationErrors({})}
      />
    </SuperModal>
  );
};
import { useState } from 'react';
import { useClients } from '@/hooks/useClient'; 
import { Locations } from '@/types/location.types';
import { locationSchema } from '@/schemas/location.schema';
import { FormField } from '@/components/organisms/form/types/form.types';
import styles from '../components/locationModal/LocationModal.module.css';
import { useLocations } from './useLocation';

interface UseLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationToEdit?: Locations | null;
}

export const useLocationModal = ({ isOpen, onClose, locationToEdit }: UseLocationModalProps) => {
  const { createLocation, updateLocation, isLoadingLocations } = useLocations();
  const { clients, isLoadingClients } = useClients();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const initialClientsData = locationToEdit?.clients
    ? locationToEdit.clients.map((item: any) => ({
        clientId: item.clientId,
        isClient: item.isClient ?? true,
        isDepot: item.isDepot ?? false,
      }))
    : [];

  const defaultValues = {
    name: locationToEdit?.name || '',
    address: locationToEdit?.address || '',
    isPort: locationToEdit?.isPort || false,
    isDepot: locationToEdit?.isDepot || false,
    isOrigin: locationToEdit?.isOrigin ?? true,
    isDestination: locationToEdit?.isDestination ?? true,
    exigeCita: locationToEdit?.exigeCita || false, 
    clientsData: initialClientsData, 
  };

  const formFields: FormField[] = [
    { name: 'name', label: 'Nombre del Lugar / Parque *', type: 'text', placeholder: 'Ej: Parqueamérica / Patio Seco' },
    { name: 'address', label: 'Dirección (Opcional)', type: 'text', placeholder: 'Ej: Vía Mamonal' },
    
    { name: 'isPort', label: 'Es Puerto Marítimo (Público)', type: 'checkbox' },
    { name: 'isDepot', label: 'Es Patio de Vacíos (Independiente)', type: 'checkbox' },
    
    { name: 'isOrigin', label: 'Ruta: Puede ser Origen', type: 'checkbox' },
    { name: 'isDestination', label: 'Ruta: Puede ser Destino', type: 'checkbox' },
    
    { 
      name: 'exigeCita', 
      label: 'Operación: Exige agendamiento de cita previa', 
      type: 'checkbox',
      fullWidth: true 
    },

    {
      name: 'clientsData',
      label: 'Asignación Comercial Masiva (Funciones por Cliente)',
      type: 'custom',
      visible: (currentValues) => !currentValues?.isPort && !currentValues?.isDepot,
      fullWidth: true,
      render: (value: any[] = [], onChange) => {
        if (isLoadingClients) return <span className={styles.loadingText}>Cargando portafolio...</span>;

        return (
          <div className={styles.clientAssignmentsContainer}>
            {clients.map((client) => {
              const clientAssignment = value.find((v: any) => v.clientId === client.id);
              const isSelected = Boolean(clientAssignment);

              return (
                <div key={client.id} className={`${styles.clientRow} ${isSelected ? styles.clientRowActive : ''}`}>
                  <label className={styles.clientToggle}>
                    <input
                      type="checkbox"
                      className={styles.mainCheckbox}
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onChange([...value, { clientId: client.id, isClient: true, isDepot: false }]);
                        } else {
                          onChange(value.filter((v: any) => v.clientId !== client.id));
                        }
                      }}
                    />
                    <span className={styles.clientName}>
                      {client.razonSocial} <span className={styles.clientNit}>({client.nit})</span>
                    </span>
                  </label>

                  {isSelected && (
                    <div className={styles.granularRoles}>
                      <span className={styles.roleLabel}>Funciones para {client.razonSocial}:</span>
                      <div className={styles.roleToggles}>
                        <label className={styles.subCheckboxLabel}>
                          <input
                            type="checkbox"
                            checked={clientAssignment.isClient}
                            onChange={(e) => {
                              onChange(value.map((v: any) => 
                                v.clientId === client.id ? { ...v, isClient: e.target.checked } : v
                              ));
                            }}
                          />
                          Bodega / Sede
                        </label>
                        <label className={styles.subCheckboxLabel}>
                          <input
                            type="checkbox"
                            checked={clientAssignment.isDepot}
                            onChange={(e) => {
                              onChange(value.map((v: any) => 
                                v.clientId === client.id ? { ...v, isDepot: e.target.checked } : v
                              ));
                            }}
                          />
                          Patio de Vacíos
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      }
    },
  ];

  const handleSubmit = async (formData: Record<string, any>) => {
    const isPort = Boolean(formData.isPort);
    const isDepot = Boolean(formData.isDepot);
    let clientsData = Array.isArray(formData.clientsData) ? formData.clientsData : [];

    if (isPort || isDepot) {
      clientsData = [];
    } else {
      clientsData = clientsData.map((item: any) => ({
        clientId: Number(item.clientId),
        isClient: Boolean(item.isClient),
        isDepot: Boolean(item.isDepot),
      })).filter((item: any) => item.clientId && (item.isClient || item.isDepot));
    }

    const payload = {
      name: String(formData.name || '').trim(),
      address: String(formData.address || '').trim(),
      isPort,
      isDepot,
      isOrigin: Boolean(formData.isOrigin),
      isDestination: Boolean(formData.isDestination),
      exigeCita: Boolean(formData.exigeCita),
      clientsData,
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

  return {
    defaultValues,
    formFields,
    validationErrors,
    isLoading: isLoadingLocations || isLoadingClients,
    handleSubmit,
    clearErrors: () => setValidationErrors({}),
  };
};
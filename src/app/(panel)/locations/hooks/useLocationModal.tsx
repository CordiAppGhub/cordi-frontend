import { useState, useMemo } from 'react';
import { useClients } from '@/hooks/useClient'; 
import { Locations } from '@/types/location.types';
import { locationSchema } from '@/schemas/location.schema';
import { FormField } from '@/components/organisms/form/types/form.types';
import type { FormFieldValue } from '@/components/organisms/form/types/form.types';
import type { ClientLocationRelation } from '@/types/location.types';
import styles from '../components/locationModal/LocationModal.module.css';
import { useLocations } from './useLocation';

interface ClientAssignmentFormValue {
  clientId: number;
  isClient: boolean;
  isDepot: boolean;
}

interface UseLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationToEdit?: Locations | null;
}

export const useLocationModal = ({ onClose, locationToEdit }: UseLocationModalProps) => {
  const { createLocation, updateLocation, isLoadingLocations } = useLocations();
  const { clients, isLoadingClients } = useClients();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // 1. Memorizamos los valores por defecto para que no se recreen en cada render
  const defaultValues = useMemo(() => {
    const initialClientsData = locationToEdit?.clients
      ? locationToEdit.clients.map((item: ClientLocationRelation) => ({
          clientId: item.clientId,
          isClient: item.isClient ?? true,
          isDepot: item.isDepot ?? false,
        }))
      : [];

    return {
      name: locationToEdit?.name || '',
      address: locationToEdit?.address || '',
      city: locationToEdit?.city || '',
      isPort: locationToEdit?.isPort ?? false,
      isDepot: locationToEdit?.isDepot ?? false,
      isOwnYard: locationToEdit?.isOwnYard ?? false,
      hasClientYard:
        locationToEdit?.hasClientYard ??
        Boolean(locationToEdit?.clients?.some((client) => client.isDepot)),
      isOrigin: locationToEdit?.isOrigin ?? true,
      isDestination: locationToEdit?.isDestination ?? true,
      exigeCita: locationToEdit?.exigeCita || false, 
      clientsData: initialClientsData, 
    };
  }, [locationToEdit]); // Solo cambia si editas una ubicación diferente

  // 2. Memorizamos la estructura del formulario
  const formFields: FormField[] = useMemo(() => [
    { name: 'name', label: 'Nombre del Lugar / Parque *', type: 'text', placeholder: 'Ej: Parqueamérica / Patio Seco' },
    { name: 'address', label: 'Dirección general (Opcional)', type: 'text', placeholder: 'Ej: Vía Mamonal' },
    { name: 'city', label: 'Ciudad (Opcional)', type: 'text', placeholder: 'Ej: Cartagena' },
    { name: 'isPort', label: 'Es Puerto Marítimo', type: 'checkbox' },
    { name: 'isDepot', label: 'Es Patio de Vacíos', type: 'checkbox' },
    { name: 'isOwnYard', label: 'Es Patio Propio (Corditrans)', type: 'checkbox' },
    {
      name: 'hasClientYard',
      label: 'Incluye patio de cliente para desenganche de tráileres',
      type: 'checkbox',
      visible: (currentValues) =>
        !currentValues.isPort &&
        !currentValues.isDepot &&
        !currentValues.isOwnYard,
    },
    
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
      visible: (currentValues) =>
        !currentValues.isPort &&
        !currentValues.isDepot &&
        !currentValues.isOwnYard,
      fullWidth: true,
      render: (value: FormFieldValue, onChange: (value: FormFieldValue) => void) => {
        if (isLoadingClients) return <span className={styles.loadingText}>Cargando portafolio...</span>;
        const assignments = Array.isArray(value)
          ? (value as ClientAssignmentFormValue[])
          : [];

        return (
          <div className={styles.clientAssignmentsContainer}>
            {clients.map((client) => {
              const clientAssignment = assignments.find((v) => v.clientId === client.id);
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
                          onChange([...assignments, {
                            clientId: client.id,
                            isClient: true,
                            isDepot: false,
                          }]);
                        } else {
                          onChange(assignments.filter((v) => v.clientId !== client.id));
                        }
                      }}
                    />
                    <span className={styles.clientName}>
                      {client.razonSocial} <span className={styles.clientNit}>({client.nit})</span>
                    </span>
                  </label>

                  {isSelected && clientAssignment && (
                    <div className={styles.granularRoles}>
                      <span className={styles.roleLabel}>Funciones para {client.razonSocial}:</span>
                      <div className={styles.roleToggles}>
                        <label className={styles.subCheckboxLabel}>
                          <input
                            type="checkbox"
                            checked={clientAssignment.isClient}
                            onChange={(e) => {
                              onChange(assignments.map((v) => 
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
                              onChange(assignments.map((v) => 
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
  ], [clients, isLoadingClients]);

  const handleSubmit = async (formData: Record<string, FormFieldValue>) => {
    const isPort = Boolean(formData.isPort);
    const isDepot = Boolean(formData.isDepot);
    const isOwnYard = Boolean(formData.isOwnYard);
    const isClientSite = !isPort && !isDepot && !isOwnYard;
    let clientsData = Array.isArray(formData.clientsData)
      ? (formData.clientsData as ClientAssignmentFormValue[])
      : [];

    if (!isClientSite) {
      clientsData = [];
    } else {
      clientsData = clientsData.map((item) => ({
        clientId: Number(item.clientId),
        isClient: Boolean(item.isClient),
        isDepot: Boolean(item.isDepot),
      })).filter((item) => item.clientId && (item.isClient || item.isDepot));
    }

    const payload = {
      name: String(formData.name || '').trim(),
      address: String(formData.address || '').trim(),
      city: String(formData.city || '').trim(),
      isPort,
      isDepot,
      isOwnYard,
      hasClientYard:
        isClientSite &&
        (Boolean(formData.hasClientYard) ||
          clientsData.some((client) => client.isDepot)),
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

    const success = locationToEdit
      ? await updateLocation(locationToEdit.id, validation.data)
      : await createLocation(validation.data);
    if (success) onClose();
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
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TIPO_OPCIONES } from '@/app/constants/operation.constants';
import { SuperForm } from '@/components/organisms/form/form';
import { FormField, FormFieldValue } from '@/components/organisms/form/types/form.types';
import { createOperationSchema, CreateOperationInput } from '@/schemas/operation.schema';
import { locationService } from '@/services/location.service';
import { getOperationRules } from '@/utils/operation-rules';
import { Location as LocationType } from '@/types/location.types'; 
import { useOperations } from '../hooks/useOperations';

interface OperationFormProps {
  onClose: () => void;
}

export const OperationForm: React.FC<OperationFormProps> = ({ onClose }) => {
  const { createOperation, isLoadingOperations } = useOperations();
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [currentType, setCurrentType] = useState<string>('');
  const [isAnticipated, setIsAnticipated] = useState<boolean>(false);

  useEffect(() => {
    locationService.getAll().then(setLocations).catch(console.error);
  }, []);

  const rules = useMemo(() => getOperationRules(currentType), [currentType]);

  // ==========================================
  // LÓGICA DE FORMATEO DE ETIQUETAS (Con Tarifas)
  // ==========================================
  const formatLocationLabel = (loc: LocationType) => {
    if (loc.tarifas && loc.tarifas.length > 0) {
      const operaciones = loc.tarifas.map(t => t.operacion).join(' / ');
      return `${loc.name} - ${operaciones}`;
    }
    return loc.name;
  };

  const locationOptionsAll = locations.map(loc => ({ 
    value: loc.id, 
    label: formatLocationLabel(loc) 
  }));

  // ==========================================
  // LÓGICA DE FILTRADO (¿Qué lugares mostrar?)
  // ==========================================
  const getOrigenOptions = () => {
    if (currentType === 'Retiro de Importación') return locations.filter(loc => loc.isPort).map(loc => ({ value: loc.id, label: formatLocationLabel(loc) }));
    if (currentType === 'Ingreso de Exportación' || currentType === 'Retiro de Contenedor Vacío') return locations.filter(loc => loc.isDepot).map(loc => ({ value: loc.id, label: formatLocationLabel(loc) }));
    if (currentType === 'Devolución de Contenedor Vacío') return locations.filter(loc => loc.isClient).map(loc => ({ value: loc.id, label: formatLocationLabel(loc) }));
    return locationOptionsAll;
  };

  const getDescargueOptions = () => {
    // El punto intermedio (Bodega Cliente) tanto para cargue de exp. como descargue de imp.
    if (currentType === 'Retiro de Importación' || currentType === 'Ingreso de Exportación') {
      return locations.filter(loc => loc.isClient).map(loc => ({ value: loc.id, label: formatLocationLabel(loc) }));
    }
    return locationOptionsAll;
  };

  const getDestinoOptions = () => {
    if (currentType === 'Retiro de Importación' || currentType === 'Devolución de Contenedor Vacío') return locations.filter(loc => loc.isDepot).map(loc => ({ value: loc.id, label: formatLocationLabel(loc) }));
    if (currentType === 'Ingreso de Exportación') return locations.filter(loc => loc.isPort).map(loc => ({ value: loc.id, label: formatLocationLabel(loc) }));
    if (currentType === 'Retiro de Contenedor Vacío') return locations.filter(loc => loc.isClient).map(loc => ({ value: loc.id, label: formatLocationLabel(loc) }));
    return locationOptionsAll;
  };

  // ==========================================
  // CONFIGURACIÓN DINÁMICA DE ETIQUETAS (¿Cómo llamarlos?)
  // ==========================================
  const getOrigenLabel = () => {
    if (currentType === 'Retiro de Importación') return 'Lugar de Origen (Puerto)';
    if (currentType === 'Ingreso de Exportación') return 'Lugar de Origen (Patio Vacío)';
    if (currentType === 'Devolución de Contenedor Vacío') return 'Lugar de Origen (Bodega Cliente)';
    if (currentType === 'Retiro de Contenedor Vacío') return 'Lugar de Origen (Patio de Vacíos)';
    return 'Lugar de Origen';
  };

  const getDescargueLabel = () => {
    if (currentType === 'Retiro de Importación') return 'Lugar de Descargue (Bodega Cliente)';
    if (currentType === 'Ingreso de Exportación') return 'Lugar de Cargue (Bodega Cliente)';
    return 'Punto Intermedio';
  };

  const getDestinoLabel = () => {
    if (currentType === 'Retiro de Importación') return 'Lugar de Devolución (Patio Vacíos)';
    if (currentType === 'Ingreso de Exportación') return 'Destino Contenedor Lleno (Puerto)';
    if (currentType === 'Devolución de Contenedor Vacío') return 'Lugar de Destino (Patio de Vacíos)';
    if (currentType === 'Retiro de Contenedor Vacío') return 'Lugar de Destino (Bodega Cliente)';
    return 'Lugar de Destino';
  };

  // ==========================================
  // CONFIGURACIÓN DEL FORMULARIO
  // ==========================================
  const formFields: FormField[] = [
    { name: 'type', label: 'Tipo de Operación', type: 'select', options: TIPO_OPCIONES },
    { name: 'cliente', label: 'Nombre del Cliente', type: 'text', placeholder: 'Ej: Empresa S.A.S' },
    {
      name: 'isAnticipated',
      label: '¿Es una Exportación Anticipada?',
      type: 'checkbox',
      visible: currentType === 'Ingreso de Exportación',
    },
    {
      name: 'scheduledAt',
      label: 'Fecha Programada de Carga',
      type: 'date',
      visible: currentType === 'Ingreso de Exportación' && isAnticipated, 
    },
    {
      name: 'containerNumber',
      label: 'Número de Contenedor',
      type: 'text',
      placeholder: 'Ej: MSKU1234567',
      visible: currentType === 'Ingreso de Exportación' ? isAnticipated : rules.showContainer, 
    },
    {
      name: 'origenId',
      label: getOrigenLabel(),
      type: 'select',
      options: getOrigenOptions(),
      visible: rules.showOrigen,
    },
    {
      name: 'descargueId',
      label: getDescargueLabel(),
      type: 'select',
      options: getDescargueOptions(), 
      visible: rules.showDescargue, 
    },
    {
      name: 'destinoId',
      label: getDestinoLabel(),
      type: 'select',
      options: getDestinoOptions(),
      visible: rules.showDestino, 
    }
  ];

  const handleFormChange = (name: string, value: FormFieldValue) => {
    if (name === 'type') {
      setCurrentType(String(value));
      if (String(value) !== 'Ingreso de Exportación') setIsAnticipated(false);
    }
    if (name === 'isAnticipated') setIsAnticipated(Boolean(value));
  };

  const handleSubmit = async (formData: Record<string, FormFieldValue>) => {
    setErrors({});
    const localErrors: Record<string, string> = {};

    if (!formData.type) localErrors.type = 'Seleccione un tipo';
    if (!formData.cliente) localErrors.cliente = 'Requerido';
    if (currentType === 'Ingreso de Exportación' && isAnticipated && !formData.scheduledAt) {
      localErrors.scheduledAt = 'Especifique la fecha del cronograma';
    }

    if (rules.showOrigen && !formData.origenId) localErrors.origenId = 'El origen es obligatorio';
    if (rules.showDescargue && !formData.descargueId) localErrors.descargueId = 'El punto intermedio es obligatorio';
    if (rules.showDestino && !formData.destinoId) localErrors.destinoId = 'El destino es obligatorio';

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    const isExport = currentType === 'Ingreso de Exportación';
    const isImport = currentType === 'Retiro de Importación';
    const isExportAnticipada = isExport && isAnticipated;
    const showContainerFinal = isExportAnticipada || rules.showContainer;

    // 👇 AJUSTE CLAVE: Sincronización con el Backend (cargueId vs descargueId)
    const dataToSend = {
      type: formData.type,
      cliente: formData.cliente,
      scheduledAt: isExportAnticipada && formData.scheduledAt ? String(formData.scheduledAt) : undefined,
      containerNumber: showContainerFinal ? formData.containerNumber : undefined,
      origenId: formData.origenId ? Number(formData.origenId) : undefined,
      
      // Si es exportación, lo mandamos como cargueId. Si es importación, como descargueId.
      cargueId: isExport && formData.descargueId ? Number(formData.descargueId) : undefined,
      descargueId: isImport && formData.descargueId ? Number(formData.descargueId) : undefined,
      
      destinoId: formData.destinoId ? Number(formData.destinoId) : undefined,
    };

    const validation = createOperationSchema.safeParse(dataToSend);
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        fieldErrors[String(issue.path[0])] = issue.message; 
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await createOperation(validation.data as CreateOperationInput);
      onClose(); 
    } catch (error) {
      console.error('Error al crear la operación:', error);
    }
  };

  return (
    <SuperForm
      fields={formFields}
      onSubmit={handleSubmit}
      onCancel={onClose}
      onChange={handleFormChange}
      errors={errors}
      isLoading={isLoadingOperations}
      submitText="Crear Operación"
      cancelText="Cancelar"
    />
  );
};
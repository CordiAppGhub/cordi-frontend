'use client';

import { useState, useMemo } from 'react';
import { FormField, FormFieldValue } from '@/components/organisms/form/types/form.types';
import { useClients } from '@/hooks/useClient'; 
import { createSurchargeCatalogSchema, createSurchargeOverrideSchema } from '@/schemas/surcharge.schema';
import { useTariffs } from './useTariff';

export const useSurchargeForm = (onClose: () => void) => {
  const { createBaseSurcharge, createClientOverride, surcharges } = useTariffs();
  const { clients } = useClients();
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ❌ Eliminado el useEffect: TanStack Query ya provee los datos cacheados y sincronizados.

  // ==========================================
  // CONFIGURACIÓN FORMULARIO: CATÁLOGO BASE
  // ==========================================
  const catalogFormFields: FormField[] = useMemo(() => [
    { name: 'code', label: 'Código Técnico', type: 'text', placeholder: 'Ej: RECARGO_NOCTURNO' },
    { name: 'name', label: 'Nombre Comercial', type: 'text', placeholder: 'Ej: Recargo Nocturno (Después 8PM)' },
    { name: 'applicableTo', label: 'Aplica para', type: 'select', options: [
      { value: 'IMPORTACION', label: 'Importación' },
      { value: 'EXPORTACION', label: 'Exportación' },
      { value: 'AMBOS', label: 'Ambos' },
    ]},
    { name: 'basePrice', label: 'Precio Base General ($)', type: 'number', placeholder: 'Ej: 150000' },
    { name: 'description', label: 'Descripción (Opcional)', type: 'text', placeholder: 'Detalles de la novedad' },
  ], []);

  const handleCatalogSubmit = async (formData: Record<string, FormFieldValue>) => {
    setErrors({});
    const validation = createSurchargeCatalogSchema.safeParse(formData);
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        fieldErrors[String(issue.path[0])] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const success = await createBaseSurcharge(validation.data);
    setIsSubmitting(false);
    if (success) onClose();
  };

  // ==========================================
  // CONFIGURACIÓN FORMULARIO: EXCEPCIÓN CLIENTE
  // ==========================================
  const overrideFormFields: FormField[] = useMemo(() => {
    const clientOptions = clients.map(c => ({ value: c.id, label: c.razonSocial }));
    const surchargeOptions = surcharges.map(s => ({ value: s.code, label: `${s.name} (Base: $${s.basePrice})` }));

    return [
      { name: 'clientId', label: 'Cliente', type: 'select', options: clientOptions },
      { name: 'surchargeCode', label: 'Novedad del Catálogo', type: 'select', options: surchargeOptions },
      { name: 'customPrice', label: 'Precio Especial Negociado ($)', type: 'number', placeholder: 'Ej: 100000 (0 si es gratis)' },
    ];
  }, [clients, surcharges]);

  const handleOverrideSubmit = async (formData: Record<string, FormFieldValue>) => {
    setErrors({});
    const validation = createSurchargeOverrideSchema.safeParse(formData);
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        fieldErrors[String(issue.path[0])] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const success = await createClientOverride(validation.data);
    setIsSubmitting(false);
    if (success) onClose();
  };

  return {
    catalogFormFields,
    handleCatalogSubmit,
    overrideFormFields,
    handleOverrideSubmit,
    errors,
    isSubmitting,
  };
};
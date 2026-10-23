'use client';

import { useState, useMemo } from 'react';
import { FormField, FormFieldValue } from '@/components/organisms/form/types/form.types';
import { createSurchargeCatalogSchema } from '@/schemas/surcharge.schema';
import { useTariffs } from './useTariff';

export const useSurchargeForm = (onClose: () => void) => {
  const { createBaseSurcharge } = useTariffs();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const catalogFormFields: FormField[] = useMemo(() => [
    { name: 'code', label: 'Código Técnico', type: 'text', placeholder: 'Ej: RECARGO_NOCTURNO' },
    { name: 'name', label: 'Nombre del Concepto', type: 'text', placeholder: 'Ej: Recargo Nocturno' },
    { name: 'applicableTo', label: 'Aplica para', type: 'select', options: [
      { value: 'IMPORTACION', label: 'Importación' },
      { value: 'EXPORTACION', label: 'Exportación' },
      { value: 'AMBOS', label: 'Ambos' },
    ]},
    { name: 'description', label: 'Descripción (Opcional)', type: 'text', placeholder: 'Detalles del concepto' },
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

  return { catalogFormFields, handleCatalogSubmit, errors, isSubmitting };
};

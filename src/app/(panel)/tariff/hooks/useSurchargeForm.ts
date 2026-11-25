'use client';

import { useState, useMemo } from 'react';
import { FormField, FormFieldValue } from '@/components/organisms/form/types/form.types';
import { createSurchargeCatalogSchema } from '@/schemas/surcharge.schema';
import { useTariffs } from './useTariff';
import type { SurchargeCatalog } from '@/types/tariff-ypes';

export const useSurchargeForm = (
  onClose: () => void,
  initialData?: SurchargeCatalog | null,
) => {
  const { createBaseSurcharge, updateBaseSurcharge } = useTariffs();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const catalogFormFields: FormField[] = useMemo(
    () => [
      {
        name: 'code',
        label: initialData ? 'Código Técnico (solo lectura)' : 'Código Técnico',
        type: 'text',
        placeholder: 'Ej: RECARGO_NOCTURNO',
        disabled: Boolean(initialData),
      },
      {
        name: 'name',
        label: 'Nombre del Concepto',
        type: 'text',
        placeholder: 'Ej: Recargo Nocturno',
      },
      {
        name: 'applicableTo',
        label: 'Aplica para',
        type: 'select',
        options: [
          { value: '', label: '-- Seleccionar modalidad --' },
          { value: 'IMPORTACION', label: 'Importación' },
          { value: 'EXPORTACION', label: 'Exportación' },
          { value: 'AMBOS', label: 'Ambos' },
        ],
      },
      {
        name: 'basePrice',
        label: 'Precio base (COP)',
        type: 'number',
        placeholder: 'Opcional',
      },
      {
        name: 'description',
        label: 'Descripción (Opcional)',
        type: 'textarea',
        placeholder: 'Detalles del concepto',
      },
    ],
    [initialData],
  );

  const defaultValues: Record<string, FormFieldValue> = initialData
    ? {
        code: initialData.code,
        name: initialData.name,
        applicableTo: initialData.applicableTo ?? '',
        basePrice: initialData.basePrice,
        description: initialData.description ?? '',
      }
    : {};

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
    const success = initialData
      ? await updateBaseSurcharge(initialData.code, {
          name: validation.data.name,
          description: validation.data.description,
          applicableTo: validation.data.applicableTo,
          basePrice: validation.data.basePrice,
        })
      : await createBaseSurcharge(validation.data);
    setIsSubmitting(false);
    if (success) onClose();
  };

  return {
    catalogFormFields,
    defaultValues,
    handleCatalogSubmit,
    errors,
    isSubmitting,
  };
};

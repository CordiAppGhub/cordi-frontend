'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SuperModal } from '@/components/organisms/modal/modal';
import { SuperForm } from '@/components/organisms/form/form';
import { FormField, FormFieldValue } from '@/components/organisms/form/types/form.types';
import { tariffService } from '@/services/tariff.service';

interface CreateVehicleInput {
  plate: string;
  brand: string;
  modelYear: number;
  empresa: string;
  capacityWeight: number;
  status: string;
  affiliation: string;
  adminDiscount?: number;
}

interface CreateVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateVehicle: (data: CreateVehicleInput) => Promise<void> | void;
}

export default function CreateVehicleModal({ isOpen, onClose, onCreateVehicle }: CreateVehicleModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [affiliationOptions, setAffiliationOptions] = useState<Array<{ value: string; label: string }>>([
    { value: 'TERCEROS', label: 'Terceros (Vehículos Externos)' },
    { value: 'CORDIHUB', label: 'Cordihub (Fidelizados)' },
    { value: 'CORDIVEHICULOS', label: 'Cordivehículos (Flota Propia)' }
  ]);

  useEffect(() => {
    if (isOpen) {
      tariffService.getAllVehicleTariffs()
        .then((tariffs) => {
          if (tariffs && tariffs.length > 0) {
            const dynamicOptions = tariffs.map((t) => ({
              value: t.affiliation,
              label: `${t.affiliation} — Retención base: ${t.percentage}%`
            }));
            setAffiliationOptions(dynamicOptions);
          }
        })
        .catch((err) => {
          console.error('No se pudieron cargar las tarifas de flotas dinámicas:', err);
        });
    }
  }, [isOpen]);

  const handleCloseModal = () => {
    setErrors({});
    onClose();
  };

  const formFields: FormField[] = useMemo(() => [
    {
      name: 'plate',
      label: 'Placa del Vehículo',
      type: 'text',
      placeholder: 'Ej. TRL-892',
      required: true,
    },
    {
      name: 'brand',
      label: 'Marca',
      type: 'text',
      placeholder: 'Ej. Kenworth',
    },
    {
      name: 'modelYear',
      label: 'Modelo (Año)',
      type: 'number',
      placeholder: '2024',
    },
    {
      name: 'empresa',
      label: 'Empresa / Propietario',
      type: 'text',
      placeholder: 'Ej. Global Logistics',
    },
    {
      name: 'capacityWeight',
      label: 'Capacidad de Carga (Kg o Ton)',
      type: 'number',
      placeholder: 'Ej. 34000',
      required: true,
    },
    {
      name: 'status',
      label: 'Estado Inicial',
      type: 'select',
      options: [
        { value: 'AVAILABLE', label: 'Disponible (Operativo)' },
        { value: 'IN_TRANSIT', label: 'En Tránsito' },
        { value: 'MAINTENANCE', label: 'En Mantenimiento' },
        { value: 'OUT_OF_SERVICE', label: 'Fuera de Servicio' }
      ]
    },
    {
      name: 'affiliation',
      label: 'Tipo de Afiliación (Rentabilidad)',
      type: 'select',
      options: affiliationOptions,
    },
    {
      name: 'adminDiscount',
      label: '% Descuento Personalizado (Opcional)',
      type: 'number',
      placeholder: 'Dejar vacío para usar el % general de la tarifa',
    }
  ], [affiliationOptions]);

  const handleFormChange = (name: string, value: FormFieldValue) => {
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (formData: Record<string, FormFieldValue>) => {
    const localErrors: Record<string, string> = {};

    if (!formData.plate || String(formData.plate).trim() === '') {
      localErrors.plate = 'La placa es obligatoria';
    }
    if (!formData.capacityWeight || Number(formData.capacityWeight) <= 0) {
      localErrors.capacityWeight = 'Ingrese una capacidad válida';
    }

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    try {
      setLoading(true);

      const payload: CreateVehicleInput = {
        plate: String(formData.plate || '').trim().toUpperCase(),
        brand: String(formData.brand || '').trim(),
        modelYear: Number(formData.modelYear) || new Date().getFullYear(),
        empresa: String(formData.empresa || '').trim(),
        capacityWeight: Number(formData.capacityWeight) || 0,
        status: String(formData.status || 'AVAILABLE'),
        affiliation: String(formData.affiliation || 'TERCEROS'),
        adminDiscount: formData.adminDiscount ? Number(formData.adminDiscount) : undefined,
      };

      await onCreateVehicle(payload);
      handleCloseModal();
    } catch (error) {
      console.error('Error al registrar vehículo:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <SuperModal isOpen={isOpen} onClose={handleCloseModal} title="Registrar Nuevo Tractocamión" width="600px">
      <SuperForm
        key={isOpen ? 'open' : 'closed'}
        fields={formFields}
        onSubmit={handleSubmit}
        
        onCancel={handleCloseModal}
        onChange={handleFormChange}
        errors={errors}
        isLoading={loading}
        submitText="Guardar Vehículo"
        cancelText="Cancelar"
      />
    </SuperModal>
  );
}
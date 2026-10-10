'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SuperModal } from '@/components/organisms/modal/modal';
import { SuperForm } from '@/components/organisms/form/form';
import { FormField, FormFieldValue } from '@/components/organisms/form/types/form.types';
import { tariffService } from '@/services/tariff.service';
import type { CreateVehicleFormInput } from '@/types/vehicles';

interface CreateVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateVehicle: (data: CreateVehicleFormInput) => Promise<boolean | void> | boolean | void;
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

  const handleFormChange = (name: string) => {
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

      const status = String(formData.status || 'AVAILABLE');
      const affiliation = String(formData.affiliation || 'TERCEROS');
      const payload: CreateVehicleFormInput = {
        plate: String(formData.plate || '').trim().toUpperCase(),
        brand: String(formData.brand || '').trim(),
        modelYear: Number(formData.modelYear) || new Date().getFullYear(),
        empresa: String(formData.empresa || '').trim(),
        capacityWeight: Number(formData.capacityWeight) || 0,
        status: status === 'IN_TRANSIT'
          ? 'IN_TRANSIT'
          : status === 'MAINTENANCE'
            ? 'MAINTENANCE'
            : status === 'OUT_OF_SERVICE'
              ? 'OUT_OF_SERVICE'
              : 'AVAILABLE',
        affiliation: affiliation === 'CORDIVEHICULOS'
          ? 'CORDIVEHICULOS'
          : affiliation === 'CORDIHUB'
            ? 'CORDIHUB'
            : 'TERCEROS',
        adminDiscount: formData.adminDiscount ? Number(formData.adminDiscount) : undefined,
      };

      const created = await onCreateVehicle(payload);
      if (created !== false) {
        handleCloseModal();
      }
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
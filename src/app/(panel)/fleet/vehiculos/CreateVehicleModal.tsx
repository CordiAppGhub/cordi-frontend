'use client';

import React, { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { SuperModal } from '@/components/organisms/modal/modal';
import { Button } from '@/components/atoms/button/button';
import { Input } from '@/components/atoms/input/input';
import { Select } from '@/components/atoms/select/select';
import { tariffService } from '@/services/tariff.service';
import { vehiclesService } from '@/services/vehicles.service';
import {
  createVehicleSchema,
  type CreateVehicleFormValues,
} from '@/schemas/vehicle.schema';
import type { CreateVehicleFormInput } from '@/types/vehicles';
import { showToast } from '@/utils/alerts';
import styles from './CreateVehicleModal.module.css';

interface CreateVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateVehicle: (
    data: CreateVehicleFormInput,
  ) => Promise<boolean | void> | boolean | void;
}

type DocumentKind = 'insurance' | 'tecnomecanica';

const DOCUMENT_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export default function CreateVehicleModal({
  isOpen,
  onClose,
  onCreateVehicle,
}: CreateVehicleModalProps) {
  const [loading, setLoading] = useState(false);
  const [documentLoading, setDocumentLoading] = useState<
    Record<DocumentKind, boolean>
  >({ insurance: false, tecnomecanica: false });
  const [affiliationOptions, setAffiliationOptions] = useState<
    Array<{ value: string; label: string }>
  >([
    { value: 'TERCEROS', label: 'Terceros (Vehículos Externos)' },
    { value: 'CORDIHUB', label: 'Cordihub (Fidelizados)' },
    { value: 'CORDIVEHICULOS', label: 'Cordivehículos (Flota Propia)' },
  ]);
  const requestIds = useRef<Record<DocumentKind, number>>({
    insurance: 0,
    tecnomecanica: 0,
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateVehicleFormValues>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: {
      plate: '',
      type: 'CAMION_SENCILLO',
      brand: '',
      modelYear: new Date().getFullYear(),
      empresa: '',
      cargoCapacity: 0,
      status: 'AVAILABLE',
      affiliation: 'TERCEROS',
      adminDiscount: undefined,
      insuranceFileUrl: '',
      insuranceFile: undefined,
      insuranceExpiration: '',
      tecnomecanicaFileUrl: '',
      tecnomecanicaFile: undefined,
      tecnomecanicaExpiration: '',
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    void tariffService
      .getAllVehicleTariffs()
      .then((tariffs) => {
        if (tariffs.length > 0) {
          setAffiliationOptions(
            tariffs.map((tariff) => ({
              value: tariff.affiliation,
              label: `${tariff.affiliation} — Retención base: ${tariff.percentage}%`,
            })),
          );
        }
      })
      .catch((error: unknown) => {
        console.error('No se pudieron cargar las tarifas de flotas dinámicas:', error);
      });
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      reset({
        plate: '',
        type: 'CAMION_SENCILLO',
        brand: '',
        modelYear: new Date().getFullYear(),
        empresa: '',
        cargoCapacity: 0,
        status: 'AVAILABLE',
        affiliation: 'TERCEROS',
        adminDiscount: undefined,
        insuranceFileUrl: '',
        insuranceFile: undefined,
        insuranceExpiration: '',
        tecnomecanicaFileUrl: '',
        tecnomecanicaFile: undefined,
        tecnomecanicaExpiration: '',
      });
    }
  }, [isOpen, reset]);

  const handleCloseModal = () => {
    requestIds.current.insurance += 1;
    requestIds.current.tecnomecanica += 1;
    setDocumentLoading({ insurance: false, tecnomecanica: false });
    onClose();
  };

  const handleDocumentChange = async (
    kind: DocumentKind,
    file: File | undefined,
  ) => {
    const fileField =
      kind === 'insurance' ? 'insuranceFile' : 'tecnomecanicaFile';
    const urlField =
      kind === 'insurance' ? 'insuranceFileUrl' : 'tecnomecanicaFileUrl';
    const expirationField =
      kind === 'insurance'
        ? 'insuranceExpiration'
        : 'tecnomecanicaExpiration';
    const requestId = ++requestIds.current[kind];

    setValue(fileField, file, { shouldValidate: true });
    setValue(urlField, '', { shouldValidate: true });
    setValue(expirationField, '', { shouldValidate: true });
    if (!file) return;

    if (!DOCUMENT_MIME_TYPES.includes(file.type)) {
      setValue(fileField, undefined, { shouldValidate: true });
      showToast.error(
        'Selecciona un documento JPG, PNG o PDF.',
        'Formato de archivo no válido',
      );
      return;
    }

    setDocumentLoading((previous) => ({ ...previous, [kind]: true }));
    const [uploadResult, extractionResult] = await Promise.allSettled([
      vehiclesService.uploadDocument(file),
      vehiclesService.extractDates(file),
    ]);

    const isCurrentSelection =
      requestIds.current[kind] === requestId && getValues(fileField) === file;
    if (isCurrentSelection) {
      if (uploadResult.status === 'fulfilled') {
        setValue(urlField, uploadResult.value.fileUrl, {
          shouldValidate: true,
        });
      } else {
        showToast.error(
          uploadResult.reason,
          'No se pudo almacenar el documento.',
        );
      }

      if (extractionResult.status === 'fulfilled') {
        setValue(expirationField, extractionResult.value.expirationDate, {
          shouldValidate: true,
        });
      } else {
        showToast.error(
          extractionResult.reason,
          'No se pudo extraer la fecha de vencimiento.',
        );
      }
      setDocumentLoading((previous) => ({ ...previous, [kind]: false }));
    }
  };

  const submitVehicle = async (formValues: CreateVehicleFormValues) => {
    try {
      setLoading(true);
      const payload: CreateVehicleFormInput = {
        plate: formValues.plate.trim().toUpperCase(),
        type: formValues.type,
        brand: formValues.brand.trim(),
        modelYear: formValues.modelYear,
        empresa: formValues.empresa?.trim() ?? '',
        cargoCapacity: formValues.cargoCapacity,
        status: formValues.status,
        affiliation: formValues.affiliation,
        adminDiscount: formValues.adminDiscount,
        insuranceFileUrl: formValues.insuranceFileUrl || undefined,
        insuranceExpiration: formValues.insuranceExpiration || undefined,
        tecnomecanicaFileUrl: formValues.tecnomecanicaFileUrl || undefined,
        tecnomecanicaExpiration:
          formValues.tecnomecanicaExpiration || undefined,
      };

      const created = await onCreateVehicle(payload);
      if (created !== false) onClose();
    } catch (error: unknown) {
      console.error('Error al registrar vehículo:', error);
      showToast.error(error, 'No se pudo registrar el vehículo.');
    } finally {
      setLoading(false);
    }
  };

  const inputError = (field: keyof CreateVehicleFormValues) =>
    errors[field]?.message;
  const isProcessingDocuments =
    documentLoading.insurance || documentLoading.tecnomecanica;

  return (
    <SuperModal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title="Registrar nuevo vehículo"
      width="700px"
      maxHeight="90vh"
    >
      <form className={styles.form} onSubmit={handleSubmit(submitVehicle)}>
        <div className={styles.fieldsGrid}>
          <label className={styles.field}>
            <span>Placa</span>
            <Input
              {...register('plate')}
              placeholder="Ej. TRL892"
              error={inputError('plate')}
            />
          </label>

          <label className={styles.field}>
            <span>Tipo de vehículo</span>
            <Select
              options={[
                { value: 'CAMION_SENCILLO', label: 'Sencillo' },
                { value: 'TRACTOMULA', label: 'Tractomula' },
                { value: 'TURBO', label: 'Turbo' },
                { value: 'PLANCHA', label: 'Plancha' },
              ]}
              {...register('type')}
              error={inputError('type')}
            />
          </label>

          <label className={styles.field}>
            <span>Marca</span>
            <Input
              {...register('brand')}
              placeholder="Ej. Kenworth"
              error={inputError('brand')}
            />
          </label>

          <label className={styles.field}>
            <span>Modelo (año)</span>
            <Input
              type="number"
              {...register('modelYear', { valueAsNumber: true })}
              min={1900}
              max={2100}
              error={inputError('modelYear')}
            />
          </label>

          <label className={styles.field}>
            <span>Empresa / propietario</span>
            <Input
              {...register('empresa')}
              placeholder="Ej. Global Logistics"
              error={inputError('empresa')}
            />
          </label>

          <label className={styles.field}>
            <span>Capacidad de carga (kg o toneladas)</span>
            <Input
              type="number"
              {...register('cargoCapacity', { valueAsNumber: true })}
              min="0.01"
              step="any"
              placeholder="Ej. 34000"
              error={inputError('cargoCapacity')}
            />
          </label>

          <label className={styles.field}>
            <span>Afiliación</span>
            <Select
              options={affiliationOptions}
              {...register('affiliation')}
              error={inputError('affiliation')}
            />
          </label>

          <label className={styles.field}>
            <span>Estado inicial</span>
            <Select
              options={[
                { value: 'AVAILABLE', label: 'Disponible' },
                { value: 'IN_TRANSIT', label: 'En tránsito' },
                { value: 'MAINTENANCE', label: 'En mantenimiento' },
                { value: 'OUT_OF_SERVICE', label: 'Fuera de servicio' },
              ]}
              {...register('status')}
              error={inputError('status')}
            />
          </label>

          <label className={styles.field}>
            <span>Descuento personalizado (%) — opcional</span>
            <Input
              type="number"
              {...register('adminDiscount', {
                setValueAs: (value: string) =>
                  value === '' ? undefined : Number(value),
              })}
              min="0"
              step="any"
              placeholder="Dejar vacío para usar la tarifa general"
              error={inputError('adminDiscount')}
            />
          </label>

          <label className={styles.field}>
            <span>Documento SOAT / seguro — opcional</span>
            <Input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              disabled={documentLoading.insurance || loading}
              error={inputError('insuranceFile')}
              onChange={(event) =>
                void handleDocumentChange(
                  'insurance',
                  event.currentTarget.files?.[0],
                )
              }
            />
            {documentLoading.insurance && (
              <span className={styles.helper}>Subiendo y leyendo documento…</span>
            )}
          </label>

          <label className={styles.field}>
            <span>Vencimiento del SOAT — opcional</span>
            <Input
              type="date"
              {...register('insuranceExpiration')}
              error={inputError('insuranceExpiration')}
            />
          </label>

          <label className={styles.field}>
            <span>Documento tecnomecánica — opcional</span>
            <Input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              disabled={documentLoading.tecnomecanica || loading}
              error={inputError('tecnomecanicaFile')}
              onChange={(event) =>
                void handleDocumentChange(
                  'tecnomecanica',
                  event.currentTarget.files?.[0],
                )
              }
            />
            {documentLoading.tecnomecanica && (
              <span className={styles.helper}>Subiendo y leyendo documento…</span>
            )}
          </label>

          <label className={styles.field}>
            <span>Vencimiento de la tecnomecánica — opcional</span>
            <Input
              type="date"
              {...register('tecnomecanicaExpiration')}
              error={inputError('tecnomecanicaExpiration')}
            />
          </label>
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCloseModal}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            disabled={loading || isProcessingDocuments}
          >
            Guardar vehículo
          </Button>
        </div>
      </form>
    </SuperModal>
  );
}

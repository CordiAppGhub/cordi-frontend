'use client';

import React, { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { SuperModal } from '@/components/organisms/modal/modal';
import { Button } from '@/components/atoms/button/button';
import { Input } from '@/components/atoms/input/input';
import { Select } from '@/components/atoms/select/select';
import { vehiclesService } from '@/services/vehicles.service';
import {
  createVehicleSchema,
  type CreateVehicleFormValues,
} from '@/schemas/vehicle.schema';
import { showToast } from '@/utils/alerts';
import type { Locations } from '@/types/location.types';
import type {
  Trailer,
  UpdateTrailerInput,
  UpdateVehicleDto,
  Vehicle,
} from '@/types/vehicles';
import styles from './CreateVehicleModal.module.css';

interface CreateVehicleModalProps {
  isOpen: boolean;
  assetType: 'vehicle' | 'trailer';
  ownYards: Locations[];
  isLoadingOwnYards: boolean;
  ownYardsError: boolean;
  editingVehicle?: Vehicle | null;
  editingTrailer?: Trailer | null;
  onClose: () => void;
  onCreateVehicle: (
    data: CreateVehicleFormValues,
  ) => Promise<boolean | void> | boolean | void;
  onUpdateVehicle?: (
    id: number,
    data: UpdateVehicleDto,
  ) => Promise<boolean | void> | boolean | void;
  onUpdateTrailer?: (
    id: string,
    data: UpdateTrailerInput,
  ) => Promise<boolean | void> | boolean | void;
}

type DocumentKind = 'insurance' | 'tecnomecanica';

const DOCUMENT_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export default function CreateVehicleModal({
  isOpen,
  assetType,
  ownYards,
  isLoadingOwnYards,
  ownYardsError,
  editingVehicle = null,
  editingTrailer = null,
  onClose,
  onCreateVehicle,
  onUpdateVehicle,
  onUpdateTrailer,
}: CreateVehicleModalProps) {
  const isEditing = Boolean(editingVehicle || editingTrailer);
  const [loading, setLoading] = useState(false);
  const [documentLoading, setDocumentLoading] = useState<
    Record<DocumentKind, boolean>
  >({ insurance: false, tecnomecanica: false });
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
      type: assetType === 'trailer' ? 'TRAILER' : 'PATINETA',
      brand: '',
      trailerType: undefined,
      axles: undefined,
      currentLocationId: undefined,
      notes: '',
      modelYear: new Date().getFullYear(),
      affiliation: 'CORDIVEHICULOS',
      cargoCapacity: 0,
      status: 'AVAILABLE',
      insuranceFileUrl: '',
      insuranceFile: undefined,
      insuranceExpiration: '',
      tecnomecanicaFileUrl: '',
      tecnomecanicaFile: undefined,
      tecnomecanicaExpiration: '',
    },
  });
  useEffect(() => {
    if (isOpen) {
      reset({
        plate: editingVehicle?.plate ?? editingTrailer?.plate ?? '',
        type: editingTrailer ? 'TRAILER' : editingVehicle?.type ?? (assetType === 'trailer' ? 'TRAILER' : 'PATINETA'),
        brand: editingVehicle?.brand ?? editingTrailer?.brand ?? '',
        trailerType: editingTrailer?.trailerType,
        axles: editingTrailer?.axles,
        currentLocationId: editingTrailer?.currentLocationId,
        notes: editingTrailer?.notes ?? '',
        modelYear: editingVehicle?.modelYear ?? new Date().getFullYear(),
        affiliation: editingVehicle?.affiliation ?? 'CORDIVEHICULOS',
        cargoCapacity: editingVehicle?.cargoCapacity ?? editingTrailer?.capacity ?? 0,
        status: editingVehicle?.status ?? 'AVAILABLE',
        insuranceFileUrl: '',
        insuranceFile: undefined,
        insuranceExpiration: editingVehicle?.insuranceExpiration?.slice(0, 10) ?? '',
        tecnomecanicaFileUrl: '',
        tecnomecanicaFile: undefined,
        tecnomecanicaExpiration: editingVehicle?.tecnomecanicaExpiration?.slice(0, 10) ?? '',
      });
    }
  }, [assetType, editingTrailer, editingVehicle, isOpen, reset]);

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
      if (editingVehicle) {
        if (!onUpdateVehicle) {
          throw new Error('No está configurada la actualización del cabezote.');
        }
        if (formValues.type === 'TRAILER') {
          throw new Error('El tipo seleccionado no es válido para un cabezote.');
        }
        const updated = await onUpdateVehicle(editingVehicle.id, {
          plate: formValues.plate.trim().toUpperCase(),
          type: formValues.type,
          brand: formValues.brand?.trim() ?? '',
          modelYear: formValues.modelYear,
          affiliation: formValues.affiliation,
          cargoCapacity: formValues.cargoCapacity,
          status: formValues.status,
          insuranceFileUrl: formValues.insuranceFileUrl || undefined,
          insuranceExpiration: formValues.insuranceExpiration || null,
          tecnomecanicaFileUrl: formValues.tecnomecanicaFileUrl || undefined,
          tecnomecanicaExpiration:
            formValues.tecnomecanicaExpiration || null,
        });
        if (updated !== false) onClose();
        return;
      }

      if (editingTrailer) {
        if (!onUpdateTrailer) {
          throw new Error('No está configurada la actualización del tráiler.');
        }
        if (
          (formValues.axles !== 2 && formValues.axles !== 3) ||
          !formValues.trailerType ||
          !formValues.currentLocationId
        ) {
          showToast.error('Completa el tipo, los ejes y el patio del tráiler.');
          return;
        }
        const data: UpdateTrailerInput = {
          plate: formValues.plate.trim().toUpperCase(),
          trailerType: formValues.trailerType,
          axles: formValues.axles,
          brand: formValues.brand?.trim() ?? '',
          notes: formValues.notes?.trim() ?? '',
          capacity:
            formValues.cargoCapacity && formValues.cargoCapacity > 0
              ? formValues.cargoCapacity
              : undefined,
          ...(editingTrailer.status === 'AVAILABLE_IN_YARD'
            ? { currentLocationId: formValues.currentLocationId }
            : {}),
        };
        const updated = await onUpdateTrailer(editingTrailer.id, data);
        if (updated !== false) onClose();
        return;
      }

      const payload: CreateVehicleFormValues = {
        plate: formValues.plate.trim().toUpperCase(),
        type: formValues.type,
        brand: formValues.brand?.trim() ?? '',
        trailerType: formValues.trailerType,
        axles: formValues.axles,
        currentLocationId: formValues.currentLocationId,
        notes: formValues.notes,
        modelYear: formValues.modelYear,
        affiliation: formValues.affiliation,
        cargoCapacity: formValues.cargoCapacity,
        status: formValues.status,
        insuranceFile: formValues.insuranceFile,
        tecnomecanicaFile: formValues.tecnomecanicaFile,
        insuranceFileUrl: formValues.insuranceFileUrl || undefined,
        insuranceExpiration: formValues.insuranceExpiration || undefined,
        tecnomecanicaFileUrl: formValues.tecnomecanicaFileUrl || undefined,
        tecnomecanicaExpiration:
          formValues.tecnomecanicaExpiration || undefined,
      };

      const created = await onCreateVehicle(payload);
      if (created !== false) onClose();
    } catch (error: unknown) {
      showToast.error(
        error,
        isEditing
          ? 'No se pudo actualizar el vehículo.'
          : 'No se pudo registrar el vehículo.',
      );
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
      title={
        isEditing
          ? assetType === 'trailer'
            ? `Editar tráiler ${editingTrailer?.plate ?? ''}`
            : `Editar cabezote ${editingVehicle?.plate ?? ''}`
          : assetType === 'trailer'
            ? 'Registrar nuevo tráiler'
            : 'Registrar nuevo cabezote'
      }
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
            {assetType === 'trailer' ? (
              <>
                <span>Tipo de tráiler</span>
                <Select
                  options={[
                    { value: 'PLANCHA', label: 'Plancha' },
                    { value: 'GRILLO', label: 'Grillo' },
                    { value: 'TANQUE', label: 'Tanque' },
                  ]}
                  {...register('trailerType')}
                  error={inputError('trailerType')}
                  required
                />
              </>
            ) : (
              <>
                <span>Tipo de cabezote</span>
                <Select
                  options={[
                    { value: 'PATINETA', label: 'Patineta (2 ejes / C2)' },
                    { value: 'MULA', label: 'Mula (3 ejes / C3)' },
                  ]}
                  {...register('type')}
                  error={inputError('type')}
                />
              </>
            )}
          </label>

          {assetType === 'trailer' && (
            <label className={styles.field}>
              <span>Número de ejes</span>
              <Select
                options={[
                  { value: '2', label: '2 ejes' },
                  { value: '3', label: '3 ejes' },
                ]}
                {...register('axles', {
                  setValueAs: (value: string) =>
                    value === '' ? undefined : Number(value),
                })}
                error={inputError('axles')}
                required
              />
            </label>
          )}

          {assetType === 'trailer' && (
            <label className={styles.field}>
              <span>Ubicación inicial (patio)</span>
              {editingTrailer &&
              editingTrailer.status !== 'AVAILABLE_IN_YARD' ? (
                <span className={styles.helper}>
                  {editingTrailer.currentLocation?.name ?? 'Ubicación sin registrar'}.
                  El patio solo se puede cambiar cuando está disponible en patio.
                </span>
              ) : (
                <Select
                  options={ownYards.map((location) => ({
                    value: location.id,
                    label: location.name,
                  }))}
                  {...register('currentLocationId', {
                    setValueAs: (value: string) =>
                      value === '' ? undefined : Number(value),
                  })}
                  error={inputError('currentLocationId')}
                  required
                />
              )}
              {isLoadingOwnYards && (
                <span className={styles.helper}>Cargando patios propios...</span>
              )}
              {ownYardsError && (
                <span className={styles.helper} role="alert">
                  No se pudieron cargar los patios propios. Inténtalo de nuevo.
                </span>
              )}
              {!isLoadingOwnYards && !ownYardsError && !ownYards.length && (
                <span className={styles.helper}>
                  Registra o marca una ubicación como patio propio para crear el tráiler.
                </span>
              )}
            </label>
          )}

          <label className={styles.field}>
            <span>Marca</span>
            <Input
              {...register('brand')}
              placeholder="Ej. Kenworth"
              error={inputError('brand')}
            />
          </label>

          {assetType === 'trailer' && (
            <label className={styles.field}>
              <span>Observaciones operativas (opcional)</span>
              <textarea
                {...register('notes')}
                maxLength={2000}
                rows={3}
                placeholder="Notas sobre el estado o características del tráiler."
              />
            </label>
          )}

          {assetType === 'vehicle' && <label className={styles.field}>
            <span>Modelo (año)</span>
            <Input
              type="number"
              {...register('modelYear', { valueAsNumber: true })}
              min={1900}
              max={2100}
              error={inputError('modelYear')}
            />
          </label>}

          {assetType === 'vehicle' && <label className={styles.field}>
            <span>Afiliación / Propietario</span>
            <Select
              options={[
                { value: 'CORDIVEHICULOS', label: 'Cordivehículos' },
                { value: 'CORDIHUB', label: 'Cordihub' },
                { value: 'TERCEROS', label: 'Terceros' },
              ]}
              {...register('affiliation')}
              error={inputError('affiliation')}
            />
          </label>}

          {assetType === 'vehicle' && <label className={styles.field}>
            <span>Capacidad de carga (kg o toneladas)</span>
            <Input
              type="number"
              {...register('cargoCapacity', { valueAsNumber: true })}
              min="0.01"
              step="any"
              placeholder="Ej. 34000"
              error={inputError('cargoCapacity')}
            />
          </label>}

          {assetType === 'vehicle' && <label className={styles.field}>
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
          </label>}

          {assetType === 'vehicle' && <label className={styles.field}>
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
          </label>}

          {assetType === 'vehicle' && <label className={styles.field}>
            <span>Vencimiento del SOAT — opcional</span>
            <Input
              type="date"
              {...register('insuranceExpiration')}
              error={inputError('insuranceExpiration')}
            />
          </label>}

          {assetType === 'vehicle' && <label className={styles.field}>
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
          </label>}

          {assetType === 'vehicle' && <label className={styles.field}>
            <span>Vencimiento de la tecnomecánica — opcional</span>
            <Input
              type="date"
              {...register('tecnomecanicaExpiration')}
              error={inputError('tecnomecanicaExpiration')}
            />
          </label>}
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
            disabled={
              loading ||
              isProcessingDocuments ||
              (assetType === 'trailer' &&
                !isEditing &&
                (isLoadingOwnYards || ownYardsError || !ownYards.length))
            }
          >
            {isEditing
              ? assetType === 'trailer'
                ? 'Guardar cambios del tráiler'
                : 'Guardar cambios del cabezote'
              : assetType === 'trailer'
                ? 'Guardar tráiler'
                : 'Guardar cabezote'}
          </Button>
        </div>
      </form>
    </SuperModal>
  );
}

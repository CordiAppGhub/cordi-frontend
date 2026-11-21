'use client';

import React, { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
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
  VehicleType,
} from '@/types/vehicles';
import {
  TRAILER_AXLE_OPTIONS,
  TRAILER_TYPE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
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
const VEHICLE_STANDARD_PAYLOAD_CAPACITY_KG: Record<VehicleType, number> = {
  PATINETA: 26500,
  MULA: 35500,
  C2: 9500,
  C3: 16500,
};
const VEHICLE_MAX_LEGAL_PAYLOAD_CAPACITY_KG = VEHICLE_STANDARD_PAYLOAD_CAPACITY_KG;
const getVehicleTypeRequirements = (
  type: VehicleType,
): { axles: 2 | 3; requiresTrailer: boolean } => ({
  axles: type === 'MULA' || type === 'C3' ? 3 : 2,
  requiresTrailer: type === 'PATINETA' || type === 'MULA',
});
const TRAILER_STANDARD_PAYLOAD_CAPACITY_KG: Record<1 | 2 | 3, number> = {
  1: 16500,
  2: 33000,
  3: 35500,
};

const getTrailerStandardPayloadCapacity = (
  axles: number | undefined,
): number | undefined => {
  if (axles === 1 || axles === 2 || axles === 3) {
    return TRAILER_STANDARD_PAYLOAD_CAPACITY_KG[axles];
  }
  return undefined;
};

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
  const capacityCustomized = useRef(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<CreateVehicleFormValues>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: {
      plate: '',
      type: assetType === 'trailer' ? 'TRAILER' : 'PATINETA',
      brand: '',
      trailerType: undefined,
      axles: assetType === 'vehicle' ? 2 : undefined,
      requiresTrailer: assetType === 'vehicle',
      currentLocationId: undefined,
      notes: '',
      modelYear: new Date().getFullYear(),
      affiliation: 'CORDIVEHICULOS',
      cargoCapacity:
        assetType === 'vehicle'
          ? VEHICLE_STANDARD_PAYLOAD_CAPACITY_KG.PATINETA
          : 0,
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
      const initialVehicleType = editingVehicle?.type ?? 'PATINETA';
      const initialRequirements = getVehicleTypeRequirements(initialVehicleType);
      const initialCapacity =
        editingVehicle?.cargoCapacity ??
        (editingVehicle
          ? VEHICLE_STANDARD_PAYLOAD_CAPACITY_KG[editingVehicle.type]
          : undefined) ??
        editingTrailer?.capacity ??
        (editingTrailer
          ? getTrailerStandardPayloadCapacity(editingTrailer.axles)
          : undefined) ??
        (assetType === 'vehicle'
          ? VEHICLE_STANDARD_PAYLOAD_CAPACITY_KG.PATINETA
          : 0);
      capacityCustomized.current =
        (editingVehicle !== null &&
          editingVehicle.cargoCapacity !== null &&
          editingVehicle.cargoCapacity !==
            VEHICLE_STANDARD_PAYLOAD_CAPACITY_KG[editingVehicle.type]) ||
        (editingTrailer !== null &&
          editingTrailer.capacity !== null &&
          editingTrailer.capacity !==
            getTrailerStandardPayloadCapacity(editingTrailer.axles));
      reset({
        plate: editingVehicle?.plate ?? editingTrailer?.plate ?? '',
        type: editingTrailer ? 'TRAILER' : editingVehicle?.type ?? (assetType === 'trailer' ? 'TRAILER' : 'PATINETA'),
        brand: editingVehicle?.brand ?? editingTrailer?.brand ?? '',
        trailerType: editingTrailer?.trailerType,
        axles: editingVehicle
          ? initialRequirements.axles
          : editingTrailer?.axles,
        requiresTrailer: editingVehicle
          ? initialRequirements.requiresTrailer
          : false,
        currentLocationId: editingTrailer?.currentLocationId,
        notes: editingTrailer?.notes ?? '',
        modelYear: editingVehicle?.modelYear ?? new Date().getFullYear(),
        affiliation: editingVehicle?.affiliation ?? 'CORDIVEHICULOS',
        cargoCapacity: initialCapacity,
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
        const typeRequirements = getVehicleTypeRequirements(formValues.type);
        const updated = await onUpdateVehicle(editingVehicle.id, {
          plate: formValues.plate.trim().toUpperCase(),
          type: formValues.type,
          axles: typeRequirements.axles,
          requiresTrailer: typeRequirements.requiresTrailer,
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
          (formValues.axles !== 1 &&
            formValues.axles !== 2 &&
            formValues.axles !== 3) ||
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
        axles:
          formValues.type === 'TRAILER'
            ? formValues.axles
            : getVehicleTypeRequirements(formValues.type).axles,
        requiresTrailer:
          formValues.type === 'TRAILER'
            ? false
            : getVehicleTypeRequirements(formValues.type).requiresTrailer,
        brand: formValues.brand?.trim() ?? '',
        trailerType: formValues.trailerType,
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
  const capacityKg = useWatch({ control, name: 'cargoCapacity' });
  const selectedVehicleType = useWatch({ control, name: 'type' });
  const selectedTrailerAxles = useWatch({ control, name: 'axles' });
  const legalPayloadCapacityKg =
    selectedVehicleType !== 'TRAILER'
      ? VEHICLE_MAX_LEGAL_PAYLOAD_CAPACITY_KG[selectedVehicleType]
      : undefined;
  const vehicleCapacityHelp =
    selectedVehicleType === 'PATINETA'
      ? 'Estándar máximo con tráiler de 3 ejes (2S3). Se ajustará automáticamente según el tráiler acoplado.'
      : selectedVehicleType === 'MULA'
        ? 'Estándar máximo con tráiler de 3 ejes (3S3). Se ajustará automáticamente según el tráiler acoplado.'
        : selectedVehicleType === 'C2'
          ? 'Estándar legal C2 (PBV 17.000 kg). Editable según tarjeta de propiedad.'
          : selectedVehicleType === 'C3'
            ? 'Estándar legal C3 (PBV 28.000 kg). Editable según tarjeta de propiedad.'
            : null;
  const trailerCapacityHelp = getTrailerStandardPayloadCapacity(
    selectedTrailerAxles,
  );
  const vehicleTypeRegistration = register('type');
  const trailerAxlesRegistration = register('axles', {
    setValueAs: (value: string) => (value === '' ? undefined : Number(value)),
  });
  const capacityRegistration = register('cargoCapacity', {
    valueAsNumber: true,
  });
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
            : `Editar vehículo ${editingVehicle?.plate ?? ''}`
          : assetType === 'trailer'
            ? 'Registrar nuevo tráiler'
            : 'Registrar nuevo vehículo'
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
                  options={TRAILER_TYPE_OPTIONS}
                  {...register('trailerType')}
                  error={inputError('trailerType')}
                  required
                />
              </>
            ) : (
              <>
                <span>Tipo de vehículo</span>
                <Select
                  options={VEHICLE_TYPE_OPTIONS}
                  {...vehicleTypeRegistration}
                  onChange={(event) => {
                    void vehicleTypeRegistration.onChange(event);
                    const selectedType = event.currentTarget.value;
                    if (
                      selectedType === 'PATINETA' ||
                      selectedType === 'MULA' ||
                      selectedType === 'C2' ||
                      selectedType === 'C3'
                    ) {
                      const requirements =
                        getVehicleTypeRequirements(selectedType);
                      setValue('axles', requirements.axles, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue('requiresTrailer', requirements.requiresTrailer, {
                        shouldDirty: true,
                      });
                    }
                    if (
                      !capacityCustomized.current &&
                      (selectedType === 'PATINETA' ||
                        selectedType === 'MULA' ||
                        selectedType === 'C2' ||
                        selectedType === 'C3')
                    ) {
                      setValue(
                        'cargoCapacity',
                        VEHICLE_STANDARD_PAYLOAD_CAPACITY_KG[selectedType],
                        { shouldDirty: true, shouldValidate: true },
                      );
                    }
                  }}
                  error={inputError('type')}
                />
              </>
            )}
          </label>

          {assetType === 'trailer' && (
            <label className={styles.field}>
              <span>Número de ejes</span>
              <Select
                options={TRAILER_AXLE_OPTIONS.map((axles) => ({
                  value: String(axles),
                  label: `${axles} ejes`,
                }))}
                {...trailerAxlesRegistration}
                onChange={(event) => {
                  void trailerAxlesRegistration.onChange(event);
                  const standardCapacity = getTrailerStandardPayloadCapacity(
                    Number(event.currentTarget.value),
                  );
                  if (standardCapacity !== undefined) {
                    setValue('cargoCapacity', standardCapacity, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                }}
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

          <label className={styles.field}>
            <span>Capacidad de carga (kg)</span>
            <Input
              type="number"
              {...capacityRegistration}
              onChange={(event) => {
                capacityCustomized.current = true;
                void capacityRegistration.onChange(event);
              }}
              min="0.01"
              step="any"
              placeholder={
                assetType === 'vehicle'
                  ? `Ej. ${VEHICLE_STANDARD_PAYLOAD_CAPACITY_KG.PATINETA}`
                  : 'Ej. 33000'
              }
              error={inputError('cargoCapacity')}
            />
            {assetType === 'vehicle' && vehicleCapacityHelp && (
              <span className={styles.helper}>{vehicleCapacityHelp}</span>
            )}
            {assetType === 'trailer' && trailerCapacityHelp !== undefined && (
              <span className={styles.helper}>
                Estándar para tráiler de {selectedTrailerAxles} eje
                {selectedTrailerAxles === 1 ? '' : 's'}: {trailerCapacityHelp.toLocaleString('es-CO')} kg. Editable según ficha técnica.
              </span>
            )}
            {typeof capacityKg === 'number' &&
              Number.isFinite(capacityKg) &&
              capacityKg > 0 && (
                <span className={styles.helper}>
                  = {(capacityKg / 1000).toFixed(1)} Ton
                </span>
              )}
            {typeof capacityKg === 'number' &&
              Number.isFinite(capacityKg) &&
              capacityKg > 0 &&
              capacityKg < 1000 && (
                <span className={styles.warning} role="alert">
                  El valor es menor a 1.000 kg. Verifica que ingresaste kilogramos,
                  no toneladas (por ejemplo, 30.000 kg para 30 Ton).
                </span>
              )}
            {assetType === 'vehicle' &&
              legalPayloadCapacityKg !== undefined &&
              typeof capacityKg === 'number' &&
              Number.isFinite(capacityKg) &&
              capacityKg > legalPayloadCapacityKg && (
                <span className={styles.warning} role="alert">
                  La capacidad supera el máximo legal de esta categoría (
                  {legalPayloadCapacityKg.toLocaleString('es-CO')} kg).
                  Verifica la tarjeta de propiedad y la tipología permitida.
                </span>
              )}
          </label>

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

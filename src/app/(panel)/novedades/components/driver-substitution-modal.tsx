'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { SuperModal } from '@/components/organisms/modal/modal';
import {
  driverSubstitutionSchema,
  type DriverSubstitutionFormData,
} from '@/schemas/resource-absence.schema';
import {
  resourceAbsenceService,
  type ResourceAbsence,
} from '@/services/resource-absence.service';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';

interface DriverSubstitutionModalProps {
  isOpen: boolean;
  absence: ResourceAbsence;
  onClose: () => void;
  onSuccess: () => void;
}

export function DriverSubstitutionModal({
  isOpen,
  absence,
  onClose,
  onSuccess,
}: DriverSubstitutionModalProps) {
  const queryClient = useQueryClient();
  const vehicleQuery = useQuery({
    queryKey: ['absence-driver-vehicle', absence.userId],
    queryFn: () => resourceAbsenceService.getAbsentDriverVehicle(absence.userId),
    enabled: isOpen,
  });
  const driversQuery = useQuery({
    queryKey: ['absence-substitute-drivers', absence.userId],
    queryFn: () => resourceAbsenceService.getAvailableDrivers(absence.userId),
    enabled: isOpen,
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DriverSubstitutionFormData>({
    resolver: zodResolver(driverSubstitutionSchema),
    defaultValues: { substituteDriverId: 0 },
  });

  const submit = async (values: DriverSubstitutionFormData) => {
    const vehicle = vehicleQuery.data;
    if (!vehicle) {
      showToast.error('El conductor ausente no tiene un vehículo disponible para sustituir.');
      return;
    }
    try {
      await resourceAbsenceService.delegateDriver({
        absentDriverId: absence.userId,
        vehicleId: vehicle.id,
        substituteDriverId: values.substituteDriverId,
      });
      showToast.success(`Conductor asignado temporalmente al vehículo ${vehicle.plate}.`);
      await queryClient.invalidateQueries({ queryKey: ['resource-absences'] });
      await queryClient.invalidateQueries({ queryKey: ['drivers'] });
      await queryClient.invalidateQueries({ queryKey: ['assignments'] });
      onSuccess();
    } catch (error: unknown) {
      showToast.error(
        getUserFriendlyErrorMessage(error, 'No se pudo asignar el conductor sustituto.'),
      );
    }
  };

  return (
    <SuperModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sustituir conductor · ${absence.user.name || 'Conductor'}`}
      width="560px"
    >
      <form
        onSubmit={(event) => void handleSubmit(submit)(event)}
        style={{ display: 'grid', gap: 14, padding: 20 }}
      >
        <div
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            background: '#f8fafc',
            padding: 12,
          }}
        >
          <strong>Vehículo liberado</strong>
          {vehicleQuery.isLoading ? (
            <p style={{ marginBottom: 0 }}>Buscando el camión asignado…</p>
          ) : vehicleQuery.isError ? (
            <p role="alert" style={{ marginBottom: 0, color: '#b91c1c' }}>
              No se pudo consultar el vehículo de la ausencia.
            </p>
          ) : vehicleQuery.data ? (
            <p style={{ marginBottom: 0 }}>
              {vehicleQuery.data.plate}
            </p>
          ) : (
            <p role="alert" style={{ marginBottom: 0, color: '#b91c1c' }}>
              Esta ausencia no tiene un vehículo liberado para sustituir.
            </p>
          )}
        </div>
        <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
          Conductor sustituto disponible
          <select
            {...register('substituteDriverId', { valueAsNumber: true })}
            required
            disabled={
              driversQuery.isLoading ||
              driversQuery.isError ||
              !driversQuery.data?.length
            }
          >
            <option value="">Seleccionar conductor</option>
            {(driversQuery.data ?? []).map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name || 'Sin nombre'}{driver.cedula ? ` · ${driver.cedula}` : ''}
              </option>
            ))}
          </select>
          {errors.substituteDriverId && (
            <span role="alert" style={{ color: '#b91c1c' }}>
              {errors.substituteDriverId.message}
            </span>
          )}
          {driversQuery.isError && (
            <span role="alert" style={{ color: '#b91c1c' }}>
              No se pudieron cargar los conductores disponibles.
            </span>
          )}
          {!driversQuery.isLoading &&
            !driversQuery.isError &&
            !driversQuery.data?.length && (
              <span>No hay conductores disponibles para esta sustitución.</span>
            )}
        </label>
        <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
          La asignación del vehículo y las operaciones activas quedarán
          registradas para restaurarse al cerrar la ausencia.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              vehicleQuery.isLoading ||
              vehicleQuery.isError ||
              !vehicleQuery.data ||
              driversQuery.isLoading ||
              driversQuery.isError ||
              !driversQuery.data?.length
            }
          >
            {isSubmitting ? 'Asignando…' : 'Asignar sustituto'}
          </button>
        </div>
      </form>
    </SuperModal>
  );
}

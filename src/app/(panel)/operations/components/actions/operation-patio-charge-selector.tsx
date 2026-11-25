'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { locationService } from '@/services/location.service';
import type { Operation } from '@/types/operation-types';

interface OperationPatioChargeSelectorProps {
  operation: Operation | undefined;
  isPatioCharge: boolean;
  patioLocationId: number | null;
  disabled?: boolean;
  onPatioChargeChange: (enabled: boolean) => void;
  onPatioLocationChange: (locationId: number | null) => void;
}

export function OperationPatioChargeSelector({
  operation,
  isPatioCharge,
  patioLocationId,
  disabled = false,
  onPatioChargeChange,
  onPatioLocationChange,
}: OperationPatioChargeSelectorProps) {
  const routePatios = useMemo(() => {
    const locations = [
      operation?.origen,
      operation?.destino,
      ...(operation?.stops ?? []).map((stop) => stop.location),
    ];
    const uniquePatios = new Map<number, { id: number; name: string }>();

    locations.forEach((location) => {
      if (location?.isDepot) {
        uniquePatios.set(location.id, {
          id: location.id,
          name: location.name,
        });
      }
    });

    return [...uniquePatios.values()];
  }, [operation?.origen, operation?.destino, operation?.stops]);
  const depotsQuery = useQuery({
    queryKey: ['locations'],
    queryFn: locationService.getAll,
    enabled:
      operation?.isContainerized === true &&
      isPatioCharge &&
      routePatios.length === 0,
    staleTime: 1000 * 60 * 10,
  });
  const systemPatios = useMemo(
    () =>
      (depotsQuery.data ?? [])
        .filter((location) => location.isDepot)
        .map(({ id, name }) => ({ id, name })),
    [depotsQuery.data],
  );

  if (operation?.isContainerized !== true) return null;

  const availablePatios =
    routePatios.length > 0 ? routePatios : systemPatios;

  return (
    <div style={{ display: 'grid', gap: 8, margin: '12px 0' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={isPatioCharge}
          disabled={disabled}
          onChange={(event) => {
            const enabled = event.target.checked;
            onPatioChargeChange(enabled);
            onPatioLocationChange(
              enabled && routePatios.length === 1
                ? routePatios[0].id
                : null,
            );
          }}
        />
        <span>Es cobro de patio</span>
      </label>

      {isPatioCharge && routePatios.length === 1 && (
        <p
          role="status"
          style={{
            margin: 0,
            padding: '8px 10px',
            borderRadius: 6,
            background: '#f0fdf4',
            color: '#166534',
          }}
        >
          Cobro vinculado automáticamente al patio {routePatios[0].name}.
        </p>
      )}

      {isPatioCharge && routePatios.length > 1 && (
        <label style={{ display: 'grid', gap: 6 }}>
          Patio de la ruta
          <select
            required
            value={patioLocationId ?? ''}
            disabled={disabled}
            onChange={(event) =>
              onPatioLocationChange(
                event.target.value ? Number(event.target.value) : null,
              )
            }
          >
            <option value="">Selecciona el patio del cobro</option>
            {routePatios.map((patio) => (
              <option key={patio.id} value={patio.id}>
                {patio.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {isPatioCharge && routePatios.length === 0 && (
        <>
          <p style={{ margin: 0 }}>
            La ruta no tiene patios definidos. Selecciona un patio activo del
            sistema.
          </p>
          {depotsQuery.isError ? (
            <p role="alert">No se pudieron cargar los patios disponibles.</p>
          ) : (
            <label style={{ display: 'grid', gap: 6 }}>
              Patio activo
              <select
                required
                value={patioLocationId ?? ''}
                disabled={disabled || depotsQuery.isLoading}
                onChange={(event) =>
                  onPatioLocationChange(
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
              >
                <option value="">
                  {depotsQuery.isLoading
                    ? 'Cargando patios...'
                    : 'Selecciona un patio'}
                </option>
                {availablePatios.map((patio) => (
                  <option key={patio.id} value={patio.id}>
                    {patio.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!depotsQuery.isLoading &&
            !depotsQuery.isError &&
            systemPatios.length === 0 && (
              <p role="alert">No hay patios activos disponibles.</p>
            )}
        </>
      )}
    </div>
  );
}

'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { driverPortalService } from '@/services/driverPortal.service';
import {
  CATEGORIES_BY_TARGET,
  NOVEDAD_CATEGORY_LABELS,
  novedadesService,
  type NovedadCategory,
} from '@/services/novedades.servies';
import type { Operation, Vehicle } from '@/types/driver-portal.types';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
import { Button } from '@/components/atoms/button/button';
import { Select } from '@/components/atoms/select/select';

const STATUS_LABELS = { PENDING: 'Pendiente', IN_REVIEW: 'En revisión', RESOLVED: 'Resuelta' } as const;

const cardStyle = {
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
} as const;

const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: '0.95rem',
} as const;

interface DriverNovedadesTabProps {
  operations: Operation[];
  vehicles: Vehicle[];
}

export function DriverNovedadesTab({
  operations,
  vehicles,
}: DriverNovedadesTabProps) {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<'DRIVER' | 'VEHICLE'>('DRIVER');
  const [category, setCategory] = useState<NovedadCategory>('ENFERMEDAD');
  const [description, setDescription] = useState('');
  const [expectedReturnAt, setExpectedReturnAt] = useState('');
  const [assetKey, setAssetKey] = useState('');
  const [componentIds, setComponentIds] = useState<number[]>([]);

  const assetOptions = useMemo(() => {
    const operationAssets = operations
      .filter((operation) => operation.isActive)
      .flatMap((operation) => [
        ...(operation.vehicle
          ? [{
              key: `${operation.id}:${operation.vehicle.id}`,
              operationId: operation.id,
              vehicle: operation.vehicle,
              label: `Cabezote · ${operation.vehicle.plate} · Operación #${operation.id}`,
            }]
          : []),
      ]);
    const listedVehicleIds = new Set(
      operationAssets.map((item) => item.vehicle.id),
    );
    return [
      ...operationAssets,
      ...vehicles
        .filter((vehicle) => !listedVehicleIds.has(vehicle.id))
        .map((vehicle) => ({
          key: `0:${vehicle.id}`,
          operationId: undefined,
          vehicle,
          label: `${vehicle.type === 'MULA' ? 'Mula (C3)' : 'Patineta (C2)'} · ${vehicle.plate}`,
        })),
    ];
  }, [operations, vehicles]);
  const selectedAsset = assetOptions.find((asset) => asset.key === assetKey);
  const isMechanicalFailure =
    target === 'VEHICLE' && category === 'FALLA_MECANICA';
  const componentsQuery = useQuery({
    queryKey: ['maintenance-components', selectedAsset?.vehicle.type],
    queryFn: () =>
      novedadesService.getMaintenanceComponents(selectedAsset?.vehicle.type),
    enabled: isMechanicalFailure && Boolean(selectedAsset?.vehicle.type),
  });

  const mine = useQuery({
    queryKey: ['driver-portal', 'novedades'],
    queryFn: driverPortalService.getMyNovedades,
  });

  const report = useMutation({
    mutationFn: driverPortalService.reportNovedad,
    onSuccess: async () => {
      showToast.success('Novedad reportada. Tu equipo fue notificado.');
      setDescription('');
      setExpectedReturnAt('');
      setComponentIds([]);
      setAssetKey('');
      await queryClient.invalidateQueries({ queryKey: ['driver-portal'] });
    },
    onError: (error) =>
      showToast.error(getUserFriendlyErrorMessage(error, 'No se pudo reportar la novedad.')),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (description.trim().length < 20) return;
    report.mutate({
      target,
      category,
      description: description.trim(),
      ...(target === 'VEHICLE' && selectedAsset
        ? {
            vehicleId: selectedAsset.vehicle.id,
            ...(selectedAsset.operationId
              ? { operationId: selectedAsset.operationId }
              : {}),
          }
        : {}),
      ...(isMechanicalFailure ? { componentIds } : {}),
      ...(expectedReturnAt ? { expectedReturnAt: new Date(expectedReturnAt).toISOString() } : {}),
    });
  };

  const blocking = mine.data?.blockingNovedad;

  return (
    <div style={{ padding: 16, maxWidth: 640, margin: '0 auto' }}>
      {blocking && (
        <div role="status" style={{ ...cardStyle, background: '#fffbeb', borderColor: '#fcd34d' }}>
          <strong>Estás marcado como NO disponible</strong>
          <p style={{ margin: '6px 0 0' }}>
            Novedad #{blocking.id}
            {blocking.category ? ` · ${NOVEDAD_CATEGORY_LABELS[blocking.category]}` : ''}. Tu
            analista o jefe de flota la resolverá para volver a asignarte un vehículo.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Reportar novedad</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <label>
            ¿Qué ocurrió con…?
            <Select
              value={target}
              onChange={(event) => {
                const next = event.target.value as 'DRIVER' | 'VEHICLE';
                setTarget(next);
                setCategory(CATEGORIES_BY_TARGET[next][0]);
                setAssetKey('');
                setComponentIds([]);
              }}
              style={fieldStyle}
            >
              <option value="DRIVER">Yo (conductor)</option>
              <option value="VEHICLE">Cabezote</option>
            </Select>
          </label>
          {target === 'VEHICLE' && (
            <label>
              Recurso afectado
              <Select
                value={assetKey}
                onChange={(event) => {
                  setAssetKey(event.target.value);
                  setComponentIds([]);
                }}
                style={fieldStyle}
                required
              >
                <option value="">Selecciona el cabezote</option>
                {assetOptions.map((asset) => (
                  <option key={asset.key} value={asset.key}>
                    {asset.label}
                  </option>
                ))}
              </Select>
            </label>
          )}
          <label>
            Motivo
            <Select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as NovedadCategory);
                setComponentIds([]);
              }}
              style={fieldStyle}
            >
              {CATEGORIES_BY_TARGET[target].map((item) => (
                <option key={item} value={item}>
                  {NOVEDAD_CATEGORY_LABELS[item]}
                </option>
              ))}
            </Select>
          </label>
          {isMechanicalFailure && (
            <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 12 }}>
              <legend>Componentes afectados</legend>
              {componentsQuery.isLoading ? (
                <p>Cargando despiece...</p>
              ) : componentsQuery.isError ? (
                <p role="alert">No se pudo cargar el despiece. Intenta de nuevo.</p>
              ) : componentsQuery.data?.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                  {componentsQuery.data.map((component) => (
                    <label key={component.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={componentIds.includes(component.id)}
                        onChange={(event) =>
                          setComponentIds((current) =>
                            event.target.checked
                              ? [...current, component.id]
                              : current.filter((id) => id !== component.id),
                          )
                        }
                      />
                      {component.name}
                    </label>
                  ))}
                </div>
              ) : (
                <p>No hay componentes configurados para este tipo de vehículo.</p>
              )}
            </fieldset>
          )}
          <label>
            Fecha estimada de retorno (opcional)
            <input
              type="datetime-local"
              value={expectedReturnAt}
              onChange={(event) => setExpectedReturnAt(event.target.value)}
              style={fieldStyle}
            />
          </label>
          <label>
            Descripción
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              minLength={20}
              rows={4}
              required
              style={fieldStyle}
              placeholder="Describe qué pasó, dónde, desde cuándo y cómo afecta la operación."
            />
          </label>
          <Button
            type="submit"
            disabled={
              report.isPending ||
              description.trim().length < 20 ||
              (target === 'VEHICLE' && !selectedAsset) ||
              (isMechanicalFailure &&
                (componentIds.length === 0 || !componentsQuery.data?.length))
            }
            isLoading={report.isPending}
          >
            {report.isPending ? 'Enviando...' : 'Reportar novedad'}
          </Button>
        </div>
      </form>

      <h3>Mis novedades</h3>
      {mine.isLoading ? (
        <p>Cargando...</p>
      ) : mine.isError ? (
        <p role="alert">No se pudieron cargar tus novedades.</p>
      ) : (mine.data?.novedades.length ?? 0) === 0 ? (
        <p>No has reportado novedades.</p>
      ) : (
        mine.data?.novedades.map((item) => (
          <div key={item.id} style={cardStyle}>
            <strong>
              #{item.id} · {item.category ? NOVEDAD_CATEGORY_LABELS[item.category] : item.target}
            </strong>{' '}
            <span>({STATUS_LABELS[item.status]})</span>
            <p style={{ margin: '6px 0 0' }}>{item.description}</p>
            {item.vehicle && (
              <p style={{ margin: '6px 0 0' }}>
                {item.vehicle.type === 'MULA' ? 'Mula (C3)' : 'Patineta (C2)'} ·{' '}
                {item.vehicle.plate}
              </p>
            )}
            <small>{new Date(item.createdAt).toLocaleString('es-CO')}</small>
          </div>
        ))
      )}
    </div>
  );
}

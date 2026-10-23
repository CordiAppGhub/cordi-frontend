'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { driverPortalService } from '@/services/driverPortal.service';
import {
  CATEGORIES_BY_TARGET,
  NOVEDAD_CATEGORY_LABELS,
  type NovedadCategory,
} from '@/services/novedades.servies';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';

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

export function DriverNovedadesTab() {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<'DRIVER' | 'VEHICLE'>('DRIVER');
  const [category, setCategory] = useState<NovedadCategory>('ENFERMEDAD');
  const [description, setDescription] = useState('');
  const [expectedReturnAt, setExpectedReturnAt] = useState('');

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
            <select
              value={target}
              onChange={(event) => {
                const next = event.target.value as 'DRIVER' | 'VEHICLE';
                setTarget(next);
                setCategory(CATEGORIES_BY_TARGET[next][0]);
              }}
              style={fieldStyle}
            >
              <option value="DRIVER">Yo (conductor)</option>
              <option value="VEHICLE">Mi vehículo</option>
            </select>
          </label>
          <label>
            Motivo
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as NovedadCategory)}
              style={fieldStyle}
            >
              {CATEGORIES_BY_TARGET[target].map((item) => (
                <option key={item} value={item}>
                  {NOVEDAD_CATEGORY_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
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
          <button
            type="submit"
            disabled={report.isPending || description.trim().length < 20}
            style={{ padding: '12px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, opacity: report.isPending ? 0.6 : 1 }}
          >
            {report.isPending ? 'Enviando...' : 'Reportar novedad'}
          </button>
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
            <small>{new Date(item.createdAt).toLocaleString('es-CO')}</small>
          </div>
        ))
      )}
    </div>
  );
}

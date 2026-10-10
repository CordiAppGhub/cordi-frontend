'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Loader2,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { driversService } from '@/services/driver.service';
import { operationService, AmparoSuggestion } from '@/services/operation.service';
import { vehiclesService } from '@/services/vehicles.service';
import { useAuthStore } from '@/store/use-auth.store';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
import { SuperModal } from '@/components/organisms/modal/modal';

interface Props {
  enabled: boolean;
}

const formatAppointment = (date: string) =>
  new Date(date).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

const getCounterpartAnalystName = (suggestion: AmparoSuggestion, userId: number) => {
  const { exportOperation, importOperation } = suggestion;
  const isExportOwner = exportOperation.analyst?.id === userId;
  const isImportOwner = importOperation.analyst?.id === userId;

  if (isExportOwner && !isImportOwner) {
    return importOperation.analyst?.name || 'responsable de importación';
  }
  if (isImportOwner && !isExportOwner) {
    return exportOperation.analyst?.name || 'responsable de exportación';
  }
  return 'responsable de la otra operación';
};

export function OperationAmparosPanel({ enabled }: Props) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [selected, setSelected] = useState<AmparoSuggestion | null>(null);
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [agreementConfirmed, setAgreementConfirmed] = useState(false);

  const suggestionsQuery = useQuery({
    queryKey: ['amparo-suggestions'],
    queryFn: operationService.getAmparoSuggestions,
    enabled,
    refetchInterval: 60_000,
  });
  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: driversService.getAll,
    enabled: Boolean(selected),
  });
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesService.getAll,
    enabled: Boolean(selected),
  });
  const confirmMutation = useMutation({
    mutationFn: operationService.confirmAmparo,
    onSuccess: async () => {
      showToast.success('Amparo confirmado; ambas operaciones comparten conductor y vehículo.');
      setSelected(null);
      setAgreementConfirmed(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['amparo-suggestions'] }),
        queryClient.invalidateQueries({ queryKey: ['trafico'] }),
      ]);
    },
    onError: (error) =>
      showToast.error(getUserFriendlyErrorMessage(error, 'No se pudo confirmar el amparo.')),
  });

  useEffect(() => {
    if (enabled && suggestionsQuery.isError) {
      showToast.error(
        suggestionsQuery.error,
        'No se pudieron consultar las posibilidades de amparo.',
      );
    }
  }, [enabled, suggestionsQuery.error, suggestionsQuery.isError]);

  const suggestions = suggestionsQuery.data ?? [];
  if (
    !enabled ||
    suggestionsQuery.isLoading ||
    suggestionsQuery.isError ||
    suggestions.length === 0
  ) {
    return null;
  }

  const openConfirmation = (suggestion: AmparoSuggestion) => {
    setAgreementConfirmed(false);
    setDriverId(
      String(suggestion.exportOperation.driver?.id ?? suggestion.importOperation.driver?.id ?? ''),
    );
    setVehicleId(
      String(suggestion.exportOperation.vehicle?.id ?? suggestion.importOperation.vehicle?.id ?? ''),
    );
    setSelected(suggestion);
  };
  const confirm = () => {
    if (!selected || !driverId || !vehicleId) return;
    if (user?.role === 'ANALISTA' && !agreementConfirmed) return;
    confirmMutation.mutate({
      exportOperationId: selected.exportOperation.id,
      importOperationId: selected.importOperation.id,
      driverId: Number(driverId),
      vehicleId: Number(vehicleId),
    });
  };

  return (
    <section
      aria-labelledby="amparos-panel-title"
      className="space-y-4 rounded-xl border border-amber-200 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <ShieldCheck size={21} aria-hidden="true" />
          </span>
          <div>
            <h2 id="amparos-panel-title" className="text-lg font-bold text-slate-900">
              Posibles contenedores amparados
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Operaciones compatibles por puerto y ventana de cita.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
          {suggestions.length}
          {suggestions.length === 1 ? ' posibilidad' : ' posibilidades'}
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {suggestions.map(({ exportOperation, importOperation }) => (
          <article
            key={`${exportOperation.id}-${importOperation.id}`}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} className="text-amber-700" aria-hidden="true" />
                {exportOperation.port?.name ?? 'Puerto sin nombre'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock size={15} className="text-slate-500" aria-hidden="true" />
                {formatAppointment(exportOperation.appointmentAt)}
              </span>
            </div>
            <div className="grid items-stretch gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
              <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">
                  Exportación · #{exportOperation.id}
                </p>
                <p className="mt-1 text-xs font-semibold text-blue-900">
                  Pedido: {exportOperation.numeroPedido || 'Sin número de pedido'}
                </p>
                <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                  {exportOperation.containerNumber || 'Contenedor sin asignar'}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Analista: {exportOperation.analyst?.name || 'Sin asignar'}
                </p>
              </div>
              <ArrowRight
                size={18}
                className="mx-auto rotate-90 text-slate-400 sm:rotate-0"
                aria-label="compatible con"
              />
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                  Importación · #{importOperation.id}
                </p>
                <p className="mt-1 text-xs font-semibold text-emerald-900">
                  Pedido: {importOperation.numeroPedido || 'Sin número de pedido'}
                </p>
                <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                  {importOperation.containerNumber || 'Contenedor sin asignar'}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Analista: {importOperation.analyst?.name || 'Sin asignar'}
                </p>
              </div>
            </div>
            {user?.role === 'ANALISTA' && (
              <div
                role="note"
                className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
              >
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-700"
                  aria-hidden="true"
                />
                <p>
                  Habla con el analista{' '}
                  <strong>
                    {getCounterpartAnalystName(
                      { exportOperation, importOperation },
                      user.id,
                    )}
                  </strong>{' '}
                  antes de aceptar. Si llegan a un acuerdo, el conductor y el vehículo
                  seleccionados se asignarán automáticamente a ambas operaciones y quedarán en su
                  trazabilidad.
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => openConfirmation({ exportOperation, importOperation })}
              className="mt-4 w-full rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 sm:w-auto"
            >
              Aceptar amparo
            </button>
          </article>
        ))}
      </div>

      <SuperModal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Confirmar amparo"
        width="520px"
      >
        {selected && (
          <div className="space-y-4 p-4">
            <p className="text-sm text-slate-700">
              Vas a relacionar estos pedidos:
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm">
                <p className="text-xs font-semibold uppercase text-blue-700">Exportación</p>
                <p className="mt-1 font-bold text-slate-900">
                  Pedido: {selected.exportOperation.numeroPedido || 'Sin número de pedido'}
                </p>
                <p className="text-xs text-slate-600">Operación #{selected.exportOperation.id}</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm">
                <p className="text-xs font-semibold uppercase text-emerald-700">Importación</p>
                <p className="mt-1 font-bold text-slate-900">
                  Pedido: {selected.importOperation.numeroPedido || 'Sin número de pedido'}
                </p>
                <p className="text-xs text-slate-600">Operación #{selected.importOperation.id}</p>
              </div>
            </div>
            <p className="text-sm text-slate-700">
              Al aceptar, se asignarán el conductor y el vehículo seleccionados a ambas operaciones.
              La relación entre los pedidos, la aceptación y las asignaciones quedarán registradas
              en la trazabilidad de ambas.
            </p>
            {user?.role === 'ANALISTA' && (
              <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                <input
                  type="checkbox"
                  checked={agreementConfirmed}
                  onChange={(event) => setAgreementConfirmed(event.target.checked)}
                  className="mt-0.5 accent-amber-700"
                />
                <span>
                  Confirmo que hablé y llegué a un acuerdo con{' '}
                  <strong>
                    {getCounterpartAnalystName(selected, user.id)}
                  </strong>
                  .
                </span>
              </label>
            )}
            <label className="block space-y-1 text-sm font-medium">
              Conductor
              <select
                value={driverId}
                onChange={(event) => setDriverId(event.target.value)}
                disabled={driversQuery.isLoading}
                className="w-full rounded border px-3 py-2"
              >
                <option value="">Seleccionar conductor</option>
                {(driversQuery.data ?? []).filter((driver) => driver.isActive).map((driver) => (
                  <option key={driver.id} value={driver.id}>{driver.name || driver.cedula}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm font-medium">
              Vehículo
              <select
                value={vehicleId}
                onChange={(event) => setVehicleId(event.target.value)}
                disabled={vehiclesQuery.isLoading}
                className="w-full rounded border px-3 py-2"
              >
                <option value="">Seleccionar vehículo</option>
                {(vehiclesQuery.data ?? [])
                  .filter((vehicle) =>
                    vehicle.status === 'AVAILABLE' ||
                    vehicle.status === 'IN_TRANSIT' ||
                    vehicle.id === selected.exportOperation.vehicle?.id ||
                    vehicle.id === selected.importOperation.vehicle?.id,
                  )
                  .map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} · {vehicle.status === 'IN_TRANSIT' ? 'En operación' : 'Disponible'}
                    </option>
                  ))}
              </select>
            </label>
            {(driversQuery.isError || vehiclesQuery.isError) && (
              <p role="alert" className="text-sm text-red-700">
                No se pudieron cargar los conductores o vehículos. Cierra y vuelve a abrir el diálogo.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                disabled={confirmMutation.isPending}
                className="rounded border px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={
                  confirmMutation.isPending ||
                  (user?.role === 'ANALISTA' && !agreementConfirmed) ||
                  !driverId ||
                  !vehicleId ||
                  driversQuery.isLoading ||
                  vehiclesQuery.isLoading
                }
                className="flex items-center gap-2 rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {confirmMutation.isPending && <Loader2 size={15} className="animate-spin" />}
                Aceptar y asignar a ambas operaciones
              </button>
            </div>
          </div>
        )}
      </SuperModal>
    </section>
  );
}

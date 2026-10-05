'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useVehicles } from '@/hooks/use-vehicles';
import { useAnalysts } from '@/hooks/useAnalysts';
import { useClients } from '@/hooks/useClient';
import { useDrivers } from '../../../fleet/conductores/hooks/use-drivers';
import { api } from '@/services/api.service';

// 🚀 1. Importa tus hooks personalizados (Ajusta las rutas a tu proyecto)

// ==========================================
// 1. ESQUEMA DE VALIDACIÓN (ZOD)
// ==========================================
const fleetScheduleSchema = z.object({
  date: z.string().min(1, { message: 'La fecha es obligatoria.' }),
  operationType: z.string().min(1, { message: 'Selecciona un tipo de operación.' }),
  clientId: z.string().min(1, { message: 'Selecciona un cliente.' }),
  analystId: z.string().min(1, { message: 'Selecciona un analista.' }),
  vehicleId: z.string().min(1, { message: 'Selecciona un vehículo.' }),
  driverId: z.string().optional(),
  manualPrice: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Number(val)), {
      message: 'El precio debe ser un número válido.',
    })
    .refine((val) => !val || Number(val) >= 0, {
      message: 'El precio no puede ser negativo.',
    }),
});

type FleetScheduleFormData = z.infer<typeof fleetScheduleSchema>;

// ==========================================
// 2. COMPONENTE PRINCIPAL
// ==========================================
interface FleetScheduleFormProps {
  onSuccessAction?: () => void;
}

export default function FleetScheduleForm({ onSuccessAction }: FleetScheduleFormProps) {
  const queryClient = useQueryClient();

  // 🚀 2. Usa tus hooks directamente (Ajusta la desestructuración según lo que devuelvan tus hooks)
  // Por ejemplo, si devuelven { data, isLoading } o directamente el array.
  const { client, isLoadingClients } = useClients();
  const { analysts, isLoadingAnalysts } = useAnalysts();
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles()
  const { drivers, isLoading: isLoadingDrivers } = useDrivers();

  const operationTypes = [
    { id: 'EXPORTACION', label: 'Exportación' },
    { id: 'IMPORTACION', label: 'Importación' },
    { id: 'RETIRO_VACIO', label: 'Retiro Vacío' },
    { id: 'DEVOLUCION', label: 'Devolución' },
  ];

  const isLoadingData = isLoadingClients || isLoadingAnalysts || isLoadingVehicles || isLoadingDrivers;

  // --- MUTACIÓN PARA GUARDAR (POST) ---
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/fleet-schedules', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-schedules'] });
      reset();
      if (onSuccessAction) onSuccessAction();
    },
  });

  // --- CONFIGURACIÓN REACT HOOK FORM ---
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FleetScheduleFormData>({
    resolver: zodResolver(fleetScheduleSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      operationType: '',
      clientId: '',
      analystId: '',
      vehicleId: '',
      driverId: '',
      manualPrice: '',
    },
  });

  const onSubmit = async (data: FleetScheduleFormData) => {
    const payload = {
      ...data,
      clientId: parseInt(data.clientId, 10),
      analystId: parseInt(data.analystId, 10),
      vehicleId: parseInt(data.vehicleId, 10),
      driverId: data.driverId ? parseInt(data.driverId, 10) : undefined,
      fleteCobroManual: data.manualPrice ? parseFloat(data.manualPrice) : undefined,
    };

    createMutation.mutate(payload);
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">Cargando catálogos...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
        <h2 className="text-lg font-bold text-slate-800">Nueva Programación de Viaje</h2>
        <p className="text-xs text-slate-500 mt-1">Asigna el vehículo y los detalles operativos para mañana.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
        {createMutation.isError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
            Ocurrió un error al guardar la programación. Verifica los datos.
          </div>
        )}

        {/* FILA 1: Fecha y Tipo de Operación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Fecha Programada <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              {...register('date')}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {errors.date && <p className="mt-1 text-xs text-rose-500">{errors.date.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Tipo de Operación <span className="text-rose-500">*</span>
            </label>
            <select
              {...register('operationType')}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Seleccione...</option>
              {operationTypes.map((op) => (
                <option key={op.id} value={op.id}>{op.label}</option>
              ))}
            </select>
            {errors.operationType && <p className="mt-1 text-xs text-rose-500">{errors.operationType.message}</p>}
          </div>
        </div>

        {/* FILA 2: Cliente y Analista */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Cliente <span className="text-rose-500">*</span>
            </label>
            <select
              {...register('clientId')}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
             <option value="">Seleccione Cliente...</option>
              {/* Usa ?.map y || [] para evitar el undefined */}
              {(client?.data || client || []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.razonSocial}</option>
              ))}
            </select>
            {errors.clientId && <p className="mt-1 text-xs text-rose-500">{errors.clientId.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Analista Asignado <span className="text-rose-500">*</span>
            </label>
            <select
              {...register('analystId')}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Seleccione Analista...</option>
              {analysts.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {errors.analystId && <p className="mt-1 text-xs text-rose-500">{errors.analystId.message}</p>}
          </div>
        </div>

        {/* FILA 3: Vehículo y Conductor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Vehículo (Placa) <span className="text-rose-500">*</span>
            </label>
            <select
              {...register('vehicleId')}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Seleccione Vehículo...</option>
              {vehicles.map((v: any) => (
                <option key={v.id} value={v.id}>{v.plate}</option>
              ))}
            </select>
            {errors.vehicleId && <p className="mt-1 text-xs text-rose-500">{errors.vehicleId.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Conductor <span className="text-slate-400 lowercase font-normal">(Opcional)</span>
            </label>
            <select
              {...register('driverId')}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Por definir...</option>
              {drivers.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* FILA 4: Flete Manual */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Flete Manual de Cobro <span className="text-slate-400 lowercase font-normal">(Opcional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-400">$</span>
            <input
              type="text"
              placeholder="Ej: 850000"
              {...register('manualPrice')}
              className="w-full pl-7 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          {errors.manualPrice ? (
            <p className="mt-1 text-xs text-rose-500">{errors.manualPrice.message}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">Si se deja en blanco, el sistema cotizará automáticamente.</p>
          )}
        </div>

        {/* ACCIONES */}
        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
          {onSuccessAction && (
            <button
              type="button"
              onClick={onSuccessAction}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors flex items-center"
          >
            {createMutation.isPending ? 'Guardando...' : 'Guardar Programación'}
          </button>
        </div>
      </form>
    </div>
  );
}
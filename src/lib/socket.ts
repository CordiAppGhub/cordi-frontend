import { io, Socket } from 'socket.io-client';
import type { QueryClient } from '@tanstack/react-query';

function getSocketOrigin(): string {
  const rawUrl =
    process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL;

  if (rawUrl) {
    try {
      // Quita cualquier ruta como "/api" para conectar siempre al namespace raíz "/"
      return new URL(rawUrl).origin;
    } catch {
      return rawUrl.replace(/\/api\/?$/, '');
    }
  }

  return typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:4000';
}

export const socket: Socket = io(getSocketOrigin(), {
  autoConnect: typeof window !== 'undefined',
  transports: ['websocket', 'polling'],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1500,
  reconnectionDelayMax: 10000,
  timeout: 10000,
});

const getOperationId = (payload: unknown): number | undefined => {
  if (typeof payload !== 'object' || payload === null) return undefined;
  const record = payload as Record<string, unknown>;
  const id = record.id ?? record.operationId;
  return typeof id === 'number' && Number.isInteger(id) ? id : undefined;
};

export function bindSocketQueryCache(queryClient: QueryClient) {
  const invalidate = (queryKeys: (readonly unknown[])[]) => {
    void Promise.all(
      queryKeys.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
  };
  const invalidateOperationData = (payload: unknown) => {
    const operationId = getOperationId(payload);
    const queryKeys: (readonly unknown[])[] = [
      ['operations'],
      ['programacion'],
      ['fleet-requests'],
      ['vehicles'],
      ['drivers'],
      ['trafico'],
      ['trafico-client-operations'],
      ['operation-history'],
      ['operations', 'pending-count'],
      ['operations', 'by-date'],
      ['fleet-live-status'],
      ['dashboard'],
    ];
    if (operationId !== undefined) {
      queryKeys.push(
        ['operation', operationId],
        ['trafico-detail', operationId],
      );
    }
    invalidate(queryKeys);
  };
  const invalidateVehicleData = () =>
    invalidate([
      ['vehicles'],
      ['trailers'],
      ['drivers'],
      ['active-assignments'],
      ['fleet-live-status'],
      ['operations'],
      ['programacion'],
      ['fleet-requests'],
      ['dashboard'],
    ]);
  const invalidateTariffData = () =>
    invalidate([
      ['tariffs'],
      ['tariff-lookup'],
      ['client-tariffs'],
      ['vehicle-tariffs'],
      ['patio-tariffs'],
      ['operations'],
      ['trafico'],
      ['dashboard'],
    ]);
  const invalidateDashboard = () =>
    invalidate([['dashboard'], ['dashboard', 'operation-alerts']]);

  const operationEvents = [
    'global_operations_updated',
    'operation:created',
    'operation:updated',
    'operation:assigned',
  ] as const;
  operationEvents.forEach((event) =>
    socket.on(event, invalidateOperationData),
  );
  socket.on('vehicle:updated', invalidateVehicleData);
  socket.on('tariff:updated', invalidateTariffData);
  socket.on('operation_alerts_updated', invalidateDashboard);

  return () => {
    operationEvents.forEach((event) =>
      socket.off(event, invalidateOperationData),
    );
    socket.off('vehicle:updated', invalidateVehicleData);
    socket.off('tariff:updated', invalidateTariffData);
    socket.off('operation_alerts_updated', invalidateDashboard);
  };
}

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  socket.on('connect', () => {
    console.log('⚡ WebSocket conectado:', socket.id);
  });
  socket.on('disconnect', (reason) => {
    console.log('🔌 WebSocket desconectado:', reason);
  });
  socket.on('connect_error', (error) => {
    console.warn('⚠️ Error WebSocket:', error.message);
  });
}
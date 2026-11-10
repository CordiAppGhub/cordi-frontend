import { useQuery } from '@tanstack/react-query';
import type { NovedadHistorial } from '@/types/operation-types';

interface OperationAuditMetadata {
  isRollback?: boolean;
  reason?: string;
  url?: string | null;
  fileUrl?: string | null;
  changes?: {
    numeroPedido?: {
      before?: string | null;
      after?: string | null;
    } | null;
  };
  comodatoOcr?: NonNullable<
    NonNullable<NovedadHistorial['metadata']>['comodatoOcr']
  >;
}

export interface AuditEvent {
  id: number;
  operationId: number;
  eventType: string;
  description: string;
  createdAt: string;
  actorId?: number;
  actor?: {
    id: number;
    name: string;
    role: string;
  };
  metadata?: OperationAuditMetadata | null;
}

export function useOperationTimeline(operationId: number) {
  return useQuery<AuditEvent[]>({
    queryKey: ['operation-timeline', operationId],
    queryFn: async () => {
      const response = await fetch(`/api/operations/${operationId}/timeline`);
      if (!response.ok) {
        throw new Error('Error al obtener la trazabilidad forense');
      }
      return response.json();
    },
    enabled: !!operationId, // Solo se ejecuta si hay un ID válido
    staleTime: 1000 * 60 * 5, // Mantener en caché 5 minutos
  });
}
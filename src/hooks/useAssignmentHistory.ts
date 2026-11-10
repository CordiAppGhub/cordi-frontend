'use client';

import { useQuery } from '@tanstack/react-query';
import { assignmentService } from '@/services/assignmentAnlystClient.service';
import { ClientAssignmentLog } from '@/types/assignmentAnlist';

export function useAssignmentHistory(clientId: number | null) {
  const { data: history = [], isLoading, error } = useQuery<ClientAssignmentLog[]>({
    queryKey: ['assignment-history', clientId],
    queryFn: () => assignmentService.getHistory(clientId!),
    enabled: clientId !== null && clientId > 0,
    staleTime: 1000 * 60 * 5,
  });

  return { history, isLoading, error };
}

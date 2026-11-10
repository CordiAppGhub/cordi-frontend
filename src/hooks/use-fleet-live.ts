import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { socket } from '@/lib/socket';
import { getFleetLiveStatus } from '@/services/fleet-live.service';

export function useFleetLive() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['fleet-live-status'] });
    };
    socket.on('global_operations_updated', refresh);
    return () => {
      socket.off('global_operations_updated', refresh);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['fleet-live-status'],
    queryFn: getFleetLiveStatus,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
}

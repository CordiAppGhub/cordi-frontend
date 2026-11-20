import { useQuery } from '@tanstack/react-query';
import { getFleetLiveStatus } from '@/services/fleet-live.service';

export function useFleetLive(enabled = true) {
  return useQuery({
    queryKey: ['fleet-live-status'],
    queryFn: getFleetLiveStatus,
    enabled,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
}

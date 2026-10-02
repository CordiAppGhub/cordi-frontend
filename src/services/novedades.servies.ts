import { api } from '@/services/api.service';

export interface NovedadItem {
  id: number;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED';
  target: 'DRIVER' | 'VEHICLE' | 'OPERATION';
  resolutionNotes?: string;
  createdAt: string;
  reportedBy: { name: string; role: string };
  resolvedBy?: { name: string };
  vehicle?: { plate: string };
  driver?: { name: string };
  operation?: { type: string; status: string; origen?: { name: string } };
}

export const novedadesService = {
  getAll: async (status?: string): Promise<NovedadItem[]> => {
    const params = status && status !== 'TODAS' ? { status } : {};
    const res = await api.get('/novedades', { params });
    return res.data;
  },

  create: async (data: {
    description: string;
    severity: string;
    target: string;
    operationId?: number;
    vehicleId?: number;
    driverId?: number;
  }) => {
    const res = await api.post('/novedades', data);
    return res.data;
  },

  resolve: async (id: number, resolutionNotes: string) => {
    const res = await api.patch(`/novedades/${id}/resolve`, { resolutionNotes });
    return res.data;
  },
};
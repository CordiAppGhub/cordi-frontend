import { api } from './api.service';
import { DashboardSummary } from '@/types/dashboard-types';

export interface DashboardFilters {
  search?: string;
  clientId?: number;
  type?: string;
  status?: string;
  analystId?: number;
  startDate?: string;
  endDate?: string;
  onlyMyOperations?: boolean;
  hasDeviations?: boolean;
}

export const dashboardService = {
  getSummary: async (filters?: DashboardFilters): Promise<DashboardSummary> => {
    const response = await api.get('/dashboard/summary', { params: filters });
    return response.data;
  },
};
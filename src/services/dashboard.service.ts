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

export interface OperationAlert {
  id: string;
  type:
    | 'SCHEDULED_DAY_PASSED'
    | 'APPOINTMENT_OVERDUE'
    | 'NO_MOVEMENT'
    | 'RESOURCE_REASSIGNMENT';
  severity: 'HIGH' | 'MEDIUM';
  operationId: number;
  title: string;
  message: string;
  operationLabel: string;
  occurredAt: string;
  lastMovementAt?: string;
  operationStatus: string;
  containerStatus: string;
  analystName?: string | null;
  driverName?: string | null;
  appointmentLocation?: string | null;
  novedadId?: number;
  resourceTarget?: 'DRIVER' | 'VEHICLE' | 'OPERATION';
}

export const dashboardService = {
  getSummary: async (filters?: DashboardFilters): Promise<DashboardSummary> => {
    const response = await api.get('/dashboard/summary', { params: filters });
    return response.data;
  },

  getOperationAlerts: async (): Promise<OperationAlert[]> => {
    const response = await api.get<{ alerts: OperationAlert[] }>(
      '/dashboard/operation-alerts',
    );
    return response.data.alerts;
  },
};
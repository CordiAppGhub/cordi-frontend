import { api } from "./api.service";

export interface FleetSchedule {
  id: number;
  date: string;
  type: string;
  fleteCobro: number | null;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  client: { id: number; razonSocial: string };
  analyst: { id: number; name: string };
  vehicle: { id: number; plate: string; status: string };
  driver?: { id: number; name: string } | null;
}

// Agrega esto al archivo existente
export const createFleetSchedule = async (scheduleData: any) => {
  const { data } = await api.post('/fleet-schedules', scheduleData);
  return data;
};

export const getFleetSchedules = async (date: string): Promise<FleetSchedule[]> => {
  try {
    const { data } = await api.get(`/fleet-schedules?date=${date}`);
    return data;
  } catch (error: any) {

    if (error.response?.status === 404) {
      console.warn(`Silencing 404 error for fleet schedules on date ${date}`);
      return [];
    }

    throw error;
  }
};
export const cancelFleetSchedule = async (id: number): Promise<void> => {
  const { data } = await api.patch(`/fleet-schedules/${id}/cancel`);
  return data;
};
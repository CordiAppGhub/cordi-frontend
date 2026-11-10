import { api } from './api.service';
import type {
  CreateTrailerInput,
  Trailer,
  UpdateTrailerInput,
} from '@/types/vehicles';

export const trailersService = {
  getAll: async (): Promise<Trailer[]> => {
    const { data } = await api.get('/trailers');
    return data;
  },

  create: async (payload: CreateTrailerInput): Promise<Trailer> => {
    const { data } = await api.post('/trailers', payload);
    return data;
  },

  update: async (
    id: string,
    payload: UpdateTrailerInput,
  ): Promise<Trailer> => {
    const { data } = await api.patch(`/trailers/${id}`, payload);
    return data;
  },
};

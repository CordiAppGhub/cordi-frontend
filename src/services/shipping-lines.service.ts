import { api } from "./api.service";

export interface ShippingLine {
  id: number;
  name: string;
  nit: string;
  createdAt: string;
}

export interface ShippingLineInput {
  name: string;
  nit: string;
}

export const shippingLinesService = {
  getAll: async (): Promise<ShippingLine[]> => {
    const { data } = await api.get<ShippingLine[]>("/shipping-lines");
    return data;
  },

  create: async (input: ShippingLineInput): Promise<ShippingLine> => {
    const { data } = await api.post<ShippingLine>("/shipping-lines", input);
    return data;
  },

  update: async (
    id: number,
    input: ShippingLineInput,
  ): Promise<ShippingLine> => {
    const { data } = await api.patch<ShippingLine>(
      `/shipping-lines/${id}`,
      input,
    );
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/shipping-lines/${id}`);
  },
};

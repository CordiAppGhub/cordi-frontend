import { z } from "zod";

export const shippingLineSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(120),
  nit: z.string().trim().min(1, "El NIT es obligatorio.").max(30),
});

export type ShippingLineFormData = z.infer<typeof shippingLineSchema>;

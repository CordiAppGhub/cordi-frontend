import { z } from 'zod';

export const clientSchema = z.object({
  nit: z.string().min(3, 'El NIT es obligatorio y debe ser válido'),
  razonSocial: z.string().min(2, 'La Razón Social es obligatoria'),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.union([z.literal(''), z.string().email('Debe ser un correo válido')]).optional(),
  isActive: z.boolean().default(true),
});

export type ClientFormData = z.infer<typeof clientSchema>;
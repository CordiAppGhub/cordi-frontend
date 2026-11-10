import { z } from 'zod';

export const assignClientSchema = z.object({
  analystId: z.number({ invalid_type_error: 'Selecciona un analista' }).int().positive('Selecciona un analista válido'),
  clientId: z.number({ invalid_type_error: 'Selecciona un cliente' }).int().positive('Selecciona un cliente válido'),
  isTemporal: z.boolean().default(false),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  reason: z.string().optional(),
}).refine((data) => {
  if (data.isTemporal && !data.reason) return false;
  return true;
}, { message: 'El motivo es obligatorio para asignaciones temporales', path: ['reason'] });

export type AssignClientFormValues = z.infer<typeof assignClientSchema>;

import { z } from 'zod';

export const createOperationSchema = z.object({
  type: z.string().min(1, 'El tipo de operación es obligatorio'),
  cliente: z.string().min(1, 'El nombre del cliente es obligatorio'),
  
  origenId: z.preprocess((val) => (val === '' || val === 0 ? undefined : Number(val)), z.number().int().optional()),
  
  // 👇 AGREGAMOS ESTE CAMPO QUE FALTABA
  descargueId: z.preprocess((val) => (val === '' || val === 0 ? undefined : Number(val)), z.number().int().optional()), 
  
  destinoId: z.preprocess((val) => (val === '' || val === 0 ? undefined : Number(val)), z.number().int().optional()),  
  vehicleId: z.preprocess((val) => (val === '' || val === 0 ? undefined : Number(val)), z.number().int().optional()),
  
  containerNumber: z.string().optional(),
  observaciones: z.string().optional(),
  scheduledAt: z.string().optional(),
});

export type CreateOperationInput = z.infer<typeof createOperationSchema>;
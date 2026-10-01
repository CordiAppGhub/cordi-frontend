import { z } from 'zod';

export const createOperationSchema = z.object({
  type: z.string().min(1, 'El tipo es obligatorio'),
  clientId: z.coerce.number().min(1, 'El cliente es obligatorio'),
  origenId: z.coerce.number().optional(),
  cargueId: z.coerce.number().optional(),
  descargueId: z.coerce.number().optional(),
  destinoId: z.coerce.number().optional(),
  scheduledAt: z.string().optional(),

  containerNumber: z.string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}\d{7}$/, 'El contenedor debe tener 4 letras y 7 números (Ej: MSKU1234567)')
    .optional()
    .or(z.literal('')),

  containerType: z.string().min(1, 'El tipo de contenedor es obligatorio'),
  
  containerWeight: z.coerce.number().positive('El peso debe ser mayor a 0').optional(),
  fechaCitaOrigen: z.string().optional(),
  fechaCitaDestino: z.string().optional(),
  fechaRetiro: z.string().optional(),
  fechaLimiteDevolucion: z.string().optional(),
  
  numeroPedido: z.string().optional(),
  documentoTransporte: z.string().optional(),
  observaciones: z.string().optional(),

  isAnticipada: z.boolean().optional(),
  fleteCobroManual: z.coerce.number().positive('El flete debe ser mayor a 0').optional(),
});

export const assignOperationSchema = z.object({
  driverId: z.coerce.number().min(1, 'El conductor es obligatorio'),
  vehicleId: z.coerce.number().min(1, 'El vehículo es obligatorio'),
  fletePagoManual: z.coerce.number().positive('El flete de pago debe ser positivo').optional(),
});

export type CreateOperationFormData = z.infer<typeof createOperationSchema>;
export type AssignOperationFormData = z.infer<typeof assignOperationSchema>;
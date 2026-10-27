import { z } from 'zod';

const optionalPositiveNumber = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z.number().positive('El peso debe ser mayor a 0').optional(),
);

const optionalShippingLineId = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z.number().int().positive().optional(),
);

const cargoFields = z.object({
  cargoFormat: z.enum(['CONTENERIZADA', 'SUELTA']).default('CONTENERIZADA'),
  containerNumber: z.string().trim().optional(),
  containerSize: z.string().optional(),
  shippingLineId: optionalShippingLineId,
  cargoDescription: z.string().trim().optional(),
  weight: optionalPositiveNumber,
  dimensions: z.string().trim().optional(),
});

const validateCargoFormat = (
  data: z.infer<typeof cargoFields>,
  context: z.RefinementCtx,
) => {
  if (data.cargoFormat === 'CONTENERIZADA') {
    if (!data.containerNumber) {
      context.addIssue({
        code: 'custom',
        path: ['containerNumber'],
        message: 'El número de contenedor es obligatorio',
      });
    } else if (!/^[A-Z]{4}\d{7}$/.test(data.containerNumber.toUpperCase())) {
      context.addIssue({
        code: 'custom',
        path: ['containerNumber'],
        message: 'El contenedor debe tener 4 letras y 7 números (Ej: MSKU1234567)',
      });
    }
    if (!data.containerSize) {
      context.addIssue({
        code: 'custom',
        path: ['containerSize'],
        message: 'El tamaño del contenedor es obligatorio',
      });
    }
    if (!data.shippingLineId) {
      context.addIssue({
        code: 'custom',
        path: ['shippingLineId'],
        message: 'La línea naviera es obligatoria',
      });
    }
    return;
  }

  if (!data.cargoDescription) {
    context.addIssue({
      code: 'custom',
      path: ['cargoDescription'],
      message: 'La descripción de la carga es obligatoria',
    });
  }
  if (!data.weight) {
    context.addIssue({
      code: 'custom',
      path: ['weight'],
      message: 'El peso es obligatorio',
    });
  }
  if (!data.dimensions) {
    context.addIssue({
      code: 'custom',
      path: ['dimensions'],
      message: 'Las dimensiones son obligatorias',
    });
  }
};

export const operationCargoSchema = cargoFields.superRefine(validateCargoFormat);

export const createOperationSchema = z.object({
  type: z.string().min(1, 'El tipo es obligatorio'),
  clientId: z.coerce.number().min(1, 'El cliente es obligatorio'),
  ...cargoFields.shape,
  origenId: z.coerce.number().optional(),
  cargueId: z.coerce.number().optional(),
  descargueId: z.coerce.number().optional(),
  destinoId: z.coerce.number().optional(),
  scheduledAt: z.string().optional(),

  containerWeight: z.coerce.number().positive('El peso debe ser mayor a 0').optional(),
  fechaCitaOrigen: z.string().optional(),
  fechaCitaDestino: z.string().optional(),
  fechaRetiro: z.string().optional(),
  fechaLimiteDevolucion: z.string().optional(),
  
  numeroPedido: z.string().optional(),
  documentoTransporte: z.string().optional(),
  observaciones: z.string().optional(),

  isAnticipada: z.boolean().optional(),
  fleteACobrarManual: z.coerce.number().positive('El flete debe ser mayor a 0').optional(),
}).superRefine(validateCargoFormat);

export const assignOperationSchema = z.object({
  driverId: z.coerce.number().min(1, 'El conductor es obligatorio'),
  vehicleId: z.coerce.number().min(1, 'El vehículo es obligatorio'),
  fleteAPagarManual: z.coerce.number().positive('El flete a pagar debe ser positivo').optional(),
});

export type CreateOperationFormData = z.infer<typeof createOperationSchema>;
export type OperationCargoFormData = z.infer<typeof operationCargoSchema>;
export type AssignOperationFormData = z.infer<typeof assignOperationSchema>;
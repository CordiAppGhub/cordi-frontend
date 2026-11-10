import { z } from 'zod';

const optionalDocument = z.custom<File | undefined>(
  (value) => value === undefined || (typeof File !== 'undefined' && value instanceof File),
);

export const createVehicleSchema = z.object({
  plate: z.string().trim().min(1, 'La placa es obligatoria'),
  type: z.enum(['PATINETA', 'MULA', 'TRAILER']),
  brand: z.string().trim().optional(),
  trailerType: z.enum(['PLANCHA', 'GRILLO', 'TANQUE']).optional(),
  axles: z.union([z.literal(2), z.literal(3)]).optional(),
  currentLocationId: z.number().int().positive().optional(),
  notes: z.string().trim().max(2000).optional(),
  modelYear: z.number().int().min(1900).max(2100).optional(),
  cargoCapacity: z.number().optional(),
  status: z.enum(['AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE', 'OUT_OF_SERVICE']).optional(),
  affiliation: z.enum(['CORDIVEHICULOS', 'CORDIHUB', 'TERCEROS']).optional(),
  insuranceFileUrl: z.string().optional(),
  insuranceFile: optionalDocument.optional(),
  insuranceExpiration: z.union([z.literal(''), z.iso.date()]).optional(),
  tecnomecanicaFileUrl: z.string().optional(),
  tecnomecanicaFile: optionalDocument.optional(),
  tecnomecanicaExpiration: z.union([z.literal(''), z.iso.date()]).optional(),
}).superRefine((values, context) => {
  if (values.type !== 'TRAILER') {
    if (!values.brand) {
      context.addIssue({
        code: 'custom',
        path: ['brand'],
        message: 'La marca es obligatoria',
      });
    }
    if (!values.modelYear) {
      context.addIssue({
        code: 'custom',
        path: ['modelYear'],
        message: 'El modelo es obligatorio',
      });
    }
    if (!values.cargoCapacity || values.cargoCapacity <= 0) {
      context.addIssue({
        code: 'custom',
        path: ['cargoCapacity'],
        message: 'Ingrese una capacidad válida',
      });
    }
    if (!values.affiliation) {
      context.addIssue({
        code: 'custom',
        path: ['affiliation'],
        message: 'La afiliación es obligatoria',
      });
    }
    if (!values.status) {
      context.addIssue({
        code: 'custom',
        path: ['status'],
        message: 'El estado es obligatorio',
      });
    }
  }
  if (values.type === 'TRAILER' && values.axles !== 2 && values.axles !== 3) {
    context.addIssue({
      code: 'custom',
      path: ['axles'],
      message: 'Selecciona si el tráiler tiene 2 o 3 ejes',
    });
  }
  if (values.type === 'TRAILER' && !values.trailerType) {
    context.addIssue({
      code: 'custom',
      path: ['trailerType'],
      message: 'Selecciona el tipo de tráiler',
    });
  }
  if (values.type === 'TRAILER' && !values.currentLocationId) {
    context.addIssue({
      code: 'custom',
      path: ['currentLocationId'],
      message: 'Selecciona el patio inicial',
    });
  }
  if (values.type !== 'TRAILER' && values.insuranceFile && !values.insuranceFileUrl) {
    context.addIssue({
      code: 'custom',
      path: ['insuranceFile'],
      message: 'El documento del seguro no se ha podido almacenar.',
    });
  }
  if (values.type !== 'TRAILER' && values.tecnomecanicaFile && !values.tecnomecanicaFileUrl) {
    context.addIssue({
      code: 'custom',
      path: ['tecnomecanicaFile'],
      message: 'El documento de tecnomecánica no se ha podido almacenar.',
    });
  }
});

export type CreateVehicleFormValues = z.infer<typeof createVehicleSchema>;

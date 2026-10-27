import { z } from 'zod';

const optionalDocument = z.custom<File | undefined>(
  (value) => value === undefined || (typeof File !== 'undefined' && value instanceof File),
);

export const createVehicleSchema = z.object({
  plate: z.string().trim().min(1, 'La placa es obligatoria'),
  type: z.enum([
    'CAMION_SENCILLO',
    'TRACTOMULA',
    'TURBO',
    'PLANCHA',
    'CABEZOTE',
    'REMOLQUE',
  ]),
  brand: z.string().trim().min(1, 'La marca es obligatoria'),
  modelYear: z.number().int().min(1900).max(2100),
  empresa: z.string().optional(),
  cargoCapacity: z.number().positive('Ingrese una capacidad válida'),
  status: z.enum(['AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE', 'OUT_OF_SERVICE']),
  affiliation: z.enum(['CORDIVEHICULOS', 'CORDIHUB', 'TERCEROS']),
  adminDiscount: z.number().min(0).optional(),
  insuranceFileUrl: z.string().optional(),
  insuranceFile: optionalDocument.optional(),
  insuranceExpiration: z.union([z.literal(''), z.iso.date()]).optional(),
  tecnomecanicaFileUrl: z.string().optional(),
  tecnomecanicaFile: optionalDocument.optional(),
  tecnomecanicaExpiration: z.union([z.literal(''), z.iso.date()]).optional(),
}).superRefine((values, context) => {
  if (values.insuranceFile && !values.insuranceFileUrl) {
    context.addIssue({
      code: 'custom',
      path: ['insuranceFile'],
      message: 'El documento del seguro no se ha podido almacenar.',
    });
  }
  if (values.tecnomecanicaFile && !values.tecnomecanicaFileUrl) {
    context.addIssue({
      code: 'custom',
      path: ['tecnomecanicaFile'],
      message: 'El documento de tecnomecánica no se ha podido almacenar.',
    });
  }
});

export type CreateVehicleFormValues = z.infer<typeof createVehicleSchema>;

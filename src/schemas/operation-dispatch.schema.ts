import { z } from 'zod';
import { TRAILER_TYPES, type TrailerType } from '@/types/vehicles';

const plateSchema = z
  .string()
  .trim()
  .min(5, 'Ingresa una placa válida.')
  .max(10, 'La placa no puede superar 10 caracteres.')
  .regex(/^[A-Za-z0-9-]+$/, 'Usa solo letras, números y guiones.');

const optionalAxles = z.preprocess(
  (value) => (value === '' || value === null ? undefined : Number(value)),
  z.union([z.literal(2), z.literal(3)]).optional(),
);

const optionalCapacity = z.preprocess(
  (value) =>
    value === '' || value === null || value === undefined
      ? undefined
      : Number(value),
  z.number().positive('La capacidad debe ser mayor que cero.').optional(),
);

export const externalFleetDispatchSchema = z.object({
  plate: plateSchema,
  trailerPlate: z
    .string()
    .trim()
    .max(10, 'La placa no puede superar 10 caracteres.')
    .refine(
      (value) => !value || /^[A-Za-z0-9-]{5,10}$/.test(value),
      'Ingresa una placa de tráiler válida.',
    ),
  tractorAxles: optionalAxles,
  trailerType: z.enum(TRAILER_TYPES).optional(),
  trailerAxles: optionalAxles,
  cargoCapacityKg: optionalCapacity,
  driverName: z
    .string()
    .trim()
    .min(3, 'Ingresa el nombre completo del conductor.'),
  driverCedula: z
    .string()
    .trim()
    .regex(/^\d{5,15}$/, 'La cédula debe tener entre 5 y 15 dígitos.'),
  driverPhone: z
    .string()
    .trim()
    .refine(
      (value) => {
        const digits = value.replace(/\D/g, '');
        return digits.length >= 7 && digits.length <= 15;
      },
      'Ingresa un teléfono válido.',
    ),
  agreedFreight: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, 'Ingresa un valor numérico válido.')
    .refine((value) => Number(value) > 0, 'El flete debe ser mayor que cero.'),
});

export const createExternalFleetDispatchSchema = (requirements: {
  isLooseCargo: boolean;
  tractorAxles: number | null;
  requiresTrailer: boolean;
  trailerAxles: number | null;
  requiredTrailerType: TrailerType | null;
}) =>
  externalFleetDispatchSchema.superRefine((values, context) => {
    if (
      requirements.requiredTrailerType &&
      !values.trailerPlate.trim()
    ) {
      context.addIssue({
        code: 'custom',
        path: ['trailerPlate'],
        message: 'La operación requiere una placa de tráiler.',
      });
    } else if (
      requirements.requiredTrailerType &&
      !values.trailerType
    ) {
      context.addIssue({
        code: 'custom',
        path: ['trailerType'],
        message: 'Selecciona el tipo de tráiler requerido por la operación.',
      });
    } else if (
      requirements.requiredTrailerType &&
      values.trailerType !== requirements.requiredTrailerType
    ) {
      context.addIssue({
        code: 'custom',
        path: ['trailerType'],
        message: `La operación requiere un tráiler tipo ${requirements.requiredTrailerType}.`,
      });
    }

    if (values.tractorAxles === undefined) {
      context.addIssue({
        code: 'custom',
        path: ['tractorAxles'],
        message: 'Selecciona los ejes del cabezote.',
      });
    } else if (
      requirements.tractorAxles !== null &&
      values.tractorAxles !== requirements.tractorAxles
    ) {
      context.addIssue({
        code: 'custom',
        path: ['tractorAxles'],
        message: `La configuración requiere un cabezote de ${requirements.tractorAxles} ejes.`,
      });
    }

    if (!requirements.isLooseCargo) return;

    const trailerRequired =
      requirements.requiresTrailer || Boolean(requirements.requiredTrailerType);
    if (
      trailerRequired &&
      !requirements.requiredTrailerType &&
      !values.trailerPlate.trim()
    ) {
      context.addIssue({
        code: 'custom',
        path: ['trailerPlate'],
        message: 'La configuración requiere una placa de tráiler.',
      });
    }
    if (!trailerRequired && values.trailerPlate.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['trailerPlate'],
        message: 'Esta configuración corresponde a un vehículo rígido.',
      });
    }

    if (values.trailerPlate.trim()) {
      if (!values.trailerType && !requirements.requiredTrailerType) {
        context.addIssue({
          code: 'custom',
          path: ['trailerType'],
          message: 'Selecciona el tipo de tráiler.',
        });
      }

      if (values.trailerAxles === undefined) {
        context.addIssue({
          code: 'custom',
          path: ['trailerAxles'],
          message: 'Selecciona los ejes del tráiler.',
        });
      } else if (
        requirements.trailerAxles !== null &&
        values.trailerAxles !== requirements.trailerAxles
      ) {
        context.addIssue({
          code: 'custom',
          path: ['trailerAxles'],
          message: `La configuración requiere un tráiler de ${requirements.trailerAxles} ejes.`,
        });
      }
    }
  });

export type ExternalFleetDispatchInput = z.input<
  typeof externalFleetDispatchSchema
>;
export type ExternalFleetDispatchValues = z.output<
  typeof externalFleetDispatchSchema
>;

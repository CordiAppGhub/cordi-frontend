import { z } from 'zod';

export const absenceReasonSchema = z.enum([
  'ENFERMEDAD',
  'PERMISO',
  'INJUSTIFICADO',
  'VACACIONES',
]);

export const createResourceAbsenceSchema = z
  .object({
    userId: z.number().int().positive('Selecciona un recurso.'),
    reason: absenceReasonSchema,
    startDate: z.string().min(1, 'Indica la fecha de inicio.'),
    endDate: z.string().min(1, 'Indica la fecha de finalización.'),
  })
  .refine((value) => new Date(value.endDate) >= new Date(value.startDate), {
    path: ['endDate'],
    message: 'La fecha final debe ser igual o posterior a la inicial.',
  })
  .refine((value) => new Date(value.startDate) <= new Date(), {
    path: ['startDate'],
    message: 'La ausencia debe comenzar hoy o en una fecha anterior.',
  });

export const analystDelegationSchema = z.object({
  clientIds: z
    .array(z.number().int().positive())
    .min(1, 'Selecciona al menos un cliente para delegar.'),
  targetAnalystId: z.number().int().positive('Selecciona un analista.'),
});

export const driverSubstitutionSchema = z.object({
  substituteDriverId: z.number().int().positive('Selecciona un conductor.'),
});

export type CreateResourceAbsenceFormData = z.infer<
  typeof createResourceAbsenceSchema
>;
export type AnalystDelegationFormData = z.infer<
  typeof analystDelegationSchema
>;
export type DriverSubstitutionFormData = z.infer<
  typeof driverSubstitutionSchema
>;

import { z } from 'zod';

export const driverExtraReportTypeSchema = z.enum([
  'STAND_BY',
  'DESVIO',
  'MANIOBRA_EXTRA',
  'EN_PISO',
]);

export const createDriverExtraReportSchema = z.object({
  type: driverExtraReportTypeSchema,
  durationHours: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value ||
        (Number.isFinite(Number(value)) &&
          Number(value) >= 0.1 &&
          Number(value) <= 168),
      'Ingresa una duración entre 0.1 y 168 horas.',
    ),
  description: z
    .string()
    .trim()
    .min(10, 'Describe el hecho con al menos 10 caracteres.')
    .max(2000, 'La descripción no puede superar 2000 caracteres.'),
  evidence: z
    .custom<FileList>(
      (value) => typeof FileList !== 'undefined' && value instanceof FileList,
      'Adjunta una fotografía como evidencia.',
    )
    .refine((files) => files.length > 0, 'Adjunta una fotografía como evidencia.')
    .refine(
      (files) => files.item(0)?.type.startsWith('image/') === true,
      'La evidencia debe ser una imagen.',
    )
    .refine(
      (files) => (files.item(0)?.size ?? 0) <= 10 * 1024 * 1024,
      'La imagen no puede superar 10 MB.',
    ),
});

export type CreateDriverExtraReportFormData = z.infer<
  typeof createDriverExtraReportSchema
>;

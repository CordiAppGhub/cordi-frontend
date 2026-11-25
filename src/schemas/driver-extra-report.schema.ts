import { z } from 'zod';

export const createDriverExtraReportSchema = z.object({
  conceptId: z.string().min(1, 'Selecciona un concepto del catálogo.'),
  description: z
    .string()
    .trim()
    .min(10, 'Describe el hecho con al menos 10 caracteres.')
    .max(2000, 'La descripción no puede superar 2000 caracteres.'),
  evidence: z
    .custom<FileList>(
      (value) =>
        value === undefined ||
        (typeof FileList !== 'undefined' && value instanceof FileList),
      'Selecciona una fotografía válida.',
    )
    .optional()
    .refine(
      (files) =>
        !files ||
        files.length === 0 ||
        files.item(0)?.type.startsWith('image/') === true,
      'La evidencia debe ser una imagen.',
    )
    .refine(
      (files) =>
        !files || files.length === 0 || (files.item(0)?.size ?? 0) <= 10 * 1024 * 1024,
      'La imagen no puede superar 10 MB.',
    ),
});

export type CreateDriverExtraReportFormData = z.infer<
  typeof createDriverExtraReportSchema
>;

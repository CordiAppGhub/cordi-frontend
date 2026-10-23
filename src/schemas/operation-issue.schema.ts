import { z } from 'zod';

export const operationIssueTypeSchema = z.enum([
  'MECANICA',
  'VIA',
  'CLIENTE',
  'SEGURIDAD',
]);

export const createOperationIssueSchema = z.object({
  issueType: operationIssueTypeSchema,
  description: z
    .string()
    .trim()
    .min(5, 'Describe la novedad con al menos 5 caracteres.')
    .max(2000, 'La descripción no puede superar 2000 caracteres.'),
});

export type CreateOperationIssueFormData = z.infer<
  typeof createOperationIssueSchema
>;

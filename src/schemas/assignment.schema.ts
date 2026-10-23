import { z } from 'zod';

export const assignmentSchema = z.object({
  analystId: z
    .coerce.number()
    .min(1, 'Debes seleccionar un analista'),

  clientId: z
    .coerce.number()
    .min(1, 'Debes seleccionar un cliente'),
});

export type AssignmentSchemaType = z.infer<typeof assignmentSchema>;
import { z } from 'zod';

export const locationSchema = z.object({
  name: z.string().min(1, 'El nombre del lugar es obligatorio'),
  address: z.string().optional(),
  isPort: z.boolean().default(false),
  isDepot: z.boolean().default(false),
  isClient: z.boolean().default(false),
  isOrigin: z.boolean().default(true),
  isDestination: z.boolean().default(true),
  exigeCita: z.boolean().default(false),
  clientIds: z.array(z.number()).optional(),
});
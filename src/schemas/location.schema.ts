import { z } from 'zod';

export const locationSchema = z.object({
  name: z.string().min(1, 'El nombre del lugar es obligatorio'),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  hasClientYard: z.boolean().default(false),
  isPort: z.boolean().default(false),
  isDepot: z.boolean().default(false),
  isOwnYard: z.boolean().default(false),
  isOrigin: z.boolean().default(true),
  isDestination: z.boolean().default(true),
  exigeCita: z.boolean().default(false),
  clientsData: z.array(
    z.object({
      clientId: z.number(),
      isClient: z.boolean(),
      isDepot: z.boolean(),
    })
  ).optional(),
});
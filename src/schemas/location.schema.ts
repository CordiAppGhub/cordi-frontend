import { z } from 'zod';

export const locationSchema = z.object({
  name: z.string().min(1, 'El nombre de la empresa/ubicación es obligatorio'),
  address: z.string().optional(),
  
  // Roles Logísticos
  isPort: z.boolean().default(false),
  isDepot: z.boolean().default(false),
  isClient: z.boolean().default(false),
  
  // Permisos de Ruta
  isOrigin: z.boolean().default(true),
  isDestination: z.boolean().default(true),
  
  analystId: z.number().int().positive('El ID del analista es obligatorio'),
});

export type LocationFormData = z.infer<typeof locationSchema>;
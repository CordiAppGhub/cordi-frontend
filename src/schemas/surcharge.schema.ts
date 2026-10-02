import { z } from 'zod';

export const createSurchargeCatalogSchema = z.object({
  code: z
    .string()
    .min(3, 'El código debe tener al menos 3 caracteres (Ej: STAND_BY_CARGUE)')
    .transform((val) => val.toUpperCase()), 
  
  name: z.string().min(3, 'El nombre es obligatorio'),
  
  description: z.string().optional(),
  
  applicableTo: z.enum(['IMPORTACION', 'EXPORTACION', 'AMBOS'], {
    message: 'Selecciona a qué modalidad aplica',
  }),
  
  basePrice: z.coerce.number().positive('El precio base debe ser mayor a 0'),
});

export const createSurchargeOverrideSchema = z.object({
  clientId: z.coerce.number().min(1, 'El cliente es obligatorio'),
  surchargeCode: z.string().min(1, 'Debe seleccionar una novedad del catálogo'),
  customPrice: z.coerce.number().min(0, 'El precio especial no puede ser negativo (puede ser 0)'),
});
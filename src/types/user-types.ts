// src/types/user.types.ts
import { z } from 'zod';

export type Role = 'ADMIN' | 'JEFE_DE_FLOTA' | 'ANALISTA';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  telefono?: string;
  cedula?: string;
  isActive: boolean;
  createdAt: string;
}

// Validación del formulario con Zod
export const userSchema = z.object({
  name: z.string().min(3, 'El nombre es obligatorio'),
  email: z.string().email('Correo inválido'),
  password: z.string().optional(), // Opcional porque en edición no siempre se cambia
  role: z.enum(['ADMIN', 'JEFE_DE_FLOTA', 'ANALISTA']),
  telefono: z.string().optional(),
  cedula: z.string().optional(),
});

export type UserFormData = z.infer<typeof userSchema>;
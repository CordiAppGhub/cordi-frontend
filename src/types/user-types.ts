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

export const userSchema = z.object({
  name: z.string().min(3, 'El nombre es obligatorio'),
  email: z.string().email('Correo inválido'),
  password: z.string().optional(),
  role: z.enum(['ADMIN', 'JEFE_DE_FLOTA', 'ANALISTA']),
  telefono: z.string().optional(),
  cedula: z.string().optional(),
}).refine((user) => !user.password || user.password.length >= 6, {
  message: 'La contraseña debe tener al menos 6 caracteres',
  path: ['password'],
});

export type UserFormData = z.infer<typeof userSchema>;
export type NewUserFormData = UserFormData & { password: string };
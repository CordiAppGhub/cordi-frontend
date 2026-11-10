import { z } from 'zod';
import { PASSWORD_POLICY_REGEX } from '@/schemas/password-policy';

export type Role = 'ADMIN' | 'JEFE_DE_FLOTA' | 'ANALISTA';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  telefono?: string;
  cedula?: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
}

export const userSchema = z.object({
  name: z.string().min(3, 'El nombre es obligatorio'),
  email: z.string().email('Correo inválido'),
  password: z.string().optional(),
  role: z.enum(['ADMIN', 'JEFE_DE_FLOTA', 'ANALISTA']),
  telefono: z.string().optional(),
  cedula: z.string().optional(),
}).refine((user) => !user.password || PASSWORD_POLICY_REGEX.test(user.password), {
  message:
    'Debe tener mínimo 12 caracteres, mayúscula, minúscula, número y símbolo, sin espacios.',
  path: ['password'],
});

export type UserFormData = z.infer<typeof userSchema>;
export type NewUserFormData = Omit<UserFormData, 'password'>;
// src/components/users/UserForm.tsx
'use client';

import { SuperForm } from '@/components/organisms/form/form';
import { FormField } from '@/components/organisms/form/types/form.types';
import { useUsers } from '@/app/(panel)/user/hooks/useUser';
import { useUserStore } from '@/store/userStore';
import { userSchema } from '@/types/user-types';
import React, { useState } from 'react';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';


export default function UserForm() {
  const { mode, selectedUser, closeModal } = useUserStore();
  const { create, update } = useUsers();

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = mode === 'EDIT' && selectedUser ? {
  name: selectedUser.name,
  email: selectedUser.email,
  role: selectedUser.role,
  cedula: selectedUser.cedula || '',
  telefono: selectedUser.telefono || '',
  password: '',
} : {
  name: '',
  email: '',
  role: 'ANALISTA', 
  cedula: '',
  telefono: '',
  password: '',
};

const fields: FormField[] = [
  { name: 'name', label: 'Nombre *', type: 'text' },
  { name: 'email', label: 'Correo Electrónico *', type: 'text' },
  {
    name: 'role',
    label: 'Rol *',
    type: 'select',
    options: [
      { label: 'Seleccionar...', value: '' },
      { label: 'Analista', value: 'ANALISTA' },
      { label: 'Jefe de Flota', value: 'JEFE_DE_FLOTA' },
      { label: 'Administrador', value: 'ADMIN' }
    ]
  },
  {
    name: 'password',
    label: mode === 'CREATE' ? 'Contraseña *' : 'Contraseña (Opcional)',
    type: 'password'
  },
  { name: 'cedula', label: 'Cédula', type: 'text' },
  { name: 'telefono', label: 'Teléfono', type: 'text' },
];

  const handleSubmit = async (formData: Record<string, unknown>) => {
    setFormErrors({});

    // 1. Validamos los datos con Zod
    const validation = userSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        const fieldName = String(issue.path[0]);
        fieldErrors[fieldName] = issue.message;
      });
      setFormErrors(fieldErrors);
      return;
    }
    if (mode === 'CREATE' && !validation.data.password) {
      setFormErrors({ password: 'La contraseña es obligatoria' });
      return;
    }

    setIsSubmitting(true);
    try {
      const data = validation.data;
      if (mode === 'CREATE') {
        if (!data.password) {
          setFormErrors({ password: 'La contraseña es obligatoria' });
          return;
        }
        await create({ ...data, password: data.password });
      } else if (mode === 'EDIT' && selectedUser) {
        const payload = data.password ? data : { ...data, password: undefined };
        await update({ id: selectedUser.id, data: payload });
      }
      closeModal();
    } catch (error) {
      showToast.error(getUserFriendlyErrorMessage(error, 'No se pudieron guardar los cambios del usuario.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SuperForm
      fields={fields}
      defaultValues={defaultValues}

      errors={formErrors}
      isLoading={isSubmitting}
      submitText={mode === 'CREATE' ? 'Crear Usuario' : 'Guardar Cambios'}
      cancelText="Cancelar"
      onSubmit={handleSubmit}
      onCancel={closeModal}
    />
  );
}
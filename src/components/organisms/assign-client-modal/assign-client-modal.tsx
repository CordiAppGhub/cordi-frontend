'use client';

import React, { useState } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserCheck, Clock, AlertCircle } from 'lucide-react';
import { SuperModal } from '@/components/organisms/modal/modal';
import { Button } from '@/components/atoms/button/button';
import { Input } from '@/components/atoms/input/input';
import { Select } from '@/components/atoms/select/select';
import { useAnalysts } from '@/hooks/useAnalysts';
import { assignClientSchema, AssignClientFormValues } from '@/schemas/assignment-history.schema';
import styles from './assign-client-modal.module.css';

interface AssignClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  clientName: string;
  currentAnalystId?: number | null;
  onAssign: (data: { analystId: number; clientId: number }) => Promise<boolean>;
}

export const AssignClientModal: React.FC<AssignClientModalProps> = ({
  isOpen,
  onClose,
  clientId,
  clientName,
  currentAnalystId,
  onAssign,
}) => {
  const { analysts, isLoadingAnalysts } = useAnalysts(isOpen);
  const [isTemporal, setIsTemporal] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
<<<<<<< HEAD
  } = useForm<z.input<typeof assignClientSchema>, unknown, AssignClientFormValues>({
=======
  } = useForm<AssignClientFormValues>({
>>>>>>> 1681de5e7b0dde48e398b29919d7540a03acb952
    resolver: zodResolver(assignClientSchema),
    defaultValues: {
      analystId: 0,
      clientId,
      isTemporal: false,
      startsAt: '',
      endsAt: '',
      reason: '',
    },
  });

  const handleClose = () => {
    reset();
    setIsTemporal(false);
    onClose();
  };

<<<<<<< HEAD
  const onSubmit: SubmitHandler<AssignClientFormValues> = async (values) => {
=======
  const onSubmit = async (values: AssignClientFormValues) => {
>>>>>>> 1681de5e7b0dde48e398b29919d7540a03acb952
    const success = await onAssign({ analystId: values.analystId, clientId });
    if (success) handleClose();
  };

  const analystOptions = [
    { value: '', label: '-- Selecciona un analista --' },
    ...analysts.map((a) => ({ value: String(a.id), label: a.name ?? `Analista #${a.id}` })),
  ];

  // suppress unused warning for currentAnalystId — available for future use
  void currentAnalystId;

  return (
    <SuperModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isTemporal ? 'Asignación Temporal (Delegación)' : 'Asignar Analista Titular'}
      width="520px"
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {/* Info del cliente */}
        <div className={styles.clientBadge}>
          <UserCheck size={16} />
          <span>{clientName}</span>
        </div>

        {/* Toggle Titular / Temporal */}
        <div className={styles.toggleSection}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${!isTemporal ? styles.active : ''}`}
            onClick={() => setIsTemporal(false)}
          >
            Titular (Permanente)
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${isTemporal ? styles.activeTemp : ''}`}
            onClick={() => setIsTemporal(true)}
          >
            <Clock size={14} />
            Temporal (Delegación)
          </button>
        </div>

        {/* Info contextual */}
        {isTemporal && (
          <div className={styles.infoBox}>
            <AlertCircle size={14} />
            <span>
              La delegación temporal requiere una Novedad de tipo Analista activa.
              Usa el formulario de delegaciones para ese flujo.
            </span>
          </div>
        )}

        {/* Selector de analista */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Analista {isTemporal ? 'delegado' : 'titular'}
          </label>
          <Controller
            name="analystId"
            control={control}
            render={({ field }) => (
              <Select
                options={analystOptions}
                value={field.value ? String(field.value) : ''}
                onValueChange={(val) => field.onChange(Number(val))}
                searchable
                searchPlaceholder="Buscar analista..."
                disabled={isLoadingAnalysts}
                error={errors.analystId?.message}
              />
            )}
          />
          {errors.analystId && (
            <span className={styles.errorMsg}>{errors.analystId.message}</span>
          )}
        </div>

        {/* Campos temporales */}
        {isTemporal && (
          <>
            <div className={styles.row}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Desde</label>
                <Input type="datetime-local" {...register('startsAt')} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Hasta (opcional)</label>
                <Input type="datetime-local" {...register('endsAt')} />
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Motivo *</label>
              <textarea
                className={`${styles.textarea} ${errors.reason ? styles.textareaError : ''}`}
                placeholder="Describe el motivo de la cobertura temporal..."
                rows={3}
                {...register('reason')}
              />
              {errors.reason && (
                <span className={styles.errorMsg}>{errors.reason.message}</span>
              )}
            </div>
          </>
        )}

        {/* Acciones */}
        <div className={styles.actions}>
<<<<<<< HEAD
          <Button type="button" variant="secondary" onClick={handleClose}>
=======
          <Button type="button" variant="ghost" onClick={handleClose}>
>>>>>>> 1681de5e7b0dde48e398b29919d7540a03acb952
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || isLoadingAnalysts}>
            {isSubmitting ? 'Guardando...' : isTemporal ? 'Crear Cobertura' : 'Confirmar Asignación'}
          </Button>
        </div>
      </form>
    </SuperModal>
  );
};

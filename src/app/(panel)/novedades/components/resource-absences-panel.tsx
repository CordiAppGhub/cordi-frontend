'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/atoms/button/button';
import { useAuthStore } from '@/store/use-auth.store';
import {
  resourceAbsenceService,
  type ResourceAbsence,
} from '@/services/resource-absence.service';
import { showConfirm, showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
import { AnalystDelegationModal } from './analyst-delegation-modal';
import { DriverSubstitutionModal } from './driver-substitution-modal';
import styles from './resource-absences-panel.module.css';

const reasonLabels = {
  ENFERMEDAD: 'Enfermedad o incapacidad',
  PERMISO: 'Permiso',
  INJUSTIFICADO: 'Ausencia injustificada',
  VACACIONES: 'Vacaciones',
} as const;

export function ResourceAbsencesPanel() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canManage = user?.role === 'ADMIN' || user?.role === 'JEFE_DE_FLOTA';
  const absencesQuery = useQuery({
    queryKey: ['resource-absences'],
    queryFn: resourceAbsenceService.getAbsences,
    enabled: canManage,
  });
  const [selectedAbsence, setSelectedAbsence] =
    useState<ResourceAbsence | null>(null);
  const [delegationType, setDelegationType] = useState<
    'ANALYST' | 'DRIVER' | null
  >(null);

  if (!canManage) return null;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['resource-absences'] });
    await queryClient.invalidateQueries({ queryKey: ['drivers'] });
    await queryClient.invalidateQueries({ queryKey: ['assignments'] });
  };

  const handleCloseAbsence = async (absence: ResourceAbsence) => {
    const confirmed = await showConfirm({
      title: '¿Cerrar ausencia?',
      text: `Se cerrará la ausencia de ${absence.user.name || 'este recurso'} y se restaurarán las asignaciones temporales.`,
      confirmButtonText: 'Sí, cerrar ausencia',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await resourceAbsenceService.closeAbsence(absence.id);
      showToast.success('Ausencia cerrada y asignaciones temporales restauradas.');
      await refresh();
    } catch (error: unknown) {
      showToast.error(
        getUserFriendlyErrorMessage(error, 'No se pudo cerrar la ausencia.'),
      );
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h2>Ausencias formales de recursos</h2>
          <p>
            Consulta periodos formales y gestiona sustituciones o restauración
            de asignaciones titulares.
          </p>
        </div>
      </div>

      {absencesQuery.isLoading ? (
        <p className={styles.state}>Cargando ausencias…</p>
      ) : absencesQuery.isError ? (
        <p className={styles.error} role="alert">
          No se pudieron cargar las ausencias. Actualiza la página para
          reintentar.
        </p>
      ) : absencesQuery.data?.length ? (
        <div className={styles.grid}>
          {absencesQuery.data.map((absence) => {
            const isAnalyst = absence.user.role === 'ANALISTA';
            const hasDriverSubstitution = Boolean(absence.driverDelegation);
            return (
              <article className={styles.card} key={absence.id}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3>{absence.user.name || 'Recurso sin nombre'}</h3>
                    <span>
                      {isAnalyst ? 'Analista' : 'Conductor'} ·{' '}
                      {reasonLabels[absence.reason]}
                    </span>
                  </div>
                  <span
                    className={
                      absence.status === 'ACTIVE'
                        ? styles.activeBadge
                        : styles.closedBadge
                    }
                  >
                    {absence.status === 'ACTIVE' ? 'Activa' : 'Cerrada'}
                  </span>
                </div>
                <div className={styles.dates}>
                  <span>Desde: {new Date(absence.startDate).toLocaleString('es-CO')}</span>
                  <span>Hasta: {new Date(absence.endDate).toLocaleString('es-CO')}</span>
                </div>
                {!isAnalyst && (
                  <p className={styles.vehicle}>
                    Vehículo liberado:{' '}
                    <strong>{absence.vehicle?.plate ?? 'No tenía vehículo asignado'}</strong>
                  </p>
                )}
                {isAnalyst && absence.analystDelegations.length > 0 && (
                  <p className={styles.coverage}>
                    {absence.analystDelegations.length} asignación(es) temporal(es)
                    registradas.
                  </p>
                )}
                {!isAnalyst && hasDriverSubstitution && (
                  <p className={styles.coverage}>
                    Sustituto: {absence.driverDelegation?.substituteDriver.name || 'Asignado'}
                  </p>
                )}
                {absence.status === 'ACTIVE' && (
                  <div className={styles.actions}>
                    {isAnalyst ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setSelectedAbsence(absence);
                          setDelegationType('ANALYST');
                        }}
                      >
                        Delegar clientes
                      </Button>
                    ) : absence.vehicle && !hasDriverSubstitution ? (
                      <Button
                        type="button"
                        onClick={() => {
                          setSelectedAbsence(absence);
                          setDelegationType('DRIVER');
                        }}
                      >
                        Asignar conductor sustituto
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="secondary"
                      className={styles.closeButton}
                      onClick={() => void handleCloseAbsence(absence)}
                    >
                      Cerrar ausencia
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <p className={styles.state}>No hay ausencias registradas.</p>
      )}

      {selectedAbsence && delegationType === 'ANALYST' && (
        <AnalystDelegationModal
          key={`analyst-${selectedAbsence.id}`}
          isOpen
          absence={selectedAbsence}
          onClose={() => {
            setDelegationType(null);
            setSelectedAbsence(null);
          }}
          onSuccess={() => {
            setDelegationType(null);
            setSelectedAbsence(null);
          }}
        />
      )}
      {selectedAbsence && delegationType === 'DRIVER' && (
        <DriverSubstitutionModal
          key={`driver-${selectedAbsence.id}`}
          isOpen
          absence={selectedAbsence}
          onClose={() => {
            setDelegationType(null);
            setSelectedAbsence(null);
          }}
          onSuccess={() => {
            setDelegationType(null);
            setSelectedAbsence(null);
          }}
        />
      )}
    </section>
  );
}

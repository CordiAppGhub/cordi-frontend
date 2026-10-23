// src/views/AssignmentsView.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/atoms/button/button';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { useClients } from '@/hooks/useClient';
import { useAnalysts } from '@/hooks/useAnalysts';
import { SuperModal } from '@/components/organisms/modal/modal';
import { SuperForm } from '@/components/organisms/form/form';
import {
  FormField,
  FormFieldValue,
} from '@/components/organisms/form/types/form.types';
import { assignmentSchema } from '@/schemas/assignment.schema'; // 🚀 Importamos el esquema Zod
import { useAssignments } from '../hooks/useAssignments';
import { AnalystDelegationModal } from '../components/analyst-delegation-modal';
import {
  getAnalystGroupColumns,
  getAssignedClientColumns,
  groupAssignmentsByAnalyst,
} from '../components/AssignmentColumn';
import { TruckLoader } from '@/components/TruckLoader';
import styles from '../locations.module.css';
export const AssignmentsView: React.FC = () => {
  const {
    assignments,
    delegations,
    delegationsError,
    isLoadingAssignments,
    isLoadingDelegations,
    createAssignment,
    createDelegation,
    revokeDelegation,
    removeAssignment,
    isAssigning,
    isDelegating,
  } = useAssignments();
  const { clients, isLoadingClients } = useClients();
  const { analysts, isLoadingAnalysts } = useAnalysts();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleOpenCreate = () => {
    setIsModalOpen(true);
    setValidationErrors({});
  };

  const columns = useMemo(() => getAnalystGroupColumns(), []);
  const subColumns = useMemo(() => getAssignedClientColumns(removeAssignment), [removeAssignment]);
  const groups = useMemo(() => groupAssignmentsByAnalyst(assignments), [assignments]);

  const formFields: FormField[] = [
    {
      name: 'analystId',
      label: '1. Seleccionar Analista Encargado',
      type: 'select',
      options: [
        { value: '', label: '-- Selecciona un analista --' },
        ...analysts.map((a) => ({ value: String(a.id), label: a.name })),
      ],
      disabled: isLoadingAnalysts,
    },
    {
      name: 'clientId',
      label: '2. Seleccionar Cliente Corporativo',
      type: 'select',
      options: [
        { value: '', label: '-- Selecciona un cliente --' },
        ...clients.map((c) => ({ value: String(c.id), label: `${c.razonSocial} (${c.nit})` })),
      ],
      disabled: isLoadingClients,
    },
  ];

  const handleSubmit = async (
    formData: Record<string, FormFieldValue>,
  ) => {
    const payload = {
      analystId: Number(formData.analystId),
      clientId: Number(formData.clientId),
    };

    const validation = assignmentSchema.safeParse(payload);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        fieldErrors[String(issue.path[0])] = issue.message;
      });
      setValidationErrors(fieldErrors);
      return;
    }

    const success = await createAssignment(validation.data);
    if (success) {
      setIsModalOpen(false);
      setValidationErrors({});
    }
  };

  const totalPages = Math.ceil(groups.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return groups.slice(startIndex, startIndex + itemsPerPage);
  }, [groups, currentPage]);

  return (
    <div className={styles.page}>
      
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            Asignación de Clientes a Analistas
          </h2>
          <p className={styles.subtitle}>
            Cada cliente tiene un único analista responsable en todas sus ubicaciones.
          </p>
        </div>
        <Button onClick={handleOpenCreate} variant="primary">
          + Nueva Asignación
        </Button>
        <Button
          onClick={() => setIsDelegationModalOpen(true)}
          variant="secondary"
        >
          Delegar cobertura parcial
        </Button>
      </div>

      {isLoadingAssignments ? (
        <TruckLoader variant="compact" message="Cargando matriz de permisos..." />
      ) : (
        <div className={styles.table}>
          <PaginationTable
            data={paginatedData}
            columns={columns}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isCollapsible={true}
            subColumns={subColumns}
            getSubRows={(row) => row.clients}
          />
        </div>
      )}

      <section style={{ marginTop: 28 }}>
        <h3>Delegaciones activas</h3>
        {isLoadingDelegations ? (
          <TruckLoader variant="compact" message="Cargando coberturas..." />
        ) : delegationsError ? (
          <p role="alert">{delegationsError}</p>
        ) : delegations.length === 0 ? (
          <p>No hay coberturas parciales activas.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={delegationCellStyle}>Cliente / alcance</th>
                  <th style={delegationCellStyle}>Titular → cobertura</th>
                  <th style={delegationCellStyle}>Motivo</th>
                  <th style={delegationCellStyle}>Fin previsto</th>
                  <th style={delegationCellStyle}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {delegations.map((delegation) => {
                  const scope = delegation.clientLocation
                    ? `Ubicación: ${delegation.clientLocation.location.name}`
                    : `Operación #${delegation.operation?.id ?? delegation.operationId}`;
                  return (
                    <tr key={delegation.id}>
                      <td style={delegationCellStyle}>
                        <strong>{delegation.client.razonSocial}</strong>
                        <div>{scope}</div>
                      </td>
                      <td style={delegationCellStyle}>
                        {delegation.principalAnalyst.name ?? 'Sin nombre'} →{' '}
                        {delegation.delegateAnalyst.name ?? 'Sin nombre'}
                      </td>
                      <td style={delegationCellStyle}>{delegation.reason}</td>
                      <td style={delegationCellStyle}>
                        {delegation.endsAt
                          ? new Date(delegation.endsAt).toLocaleString('es-CO')
                          : 'Sin fecha'}
                      </td>
                      <td style={delegationCellStyle}>
                        <button
                          type="button"
                          onClick={() => void revokeDelegation(delegation.id)}
                        >
                          Finalizar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isModalOpen && (
        <SuperModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Crear Nueva Asignación de Permiso"
          width="500px"
        >
          <div className={styles.modalDescription}>
            Selecciona el analista y el cliente. El analista quedará a cargo de todas las ubicaciones del cliente, reemplazando al anterior si lo había.
          </div>
          <SuperForm
            fields={formFields}
            errors={validationErrors}
            isLoading={isAssigning}
            submitText="Asignar"
            cancelText="Cancelar"
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
            onChange={() => setValidationErrors({})}
          />
        </SuperModal>
      )}
      {isDelegationModalOpen && (
        <AnalystDelegationModal
          onClose={() => setIsDelegationModalOpen(false)}
          onCreate={createDelegation}
          isSaving={isDelegating}
        />
      )}
    </div>
  );
};

const delegationCellStyle = {
  padding: '10px 12px',
  borderBottom: '1px solid #e2e8f0',
  textAlign: 'left' as const,
  verticalAlign: 'top' as const,
};
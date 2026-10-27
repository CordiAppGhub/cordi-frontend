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
    isLoadingAssignments,
    createAssignment,
    removeAssignment,
    isAssigning,
  } = useAssignments();
  const { clients, isLoadingClients } = useClients();
  const { analysts, isLoadingAnalysts } = useAnalysts();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    </div>
  );
};
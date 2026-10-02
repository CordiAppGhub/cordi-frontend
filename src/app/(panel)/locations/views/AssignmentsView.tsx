// src/views/AssignmentsView.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/atoms/button/button';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { useClients } from '@/hooks/useClient';
import { useAnalysts } from '@/hooks/useAnalysts';
import { SuperModal } from '@/components/organisms/modal/modal';
import { SuperForm } from '@/components/organisms/form/form';
import { FormField } from '@/components/organisms/form/types/form.types';
import { assignmentSchema } from '@/schemas/assignment.schema'; // 🚀 Importamos el esquema Zod
import { useAssignments } from '../hooks/useAssignments';
import { useLocations } from '../hooks/useLocation';
import { getAssignmentColumns } from '../components/AssignmentColumn';
export const AssignmentsView: React.FC = () => {
  const { assignments, isLoadingAssignments, createAssignment, removeAssignment, isAssigning } = useAssignments();
  const { clients, isLoadingClients } = useClients();
  const { locations, isLoadingLocations } = useLocations();
  const { analysts, isLoadingAnalysts } = useAnalysts();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleOpenCreate = () => {
    setIsModalOpen(true);
    setValidationErrors({});
    setSelectedClientId(''); 
  };

  const columns = useMemo(() => getAssignmentColumns(removeAssignment), [removeAssignment]);

  const availableLocations = useMemo(() => {
    if (!selectedClientId) return [];

    return locations.filter((loc) => 
     
      loc.clients?.some((c) => String(c.clientId) === selectedClientId)
    );
  }, [locations, selectedClientId]);

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
    {
      name: 'locationId',
  
      label: selectedClientId 
        ? '3. Seleccionar Ubicación / Instalación' 
        : '3. Selecciona un cliente primero',
      type: 'select',
      options: [
        { value: '', label: '-- Selecciona una ubicación --' },
        ...availableLocations.map((l) => ({ value: String(l.id), label: l.name })),
      ],
      disabled: isLoadingLocations || availableLocations.length === 0,
    },
  ];

  const handleSubmit = async (formData: Record<string, any>) => {
    const payload = {
      analystId: Number(formData.analystId),
      clientId: Number(formData.clientId),
      locationId: Number(formData.locationId),
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
      setSelectedClientId('');
    }
  };

  const totalPages = Math.ceil((assignments?.length || 0) / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return assignments.slice(startIndex, startIndex + itemsPerPage);
  }, [assignments, currentPage]);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Matriz de Permisos Directos
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>
            Asigna qué analistas pueden auditar y gestionar clientes específicos en cada puerto o bodega.
          </p>
        </div>
        <Button onClick={handleOpenCreate} variant="primary">
          + Nueva Asignación
        </Button>
      </div>

      {isLoadingAssignments ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          Cargando matriz de permisos...
        </div>
      ) : (
        <div style={{ width: '100%' }}>
          <PaginationTable
            data={paginatedData}
            columns={columns}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
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
          <div style={{ marginBottom: '16px', fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4' }}>
            Selecciona el analista y el cliente. Solo podrás asignar al analista a las ubicaciones donde el cliente ya tiene operación activa.
          </div>
          <SuperForm
            fields={formFields}
            errors={validationErrors}
            isLoading={isAssigning}
            submitText="Otorgar Permiso"
            cancelText="Cancelar"
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
           onChange={(arg1: any, arg2: any) => {
              setValidationErrors({});
              
              if (typeof arg1 === 'object' && arg1 !== null) {
                if (arg1.clientId) {
                  setSelectedClientId(String(arg1.clientId));
                } else {
                  setSelectedClientId('');
                }
              } 
              else if (typeof arg1 === 'string') {
                if (arg1 === 'clientId') {
                  setSelectedClientId(arg2 ? String(arg2) : '');
                }
              }
            }}
          />
        </SuperModal>
      )}
    </div>
  );
};
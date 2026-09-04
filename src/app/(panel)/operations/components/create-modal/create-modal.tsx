'use client';

import { SuperModal } from '@/components/organisms/modal/modal';
import { useUIStore } from '@/store/use-ui.store';
import React from 'react';
import { OperationForm } from '../formOperation';


export const CreateModal: React.FC = () => {
  const { isCreateModalOpen, closeCreateModal } = useUIStore();

  return (
    <SuperModal 
      isOpen={isCreateModalOpen} 
      onClose={closeCreateModal} 
      title="Crear Nueva Operación"
      width="550px"
    >
      <OperationForm onClose={closeCreateModal} />
    </SuperModal>
  );
};
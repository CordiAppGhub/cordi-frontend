// src/app/dashboard/users/page.tsx
'use client';

import { SuperModal } from '@/components/organisms/modal/modal';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { useUsers } from '@/hooks/useUser';
import { useUserStore } from '@/store/userStore';
import React from 'react';
import UserForm from './hooks/useFormUser';
import { Button } from '@/components/atoms/button/button';


export default function UsersPage() {
  const { users, isLoading, disable } = useUsers();
  const { isModalOpen, mode, currentPage, openModal, closeModal, setPage } = useUserStore();

  const handleDisable = async (id: number) => {
    if (confirm('¿Estás seguro de desactivar este usuario?')) {
      await disable(id);
    }
  };

  const columns = [
    { header: 'Nombre', id: 'name' },
    { header: 'Correo', id: 'email' },
    { 
      header: 'Rol', 
      id: 'role',
      renderCell: (row: any) => (
        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium text-gray-700">
          {row.role.replace(/_/g, ' ')}
        </span>
      )
    },
    { 
      header: 'Estado', 
      id: 'isActive',
      renderCell: (row: any) => row.isActive 
        ? <span className="text-green-600 font-bold text-sm">● Activo</span> 
        : <span className="text-red-600 font-bold text-sm">● Inactivo</span>
    },
    {
      header: 'Acciones',
      id: 'actions',
      renderCell: (row: any) => (
        <div className="flex gap-4">
          <Button 
            onClick={() => openModal('EDIT', row)} 
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Editar
          </Button>
          <Button 
            onClick={() => handleDisable(row.id)} 
            className="text-red-600 hover:text-red-800 font-medium text-sm"
            disabled={!row.isActive}
          >
            Desactivar
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) return <div className="p-8">Cargando usuarios...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
      </div>

      <PaginationTable
        data={users}
        columns={columns}
        totalPages={1}
        currentPage={currentPage}
        onPageChange={setPage}
        nameButton="Nuevo Usuario"
        onOpenModal={() => openModal('CREATE')}
      />

      <SuperModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={mode === 'CREATE' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
        width="600px" 
      >
        <UserForm />
      </SuperModal>
    </div>
  );
}
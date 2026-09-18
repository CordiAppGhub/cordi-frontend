'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/atoms/button/button';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { useClients } from '@/hooks/useClient';
import { Client } from '@/types/client.-types';
import { getClientColumns } from '../components/ClientColumns';
import { ClientModal } from '../components/clientModal/ClientModal';



export const ClientsView: React.FC = () => {
  const { clients, isLoadingClients, deleteClient, refreshClients } = useClients();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isInitialized = useRef(false);
  useEffect(() => {
    if (!isInitialized.current) {
      refreshClients();
      isInitialized.current = true;
    }
  }, [refreshClients]);

  const handleOpenCreate = () => {
    setClientToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setClientToEdit(client);
    setIsModalOpen(true);
  };

  const columns = useMemo(() => getClientColumns(handleOpenEdit, deleteClient), [deleteClient]);

  const totalPages = Math.ceil((clients?.length || 0) / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return clients.slice(startIndex, startIndex + itemsPerPage);
  }, [clients, currentPage]);

  return (
    <div style={{ padding: '32px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Portafolio de Clientes</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Gestión de datos fiscales y facturación de la operación.</p>
        </div>
        <Button onClick={handleOpenCreate} variant="primary">+ Nuevo Cliente</Button>
      </div>

      {isLoadingClients ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Sincronizando base de datos comercial...</div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', padding: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <PaginationTable
            data={paginatedData}
            columns={columns}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <ClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} clientToEdit={clientToEdit} />
    </div>
  );
};
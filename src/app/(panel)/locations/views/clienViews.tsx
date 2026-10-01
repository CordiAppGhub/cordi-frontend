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
    // 🚀 Sin fondos ni alturas fijas, solo padding interno
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      {/* 🚀 Cabecera limpia alineada */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Portafolio de Clientes</h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>Gestión de datos fiscales y facturación de la operación.</p>
        </div>
        <Button onClick={handleOpenCreate} variant="primary">+ Nuevo Cliente</Button>
      </div>

      {isLoadingClients ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Sincronizando base de datos comercial...</div>
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

      <ClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} clientToEdit={clientToEdit} />
    </div>
  );
};
'use client';

import React, { useCallback, useState, useMemo } from 'react';
import { Button } from '@/components/atoms/button/button';
import { TruckLoader } from '@/components/TruckLoader';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { useClients } from '@/hooks/useClient';
import { Client } from '@/types/client.-types';
import { getClientColumns } from '../components/ClientColumns';
import { ClientModal } from '../components/clientModal/ClientModal';
import styles from '../locations.module.css';

export const ClientsView: React.FC = () => {
  const { clients, isLoadingClients, deleteClient } = useClients();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleOpenCreate = () => {
    setClientToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = useCallback((client: Client) => {
    setClientToEdit(client);
    setIsModalOpen(true);
  }, []);

  const columns = useMemo(
    () => getClientColumns(handleOpenEdit, deleteClient),
    [deleteClient, handleOpenEdit],
  );

  const totalPages = Math.ceil((clients?.length || 0) / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return clients.slice(startIndex, startIndex + itemsPerPage);
  }, [clients, currentPage]);

  return (
    <div className={styles.page}>
      
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Portafolio de Clientes</h2>
          <p className={styles.subtitle}>Gestión de datos fiscales y facturación de la operación.</p>
        </div>
        <Button onClick={handleOpenCreate} variant="primary">+ Nuevo Cliente</Button>
      </div>

      {isLoadingClients ? (
        <TruckLoader variant="compact" message="Sincronizando base de datos comercial..." />
      ) : (
        <div className={styles.table}>
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
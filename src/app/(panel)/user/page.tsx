'use client';

import { SuperModal } from '@/components/organisms/modal/modal';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { useUsers } from '@/app/(panel)/user/hooks/useUser';
import { useUserStore } from '@/store/userStore';
import React, { useEffect, useMemo, useState } from 'react';
import UserForm from './components/useFormUser';
import { Button } from '@/components/atoms/button/button';
import { Select } from '@/components/atoms/select/select';
import { TruckLoader } from '@/components/TruckLoader';
import { User, Role } from '@/types/user-types';
import { UserCheck, UserRoundPlus, UserRoundX, UsersRound } from 'lucide-react';
import { showConfirm } from '@/utils/alerts';
import styles from './user.module.css';

const roleLabels: Record<Role, string> = {
  ADMIN: 'Administrador',
  JEFE_DE_FLOTA: 'Jefe de flota',
  ANALISTA: 'Analista',
};

export default function UsersPage() {
  const { users, isLoading, error, refetch, disable, enable } = useUsers();
  const { isModalOpen, mode, currentPage, openModal, closeModal, setPage } = useUserStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const handleDisable = async (id: number) => {
    const confirmed = await showConfirm({
      title: '¿Desactivar usuario?',
      text: 'El usuario ya no podrá acceder al sistema.',
      confirmButtonText: 'Sí, desactivar',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await disable(id);
    } catch {
      // La mutación presenta el error mediante una notificación.
    }
  };

  const handleEnable = async (id: number) => {
    try {
      await enable(id);
    } catch {
      // La mutación presenta el error mediante una notificación.
    }
  };

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        [user.name, user.email, user.telefono, user.cedula]
          .some((value) => value?.toLocaleLowerCase().includes(normalizedSearch));
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' ? user.isActive : !user.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pageUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeCount = users.filter((user) => user.isActive).length;
  const inactiveCount = users.length - activeCount;
  const adminCount = users.filter((user) => user.role === 'ADMIN').length;
  const hasActiveFilters = Boolean(search.trim()) || roleFilter !== 'ALL' || statusFilter !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setPage(1);
  };

  useEffect(() => {
    if (currentPage > totalPages) setPage(totalPages);
  }, [currentPage, totalPages, setPage]);

  const columns = [
    {
      header: 'Nombre',
      id: 'name',
      renderCell: (row: User) => (
        <div className={styles.userCell}>
          <span className={styles.userAvatar} aria-hidden="true">
            {row.name.trim().slice(0, 1).toUpperCase() || '?'}
          </span>
          <span className={styles.userDetails}>
            <strong>{row.name}</strong>
            <span>{row.cedula || 'Sin cédula registrada'}</span>
          </span>
        </div>
      ),
    },
    { header: 'Correo', id: 'email' },
    { 
      header: 'Rol', 
      id: 'role',
      renderCell: (row: User) => (
        <span className={styles.roleBadge}>
          {roleLabels[row.role]}
        </span>
      )
    },
    { 
      header: 'Estado', 
      id: 'isActive',
      renderCell: (row: User) => row.isActive
        ? <span className={styles.activeStatus}>● Activo</span>
        : <span className={styles.inactiveStatus}>● Inactivo</span>
    },
    {
      header: 'Acciones',
      id: 'actions',
      renderCell: (row: User) => (
        <div className={styles.actions}>
          <Button 
            onClick={() => openModal('EDIT', row)} 
          >
            Editar
          </Button>
          <Button
            onClick={() => row.isActive ? handleDisable(row.id) : handleEnable(row.id)}
            className={row.isActive ? styles.dangerAction : ''}
          >
            {row.isActive ? 'Desactivar' : 'Reactivar'}
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) return <TruckLoader message="Cargando usuarios..." />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Administración</span>
          <h1 className={styles.title}>Gestión de usuarios</h1>
          <p className={styles.subtitle}>Administra accesos, roles y estado de las cuentas.</p>
        </div>
        <span className={styles.accessNote}>Panel exclusivo para administradores</span>
      </div>

      <section className={styles.summaryGrid} aria-label="Resumen de usuarios">
        <article className={styles.summaryCard}>
          <span className={`${styles.summaryIcon} ${styles.totalIcon}`}><UsersRound size={18} /></span>
          <div><span className={styles.summaryLabel}>Total de usuarios</span><strong>{users.length}</strong></div>
        </article>
        <article className={styles.summaryCard}>
          <span className={`${styles.summaryIcon} ${styles.activeIcon}`}><UserCheck size={18} /></span>
          <div><span className={styles.summaryLabel}>Cuentas activas</span><strong>{activeCount}</strong></div>
        </article>
        <article className={styles.summaryCard}>
          <span className={`${styles.summaryIcon} ${styles.inactiveIcon}`}><UserRoundX size={18} /></span>
          <div><span className={styles.summaryLabel}>Cuentas inactivas</span><strong>{inactiveCount}</strong></div>
        </article>
        <article className={styles.summaryCard}>
          <span className={`${styles.summaryIcon} ${styles.adminIcon}`}><UserRoundPlus size={18} /></span>
          <div><span className={styles.summaryLabel}>Administradores</span><strong>{adminCount}</strong></div>
        </article>
      </section>

      <div className={styles.filters}>
        <input
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          placeholder="Buscar nombre, correo, teléfono o cédula"
          aria-label="Buscar usuarios"
          className={styles.search}
        />
        <Select
          value={roleFilter}
          onChange={(event) => { setRoleFilter(event.target.value as Role | 'ALL'); setPage(1); }}
          aria-label="Filtrar por rol"
          className={styles.filter}
          wrapperClassName={styles.filterWrapper}
        >
          <option value="ALL">Todos los roles</option>
          <option value="ADMIN">{roleLabels.ADMIN}</option>
          <option value="JEFE_DE_FLOTA">{roleLabels.JEFE_DE_FLOTA}</option>
          <option value="ANALISTA">{roleLabels.ANALISTA}</option>
        </Select>
        <Select
          value={statusFilter}
          onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setPage(1); }}
          aria-label="Filtrar por estado"
          className={styles.filter}
          wrapperClassName={styles.filterWrapper}
        >
          <option value="ALL">Todos los estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="INACTIVE">Inactivos</option>
        </Select>
        {hasActiveFilters && (
          <Button type="button" variant="secondary" className={styles.clearFilters} onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
        <span className={styles.count}>
          {filteredUsers.length} de {users.length} usuarios
        </span>
      </div>
      {error && (
        <div role="alert" className={styles.error}>
          <span>No se pudieron cargar los usuarios.</span>
          <Button variant="secondary" onClick={() => void refetch()}>Reintentar</Button>
        </div>
      )}

      <PaginationTable
        data={pageUsers}
        columns={columns}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setPage}
        hideSearch
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
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';
import { Button } from '@/components/atoms/button/button';
import { ColumnDef } from '@/types/table';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { Pencil, Trash2 } from 'lucide-react';

import styles from './driver-details.module.css';
import { useDriverDetail } from '../../hooks/use-driver-details';
import { useDrivers } from '../../hooks/use-drivers';
import CreateDriverModal from '../../components/CreateDriverModal';
import { TruckLoader } from '@/components/TruckLoader';

export function DriverDetailView() {
  const router = useRouter();
  const params = useParams();
  const driverId = parseInt(params.id as string, 10);

  const { details, isLoading, error, loadDriverDetails } = useDriverDetail();
  const { editDriver, deleteDriver } = useDrivers();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    loadDriverDetails(driverId);
  }, [driverId, loadDriverDetails]);

  const operationColumns: ColumnDef<any>[] = useMemo(() => [
    {
      id: 'operacion',
      header: 'Operación',
      type: 'text',
      renderCell: (op) => (
        <div>
          <span style={{ fontWeight: 'bold', color: '#1e293b' }}>#{op.id}</span>
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{op.type}</span>
        </div>
      )
    },
    {
      id: 'ruta',
      header: 'Ruta',
      type: 'text',
      renderCell: (op) => (
        <div className={styles.tableRoute}>
          <span>🟢 {op.origen?.name || 'Origen N/A'}</span>
          <span>🏁 {op.destino?.name || 'Destino N/A'}</span>
        </div>
      )
    },
    {
      id: 'vehiculo',
      header: 'Vehículo',
      type: 'text',
      renderCell: (op) => <span style={{ color: '#334155', fontWeight: 500 }}>{op.vehicle?.plate || '--'}</span>
    },
    {
      id: 'estado',
      header: 'Estado',
      type: 'text',
      renderCell: (op) => <StatusBadge status={op.status} />
    }
  ], []);

  const totalPages = Math.ceil((details?.assignedOperations?.length || 0) / itemsPerPage) || 1;
  const paginatedOperations = useMemo(() => {
    if (!details?.assignedOperations) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return details.assignedOperations.slice(startIndex, startIndex + itemsPerPage);
  }, [details, currentPage]);

  if (isLoading) {
    return <TruckLoader variant="section" message="Cargando perfil del conductor..." />;
  }

  if (error || !details) {
    return (
      <div className={styles.errorState}>
        <p className={styles.errorText}>{error || 'No se encontró información'}</p>
        <Button onClick={() => router.back()} variant="secondary">Volver al directorio</Button>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button
            variant="secondary"
            onClick={() => router.back()}
            className={styles.backButton}
          >
            ← Volver
          </Button>
          <div>
            <h1 className={styles.title}>Perfil del Conductor</h1>
            <p className={styles.subtitle}>Información detallada y registro de actividad</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            onClick={() => setIsEditModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
          >
            <Pencil size={15} color="#2563eb" /> Editar Conductor
          </Button>

          <Button
            variant="secondary"
            onClick={async () => {
              const deleted = await deleteDriver(driverId, details.name);
              if (deleted) {
                router.push('/fleet');
              }
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#dc2626', color: '#fff', border: 'none' }}
          >
            <Trash2 size={15} /> Eliminar Conductor
          </Button>
        </div>
      </div>

      <div className={styles.gridContainer}>
        <div className={styles.card}>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              {details.name?.charAt(0) || 'C'}
            </div>
            <h2 className={styles.driverName}>{details.name}</h2>
            <span className={`${styles.badge} ${details.isActive ? styles.badgeActive : styles.badgeInactive}`}>
              {details.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Cédula de Ciudadanía</span>
              <span className={styles.infoValue}>{details.cedula}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Teléfono Móvil</span>
              <span className={styles.infoValue}>{details.telefono || 'No registrado'}</span>
            </div>
          </div>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Vehículo Asignado</h3>
            {details.drivenVehicles?.length > 0 ? (
              <div className={styles.vehiclesWrapper}>
                {details.drivenVehicles.map((v: any) => (
                  <div key={v.id} className={styles.vehicleBox}>
                    <span className={styles.vehiclePlate}>{v.plate}</span>
                    <span className={styles.vehicleBrand}>{v.brand || 'Marca N/A'}</span>
                    <span className={styles.vehicleCompany}>{v.empresa || 'Sin empresa'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                No tiene vehículos asignados en este momento.
              </div>
            )}
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Registro de Operaciones</h3>
            {details.assignedOperations?.length > 0 ? (
              <PaginationTable
                data={paginatedOperations}
                columns={operationColumns}
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            ) : (
              <div className={styles.emptyState}>
                No existe historial de operaciones para este conductor.
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <CreateDriverModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onEditDriver={async (id, data) => {
            const ok = await editDriver(id, data);
            if (ok) {
              loadDriverDetails(driverId);
            }
            return ok;
          }}
          driverToEdit={{
            id: details.id,
            cedula: details.cedula,
            name: details.name,
            telefono: details.telefono,
          } as any}
        />
      )}
    </div>
  );
}
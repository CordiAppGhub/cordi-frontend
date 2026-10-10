'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import AssignDriverModal from '@/app/(panel)/fleet/asignaciones/components/AssignDriverModal';
import { useAssignments } from '@/hooks/useFleet';
import { VehicleAssignment } from '@/types/fleet-types';
import { ColumnDef } from '@/types/table';
import { Button } from '@/components/atoms/button/button';
import { TruckLoader } from '@/components/TruckLoader';
import styles from './assignments.module.css';

export default function AssignmentsPage() {
    const router = useRouter();
    const { activeAssignments, isLoading, unassignVehicle, assignDriver } = useAssignments();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVehicleForModal, setSelectedVehicleForModal] = useState<number | undefined>(undefined);

    const handleReassign = useCallback((vehicleId: number) => {
        setSelectedVehicleForModal(vehicleId);
        setIsModalOpen(true);
    }, []);

    const handleNewOperation = useCallback((vehicleId: number, driverId: number) => {
        router.push(`/operations/new?vehicleId=${vehicleId}&driverId=${driverId}`);
    }, [router]);

    const assignmentColumns = useMemo<ColumnDef<VehicleAssignment>[]>(() => [
        {
            id: 'plate',
            header: 'Placa / Vehículo',
            type: 'text',
            isDraggable: false,
            renderCell: (row) => (
                <div>
                    <strong className={styles.plate}>{row.vehicle.plate}</strong>
                    <div className={styles.vehicleName}>
                        {row.vehicle.empresa || 'Sin empresa'}
                    </div>
                </div>
            )
        },
        {
            id: 'driver',
            header: 'Conductor Asignado',
            type: 'text',
            isDraggable: false,
            renderCell: (row) => (
                <div className={styles.driverCell}>
                    <div className={styles.driverAvatar}>
                        {row.driver.name ? row.driver.name.charAt(0) : 'U'}
                    </div>
                    <div>
                          <strong className={styles.driverName}>{row.driver.name}</strong>
                          <span className={styles.driverDetails}>C.C. {row.driver.cedula}</span>
                    </div>
                </div>
            )
        },
        {
            id: 'assignedAt',
            header: 'Fecha de Vínculo',
            type: 'text',
            isDraggable: false,
            renderCell: (row) => (
                <span className={styles.assignmentDate}>
                    {new Date(row.assignedAt).toLocaleDateString()}
                </span>
            )
        },
        {
            id: 'actions',
            header: 'Acciones',
            type: 'text',
            isDraggable: false,
            renderCell: (row) => (
                <div className={styles.actions}>
                    <Button
                        title="Nueva Operación"
                        variant="secondary"
                        onClick={() => handleNewOperation(row.vehicle.id, row.driver.id)}
                    >
                        Operación
                    </Button>

                    <Button
                        title="Reasignar"
                        variant="secondary"
                        onClick={() => handleReassign(row.vehicle.id)}
                    >
                        Reasignar
                    </Button>

                    <Button
                        title="Desvincular"
                        variant="secondary"
                        onClick={() => unassignVehicle(row.vehicle.id, row.vehicle.plate)}
                    >
                        Desvincular
                    </Button>
                </div>
            )
        }
    ], [handleNewOperation, handleReassign, unassignVehicle]);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    Centro de Asignaciones
                </h1>
                <p className={styles.subtitle}>
                    Control en tiempo real de qué conductor maneja qué vehículo.
                </p>
            </div>

            <div>
                {isLoading && activeAssignments.length === 0 ? (
                    <TruckLoader variant="section" message="Sincronizando flota y asignaciones..." />
                ) : (
                    <div className={styles.tablePanel}>
                        <PaginationTable
                            data={activeAssignments}
                            columns={assignmentColumns}
                            nameButton="Crear Asignación"
                            totalPages={1}
                            currentPage={1}
                            onPageChange={(page) => console.log(page)}
                            onOpenModal={() => {
                                setSelectedVehicleForModal(undefined);
                                setIsModalOpen(true);
                            }}
                        />
                    </div>
                )}
            </div>

            <AssignDriverModal
                key={`${isModalOpen}-${selectedVehicleForModal ?? ''}`}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAssign={assignDriver}
                initialVehicleId={selectedVehicleForModal}
            />
        </div>
    );
}
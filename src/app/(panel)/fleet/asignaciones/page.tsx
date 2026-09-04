'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import AssignDriverModal from '@/components/organisms/fleet/AssignDriverModal';
import { useAssignments } from '@/hooks/useFleet';
import { VehicleAssignment } from '@/types/fleet-types';
import { ColumnDef } from '@/types/table';
import { Button } from '@/components/atoms/button/button';

export default function AssignmentsPage() {
    const router = useRouter();
    const { activeAssignments, isLoading, loadActive, unassignVehicle, assignDriver } = useAssignments();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVehicleForModal, setSelectedVehicleForModal] = useState<number | undefined>(undefined);

    useEffect(() => {
        loadActive();
    }, [loadActive]);

    // Esto abre el modal cuando le dan clic al botón de la fila
    const handleReassign = (vehicleId: number) => {
        setSelectedVehicleForModal(vehicleId);
        setIsModalOpen(true);
    };

    const handleNewOperation = (vehicleId: number, driverId: number) => {
        router.push(`/operations/new?vehicleId=${vehicleId}&driverId=${driverId}`);
    };

    const assignmentColumns: ColumnDef<VehicleAssignment>[] = [
        {
            id: 'plate',
            header: 'Placa / Vehículo',
            type: 'text',
            isDraggable: false,
            renderCell: (row) => (
                <div>
                    <strong className="text-slate-800 text-lg">{row.vehicle.plate}</strong>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
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
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-inner">
                        {row.driver.name ? row.driver.name.charAt(0) : 'U'}
                    </div>
                    <div>
                        <strong className="text-slate-700 block leading-tight">{row.driver.name}</strong>
                        <span className="text-xs text-slate-500">C.C. {row.driver.cedula}</span>
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
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">
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
                <div className="flex items-center gap-2">
                    <Button
                        title="Nueva Operación"
                        variant="secondary"
                        onClick={() => handleNewOperation(row.vehicle.id, row.driver.id)}
                        style={{ padding: '6px 10px', fontSize: '1rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                    >
                        Operación
                    </Button>

                    <Button
                        title="Reasignar"
                        variant="secondary"
                        onClick={() => handleReassign(row.vehicle.id)}
                        style={{ padding: '6px 10px', fontSize: '1rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                    >
                        Reasignar
                    </Button>

                    <Button
                        title="Desvincular"
                        variant="secondary"
                        onClick={() => unassignVehicle(row.vehicle.id, row.vehicle.plate)}
                        style={{ padding: '6px 10px', fontSize: '1rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                    >
                        Desvincular
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600">
                    Centro de Asignaciones
                </h1>
                <p className="text-slate-500 mt-2 font-medium">
                    Control en tiempo real de qué conductor maneja qué vehículo.
                </p>
            </div>

            <div className="space-y-4">
                {isLoading && activeAssignments.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[300px]">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="font-medium">Sincronizando flota...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAssign={assignDriver}
                initialVehicleId={selectedVehicleForModal}
            />
        </div>
    );
}
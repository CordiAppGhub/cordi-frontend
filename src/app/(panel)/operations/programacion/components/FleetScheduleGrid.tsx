'use client';

import React, { useState, useMemo } from 'react';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { Tabs, TabOption } from '@/components/molecules/tabs/tabs';
import { useVehicles } from '@/hooks/use-vehicles';
import { useAnalysts } from '@/hooks/useAnalysts';
import { useClients } from '@/hooks/useClient';
import { tariffService } from '@/services/tariff.service';

import { getCreationColumns, getGroupedColumns, getNestedColumns } from './fleet-schedules.columns';
import { useLocations } from '@/app/(panel)/locations/hooks/useLocation';
import { useFleetSchedules } from '../hooks/useFleetSchedules';

// 🚀 1. Importamos el CSS Module
import styles from './fleet-schedule.module.css';

interface ScheduleRowState {
  [clientId: number]: {
    locationId: string;
    operationType: string;
    vehicleId: string;
    analystId: string;
    driverId: string;
    manualPrice: string;
    suggestedPrice: number | null;
    isCalculating: boolean;
  };
}

export default function FleetScheduleGrid() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowStates, setRowStates] = useState<ScheduleRowState>({});
  const [activeTab, setActiveTab] = useState<string>('asignar');

  const { schedules, createSchedule, isCreating, cancelSchedule, isCancelling } = useFleetSchedules(selectedDate);
  const { clients } = useClients();
  const { vehicles } = useVehicles();
  const { analysts } = useAnalysts();
  const { locations } = useLocations();

  const handleFieldChange = async (clientId: number, field: string, value: string) => {
    setRowStates((prev) => {
      const currentClientState = prev[clientId] || {
        locationId: '', operationType: '', vehicleId: '', analystId: '',
        driverId: '', manualPrice: '', suggestedPrice: null, isCalculating: false,
      };
      return { ...prev, [clientId]: { ...currentClientState, [field]: value } };
    });

    if (['manualPrice', 'vehicleId', 'analystId', 'driverId'].includes(field)) {
      return;
    }

    const currentState = rowStates[clientId] || { locationId: '', operationType: '' };
    const targetLocationId = field === 'locationId' ? value : currentState.locationId;
    const targetOpType = field === 'operationType' ? value : currentState.operationType;

    if (targetOpType && targetLocationId) {
      setRowStates((prev) => ({ 
        ...prev, 
        [clientId]: { ...prev[clientId], isCalculating: true } 
      }));

      try {
        const quote = await tariffService.getQuote({
          clientId: Number(clientId),
          operationType: targetOpType,
          isAnticipada: false,
          locationId: Number(targetLocationId),
        });
        
        const calculatedPrice = typeof quote === 'number' ? quote : quote?.price;
        
        setRowStates((prev) => ({
          ...prev,
          [clientId]: { 
            ...prev[clientId], 
            suggestedPrice: calculatedPrice ?? null, 
            isCalculating: false 
          },
        }));
      } catch (error) {
        setRowStates((prev) => ({
          ...prev,
          [clientId]: { ...prev[clientId], suggestedPrice: null, isCalculating: false },
        }));
      }
    } else {
      setRowStates((prev) => ({
        ...prev,
        [clientId]: { ...prev[clientId], suggestedPrice: null, isCalculating: false },
      }));
    }
  };

  const handleSaveRow = async (clientId: number) => {
    const rowData = rowStates[clientId];
    if (!rowData || !rowData.locationId || !rowData.operationType || !rowData.vehicleId || !rowData.analystId) {
      alert('Por favor completa la Sede, el Tipo de Operación, el Vehículo y el Analista.');
      return;
    }

    const payload = {
      date: selectedDate,
      clientId: Number(clientId),
      locationId: Number(rowData.locationId),
      operationType: rowData.operationType,
      vehicleId: Number(rowData.vehicleId),
      analystId: Number(rowData.analystId),
      fleteCobroManual: rowData.manualPrice ? parseFloat(rowData.manualPrice) : rowData.suggestedPrice,
    };

    await createSchedule(payload);
    
    setRowStates((prev) => {
      const newState = { ...prev };
      delete newState[clientId];
      return newState;
    });
  };

  const itemsPerPage = 10;
  const totalPages = Math.ceil(clients.length / itemsPerPage) || 1;
  const paginatedClients = clients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const groupedSchedules = useMemo(() => {
    const groups: Record<number, any> = {};
    schedules.forEach((schedule: any) => {
      const clientId = schedule.client.id;
      if (!groups[clientId]) {
        groups[clientId] = { id: clientId, razonSocial: schedule.client.razonSocial, operations: [] };
      }
      groups[clientId].operations.push(schedule);
    });
    return Object.values(groups).map((group) => {
      const uniqueAnalysts = Array.from(new Set(group.operations.map((op: any) => op.analyst.name)));
      return { ...group, totalOperations: group.operations.length, analystsStr: uniqueAnalysts.join(', ') };
    });
  }, [schedules]);

  const creationColumns = getCreationColumns(
    vehicles, 
    analysts, 
    locations,
    rowStates, 
    handleFieldChange, 
    handleSaveRow, 
    isCreating
  );
  const groupedColumns = getGroupedColumns();
  const nestedColumns = getNestedColumns(cancelSchedule, isCancelling);

  const tabOptions: TabOption[] = [
    { id: 'asignar', label: 'Asignar Flota' },
    { id: 'guardadas', label: 'Programadas', badge: schedules.length > 0 ? schedules.length : undefined },
  ];

  return (
    // 🚀 2. Aplicamos las clases desde el objeto styles
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>Matriz de Programación</h1>
          <p className={styles.subtitle}>Asignación de operaciones y cálculo de fletes.</p>
        </div>
        <div className={styles.dateWrapper}>
          <label className={styles.dateLabel}>Fecha Objetivo:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={styles.dateInput}
          />
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <Tabs tabs={tabOptions} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'asignar' && (
        <div className={styles.tableContainer}>
          <PaginationTable
            data={paginatedClients}
            columns={creationColumns}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {activeTab === 'guardadas' && (
        <div className={styles.tableContainer}>
          <PaginationTable
            data={groupedSchedules}
            columns={groupedColumns}
            totalPages={1}
            currentPage={1}
            onPageChange={() => {}}
            isCollapsible={true}
            subColumns={nestedColumns}
            getSubRows={(row) => row.operations}
          />
        </div>
      )}
    </div>
  );
}
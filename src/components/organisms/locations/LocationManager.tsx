'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '../../atoms/button/button';
import { Location } from '../../../types/location.types';
import { useLocations } from '@/hooks/useLocation';
import { LocationModal } from '@/components/molecules/locationModal/locationModal';
import { ColumnDef } from '@/types/table';
import PaginationTable from '../pagination-table/pagination-table';

export const LocationsManager: React.FC = () => {
  const { locations, isLoadingLocations, deleteLocation } = useLocations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<Location | null>(null);

  // Estados para la paginación local
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleOpenCreate = () => {
    setLocationToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (location: Location) => {
    setLocationToEdit(location);
    setIsModalOpen(true);
  };

  // ==========================================
  // CONFIGURACIÓN DE COLUMNAS (SuperTable)
  // ==========================================
  const columns: ColumnDef<Location>[] = useMemo(() => [
    {
      id: 'name',
      header: 'Nombre',
      type: 'text',
      renderCell: (row) => <span style={{ fontWeight: '500' }}>{row.name}</span>,
    },
    {
      id: 'type', // ID virtual
      header: 'Tipo de Instalación',
      type: 'text',
      renderCell: (loc) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {loc.isPort && <span style={{ padding: '2px 8px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '12px', fontSize: '12px' }}>Puerto</span>}
          {loc.isDepot && <span style={{ padding: '2px 8px', backgroundColor: '#fef3c7', color: '#b45309', borderRadius: '12px', fontSize: '12px' }}>Patio</span>}
          {loc.isClient && <span style={{ padding: '2px 8px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '12px', fontSize: '12px' }}>Bodega</span>}
        </div>
      ),
    },
    {
      id: 'routes', // ID virtual
      header: 'Rutas Permitidas',
      type: 'text',
      renderCell: (loc) => (
        <div style={{ fontSize: '13px' }}>
          {loc.isOrigin ? '✅ Origen' : '❌ Origen'}<br />
          {loc.isDestination ? '✅ Destino' : '❌ Destino'}
        </div>
      ),
    },
    {
      id: 'tarifas',
      header: 'Tarifas',
      type:'number',
      renderCell: (loc) => (
        loc.tarifas && loc.tarifas.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {loc.tarifas.map((tarifa, idx) => (
              <div key={idx} style={{ fontSize: '12px', backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>{tarifa.operacion}:</span>
                <span style={{ color: '#10b981', fontWeight: 'bold', marginLeft: '4px' }}>
                  ${tarifa.valor.toLocaleString('es-CO')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>Sin tarifas configuradas</span>
        )
      ),
    },
    {
      id: 'actions', // ID virtual
      header: 'Acciones',
      type: 'text',
      renderCell: (loc) => (
        <div style={{ textAlign: 'right' }}>
          <button 
            onClick={() => handleOpenEdit(loc)} 
            style={{ marginRight: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Editar
          </button>
          <button 
            onClick={() => deleteLocation(loc.id)} 
            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ], [deleteLocation]); // Dependencia para que React actualice las funciones si cambian

  // ==========================================
  // LÓGICA DE PAGINACIÓN CLIENT-SIDE
  // ==========================================
  const totalPages = Math.ceil((locations?.length || 0) / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return locations.slice(startIndex, startIndex + itemsPerPage);
  }, [locations, currentPage]);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Directorio de Empresas (Nodos)</h1>
        <Button onClick={handleOpenCreate} variant="primary">
          + Nueva Empresa
        </Button>
      </div>

      {isLoadingLocations ? (
        <p>Cargando información...</p>
      ) : (
        <PaginationTable
          data={paginatedData}
          columns={columns}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {isModalOpen && (
        <LocationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          locationToEdit={locationToEdit}
        />
      )}
    </div>
  );
};
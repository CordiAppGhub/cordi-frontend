'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  Search,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/atoms/button/button';
import { Input } from '@/components/atoms/input/input';
import { Select } from '@/components/atoms/select/select';
import { SuperModal } from '@/components/organisms/modal/modal';
import { TruckLoader } from '@/components/TruckLoader';
import { useVehicles } from '@/hooks/use-vehicles';
import { useAssignments } from '@/hooks/useFleet'; 
import { locationService } from '@/services/location.service';
import { vehiclesService } from '@/services/vehicles.service';
import { trailersService } from '@/services/trailers.service';
import { showToast } from '@/utils/alerts';
import type {
  CreateVehicleDto,
  Trailer,
  UpdateTrailerInput,
  UpdateVehicleDto,
  Vehicle,
} from '@/types/vehicles';
import type { CreateVehicleFormValues } from '@/schemas/vehicle.schema';

import styles from '../components/fleet-cards.module.css';
import CreateVehicleModal from './CreateVehicleModal';
import AssignDriverModal from '@/app/(panel)/fleet/asignaciones/components/AssignDriverModal'; 
import { VehicleCard } from '../components/VehicleCard';

type FleetTab = 'vehicles' | 'trailers';
type TrailerAction =
  | { type: 'couple'; vehicleId: number }
  | { type: 'uncouple'; vehicleId: number }
  | null;

const ASSETS_PER_PAGE = 8;

interface CardPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const CardPagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: CardPaginationProps) => {
  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav className={styles.cardPagination} aria-label="Paginación de inventario">
      <span className={styles.cardPaginationSummary}>
        Mostrando {firstItem}–{lastItem} de {totalItems}
      </span>
      <div className={styles.cardPaginationControls}>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
          Anterior
        </button>
        <span aria-live="polite">
          Página <strong>{currentPage}</strong> de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Página siguiente"
        >
          Siguiente
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
};

export const VehiclesTab = () => {
  const queryClient = useQueryClient();
  const { vehicles, isLoading, createVehicle, editVehicle } = useVehicles();
  const { activeAssignments, assignDriver, unassignVehicle } = useAssignments();
  const {
    data: ownYards = [],
    isLoading: isLoadingOwnYards,
    isError: ownYardsError,
  } = useQuery({
    queryKey: ['locations', 'own-yards'],
    queryFn: locationService.getOwnYards,
    staleTime: 1000 * 60 * 10,
  });
  const {
    data: trailers = [],
    isLoading: isLoadingTrailers,
    isError: trailersError,
  } = useQuery({
    queryKey: ['trailers'],
    queryFn: trailersService.getAll,
    staleTime: 1000 * 60,
  });
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createAssetType, setCreateAssetType] = useState<'vehicle' | 'trailer'>('vehicle');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingTrailer, setEditingTrailer] = useState<Trailer | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>(undefined);
  const [activeFleetTab, setActiveFleetTab] = useState<FleetTab>('vehicles');
  const [vehiclePlateSearch, setVehiclePlateSearch] = useState('');
  const [trailerPlateSearch, setTrailerPlateSearch] = useState('');
  const [vehiclePage, setVehiclePage] = useState(1);
  const [trailerPage, setTrailerPage] = useState(1);
  const [trailerAction, setTrailerAction] = useState<TrailerAction>(null);
  const [selectedTrailerId, setSelectedTrailerId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [isManagingTrailer, setIsManagingTrailer] = useState(false);

  const handleCreateVehicle = async (formData: CreateVehicleFormValues) => {
    if (formData.type === 'TRAILER') {
      if (
        (formData.axles !== 2 && formData.axles !== 3) ||
        !formData.trailerType ||
        !formData.currentLocationId
      ) {
        showToast.error(
          'Completa el tipo, los ejes y el patio inicial del tráiler.',
        );
        return false;
      }
      try {
        await trailersService.create({
          plate: formData.plate,
          trailerType: formData.trailerType,
          axles: formData.axles,
          currentLocationId: formData.currentLocationId,
          notes: formData.notes || undefined,
          brand: formData.brand || undefined,
          capacity:
            formData.cargoCapacity && formData.cargoCapacity > 0
              ? formData.cargoCapacity
              : undefined,
        });
        await queryClient.invalidateQueries({ queryKey: ['trailers'] });
        showToast.success('Tráiler registrado con éxito.');
        return true;
      } catch (error: unknown) {
        showToast.error(error, 'No se pudo registrar el tráiler.');
        return false;
      }
    }

    const payload: CreateVehicleDto = {
      plate: formData.plate,
      type: formData.type,
      brand: formData.brand ?? '',
      modelYear: formData.modelYear ?? new Date().getFullYear(),
      affiliation: formData.affiliation ?? 'CORDIVEHICULOS',
      cargoCapacity: formData.cargoCapacity ?? 0,
      status: formData.status ?? 'AVAILABLE',
      insuranceFileUrl: formData.insuranceFileUrl || undefined,
      insuranceExpiration: formData.insuranceExpiration || undefined,
      tecnomecanicaFileUrl: formData.tecnomecanicaFileUrl || undefined,
      tecnomecanicaExpiration: formData.tecnomecanicaExpiration || undefined,
    };
    return createVehicle(payload);
  };

  const handleUpdateVehicle = async (
    id: number,
    data: UpdateVehicleDto,
  ): Promise<boolean> => editVehicle(id, data);

  const handleUpdateTrailer = async (
    id: string,
    data: UpdateTrailerInput,
  ): Promise<boolean> => {
    try {
      await trailersService.update(id, data);
      await queryClient.invalidateQueries({ queryKey: ['trailers'] });
      showToast.success('Tráiler modificado con éxito.');
      return true;
    } catch (error: unknown) {
      showToast.error(error, 'No se pudo actualizar el tráiler.');
      return false;
    }
  };

  const openVehicleEditor = (vehicleId: number) => {
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) {
      showToast.error('No se encontró el cabezote seleccionado.');
      return;
    }
    setEditingTrailer(null);
    setEditingVehicle(vehicle);
    setCreateAssetType('vehicle');
    setIsCreateModalOpen(true);
  };

  const openTrailerEditor = (trailer: Trailer) => {
    setEditingVehicle(null);
    setEditingTrailer(trailer);
    setCreateAssetType('trailer');
    setIsCreateModalOpen(true);
  };

  const closeAssetModal = () => {
    setIsCreateModalOpen(false);
    setEditingVehicle(null);
    setEditingTrailer(null);
  };

  const handleOpenAssignModal = (vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
    setIsAssignModalOpen(true);
  };

  const openTrailerAction = (action: Exclude<TrailerAction, null>) => {
    setSelectedTrailerId('');
    setSelectedLocationId('');
    setTrailerAction(action);
  };

  const closeTrailerAction = () => {
    if (!isManagingTrailer) setTrailerAction(null);
  };

  const submitTrailerAction = async () => {
    if (!trailerAction) return;
    const vehicle = vehicles.find((item) => item.id === trailerAction.vehicleId);
    if (!vehicle) {
      showToast.error('No se encontró el cabezote seleccionado.');
      return;
    }
    if (trailerAction.type === 'couple' && !selectedTrailerId) {
      showToast.warning('Selecciona un tráiler disponible.');
      return;
    }
    if (
      trailerAction.type === 'uncouple' &&
      !Number.isSafeInteger(Number(selectedLocationId))
    ) {
      showToast.warning('Selecciona el patio donde quedará el tráiler.');
      return;
    }

    setIsManagingTrailer(true);
    try {
      if (trailerAction.type === 'couple') {
        await vehiclesService.coupleTrailer(
          vehicle.id,
          selectedTrailerId,
        );
        showToast.success('Tráiler acoplado correctamente.');
      } else {
        await vehiclesService.uncoupleTrailer(
          vehicle.id,
          Number(selectedLocationId),
        );
        showToast.success('Tráiler liberado en el patio seleccionado.');
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['trailers'] }),
      ]);
      setTrailerAction(null);
    } catch (error: unknown) {
      showToast.error(
        error,
        'No se pudo actualizar el acople del tráiler.',
      );
    } finally {
      setIsManagingTrailer(false);
    }
  };

  const selectedVehicle = trailerAction
    ? vehicles.find((item) => item.id === trailerAction.vehicleId)
    : undefined;
  const availableTrailers = trailers.filter(
    (trailer) => trailer.status === 'AVAILABLE_IN_YARD',
  );
  const normalizedVehicleSearch = vehiclePlateSearch.trim().toLocaleUpperCase();
  const filteredVehicles = vehicles.filter((vehicle) =>
    vehicle.plate.toLocaleUpperCase().includes(normalizedVehicleSearch),
  );
  const normalizedTrailerSearch = trailerPlateSearch.trim().toLocaleUpperCase();
  const filteredTrailers = trailers.filter((trailer) =>
    trailer.plate.toLocaleUpperCase().includes(normalizedTrailerSearch),
  );
  const vehiclePageCount = Math.max(
    1,
    Math.ceil(filteredVehicles.length / ASSETS_PER_PAGE),
  );
  const trailerPageCount = Math.max(
    1,
    Math.ceil(filteredTrailers.length / ASSETS_PER_PAGE),
  );
  const currentVehiclePage = Math.min(vehiclePage, vehiclePageCount);
  const currentTrailerPage = Math.min(trailerPage, trailerPageCount);
  const paginatedVehicles = filteredVehicles.slice(
    (currentVehiclePage - 1) * ASSETS_PER_PAGE,
    currentVehiclePage * ASSETS_PER_PAGE,
  );
  const paginatedTrailers = filteredTrailers.slice(
    (currentTrailerPage - 1) * ASSETS_PER_PAGE,
    currentTrailerPage * ASSETS_PER_PAGE,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className={styles.fleetAssetTabs}>
        <button
          type="button"
          className={activeFleetTab === 'vehicles' ? styles.fleetAssetTabActive : ''}
          onClick={() => setActiveFleetTab('vehicles')}
        >
          Cabezotes
          <span className={styles.fleetAssetCount}>
            {isLoading ? '…' : vehicles.length}
          </span>
        </button>
        <button
          type="button"
          className={activeFleetTab === 'trailers' ? styles.fleetAssetTabActive : ''}
          onClick={() => setActiveFleetTab('trailers')}
        >
          Tráilers / Chasis
          <span className={styles.fleetAssetCount}>
            {isLoadingTrailers ? '…' : trailers.length}
          </span>
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <div className={styles.fleetViewHeading}>
          <h2>
            {activeFleetTab === 'vehicles'
              ? 'Directorio de Cabezotes'
              : 'Directorio de Tráilers'}
          </h2>
          <span className={styles.fleetViewCount}>
            {activeFleetTab === 'vehicles'
              ? vehiclePlateSearch.trim()
                ? `${filteredVehicles.length} de ${vehicles.length}`
                : vehicles.length
              : trailerPlateSearch.trim()
                ? `${filteredTrailers.length} de ${trailers.length}`
                : trailers.length}
          </span>
        </div>
        <Button 
          variant="primary" 
          onClick={() => {
            setEditingVehicle(null);
            setEditingTrailer(null);
            setCreateAssetType(activeFleetTab === 'trailers' ? 'trailer' : 'vehicle');
            setIsCreateModalOpen(true);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2563eb' }}
        >
          <Plus size={18} /> {activeFleetTab === 'vehicles' ? 'Nuevo cabezote' : 'Nuevo tráiler'}
        </Button>
      </div>

      <label className={styles.plateSearch}>
        <span>
          <Search size={16} aria-hidden="true" />
          Buscar {activeFleetTab === 'vehicles' ? 'cabezote' : 'tráiler'} por placa
        </span>
        <div className={styles.plateSearchInput}>
          <Input
            type="search"
            value={
              activeFleetTab === 'vehicles'
                ? vehiclePlateSearch
                : trailerPlateSearch
            }
            onChange={(event) => {
              const value = event.target.value;
              if (activeFleetTab === 'vehicles') {
                setVehiclePlateSearch(value);
                setVehiclePage(1);
              } else {
                setTrailerPlateSearch(value);
                setTrailerPage(1);
              }
            }}
            placeholder={
              activeFleetTab === 'vehicles'
                ? 'Ej. ABC123'
                : 'Ej. TRL892'
            }
            aria-label={`Buscar ${activeFleetTab === 'vehicles' ? 'cabezote' : 'tráiler'} por placa`}
          />
        </div>
      </label>

      {activeFleetTab === 'vehicles' && isLoading && vehicles.length === 0 ? (
        <TruckLoader variant="compact" message="Sincronizando inventario de vehículos..." />
      ) : activeFleetTab === 'vehicles' && vehicles.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '60px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1' }}>
          No hay vehículos registrados en la flota.
        </div>
      ) : activeFleetTab === 'vehicles' && filteredVehicles.length === 0 ? (
        <div className={styles.searchEmptyState}>
          No se encontraron cabezotes con la placa “{vehiclePlateSearch}”.
        </div>
      ) : activeFleetTab === 'vehicles' ? (
        <div className={styles.cardsGrid}>
          {paginatedVehicles.map((vehicle) => {
            const assignment = activeAssignments.find((a) => a.vehicleId === vehicle.id);

            return (
              <div key={vehicle.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <VehicleCard 
                  vehicle={vehicle} 
                  driverName={assignment?.driver.name ?? vehicle.driver?.name ?? null}
                  onClickEdit={openVehicleEditor}
                  onAssignDriver={() => handleOpenAssignModal(vehicle.id)}
                  onUnassignDriver={() => unassignVehicle(vehicle.id, vehicle.plate)}
                  onCoupleTrailer={() => openTrailerAction({ type: 'couple', vehicleId: vehicle.id })}
                  onUncoupleTrailer={() => openTrailerAction({ type: 'uncouple', vehicleId: vehicle.id })}
                />
              </div>
            );
          })}
        </div>
      ) : isLoadingTrailers ? (
        <TruckLoader variant="compact" message="Cargando inventario de tráilers..." />
      ) : trailersError ? (
        <p role="alert">No se pudo cargar el inventario de tráilers.</p>
      ) : trailers.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '60px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1' }}>
          No hay tráilers registrados en la flota.
        </div>
      ) : filteredTrailers.length === 0 ? (
        <div className={styles.searchEmptyState}>
          No se encontraron tráileres con la placa “{trailerPlateSearch}”.
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {paginatedTrailers.map((trailer: Trailer) => (
            <article key={trailer.id} className={styles.trailerInventoryCard}>
              <div>
                <strong>{trailer.plate}</strong>
                <span className={styles.trailerStatus}>
                  {trailer.status.replaceAll('_', ' ')}
                </span>
              </div>
              <p>
                {trailer.trailerType} · {trailer.axles} ejes
                {' · '}{trailer.brand || 'Marca sin registrar'}
                {' · Capacidad: '}{trailer.capacity ? `${trailer.capacity.toLocaleString()} kg` : '--'}
              </p>
              {trailer.notes && <p>{trailer.notes}</p>}
              <p className={styles.trailerLocation}>
                <MapPin size={16} />
                {trailer.status === 'COUPLED'
                  ? `Acoplado a ${trailer.coupledVehicle?.plate || 'un cabezote'}`
                  : trailer.currentLocation?.name || 'Ubicación sin registrar'}
              </p>
              {trailer.latitude != null && trailer.longitude != null && (
                <a
                  href={`https://maps.google.com/?q=${trailer.latitude},${trailer.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.trailerCoordinates}
                >
                  Ver ubicación GPS · {trailer.latitude.toFixed(5)}, {trailer.longitude.toFixed(5)}
                </a>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={() => openTrailerEditor(trailer)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifySelf: 'start' }}
              >
                <Pencil size={15} /> Editar tráiler
              </Button>
            </article>
          ))}
        </div>
      )}

      {activeFleetTab === 'vehicles' && filteredVehicles.length > 0 && (
        <CardPagination
          currentPage={currentVehiclePage}
          totalPages={vehiclePageCount}
          totalItems={filteredVehicles.length}
          pageSize={ASSETS_PER_PAGE}
          onPageChange={setVehiclePage}
        />
      )}
      {activeFleetTab === 'trailers' &&
        !isLoadingTrailers &&
        !trailersError &&
        filteredTrailers.length > 0 && (
          <CardPagination
            currentPage={currentTrailerPage}
            totalPages={trailerPageCount}
            totalItems={filteredTrailers.length}
            pageSize={ASSETS_PER_PAGE}
            onPageChange={setTrailerPage}
          />
        )}

      <CreateVehicleModal 
        isOpen={isCreateModalOpen}
        assetType={createAssetType}
        ownYards={ownYards}
        isLoadingOwnYards={isLoadingOwnYards}
        ownYardsError={ownYardsError}
        editingVehicle={editingVehicle}
        editingTrailer={editingTrailer}
        onClose={closeAssetModal}
        onCreateVehicle={handleCreateVehicle}
        onUpdateVehicle={handleUpdateVehicle}
        onUpdateTrailer={handleUpdateTrailer}
      />

      <AssignDriverModal
        key={`${isAssignModalOpen}-${selectedVehicleId ?? ''}`}
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={assignDriver}
        initialVehicleId={selectedVehicleId}
      />

      <SuperModal
        isOpen={trailerAction !== null}
        onClose={closeTrailerAction}
        title={trailerAction?.type === 'couple' ? 'Acoplar tráiler' : 'Liberar tráiler'}
        width="520px"
      >
        {selectedVehicle && trailerAction && (
          <div className={styles.trailerActionModal}>
            <p>
              Cabezote <strong>{selectedVehicle.plate}</strong>
              {trailerAction.type === 'couple' && ' · Selecciona un tráiler disponible en patio.'}
              {trailerAction.type === 'uncouple' && ` · Tráiler ${selectedVehicle.currentTrailer?.plate ?? ''}`}
            </p>
            {trailerAction.type === 'couple' ? (
              <label>
                Tráiler disponible
                <Select
                  searchable
                  value={selectedTrailerId}
                  onValueChange={setSelectedTrailerId}
                  searchPlaceholder="Buscar tráiler por placa..."
                  options={[
                    ...availableTrailers.map((trailer) => ({
                      value: String(trailer.id),
                      label: `${trailer.plate} · ${trailer.axles} ejes`,
                    })),
                  ]}
                />
                {!availableTrailers.length && (
                  <small>No hay tráilers disponibles en patio.</small>
                )}
              </label>
            ) : (
              <label>
                Patio de destino
                <Select
                  value={selectedLocationId}
                  onChange={(event) => setSelectedLocationId(event.target.value)}
                  options={[
                    { value: '', label: 'Selecciona un patio' },
                    ...ownYards.map((location) => ({
                      value: String(location.id),
                      label: location.name,
                    })),
                  ]}
                />
                {isLoadingOwnYards && <small>Cargando patios propios...</small>}
                {ownYardsError && (
                  <small role="alert">No se pudieron cargar los patios propios.</small>
                )}
                {!isLoadingOwnYards && !ownYardsError && !ownYards.length && (
                  <small>Registra o marca una ubicación como patio propio.</small>
                )}
              </label>
            )}
            <div className={styles.trailerActionButtons}>
              <Button variant="secondary" onClick={closeTrailerAction} disabled={isManagingTrailer}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => void submitTrailerAction()}
                isLoading={isManagingTrailer}
                disabled={
                  isManagingTrailer ||
                  (trailerAction.type === 'couple' && !availableTrailers.length) ||
                  (trailerAction.type === 'uncouple' &&
                    (isLoadingOwnYards || ownYardsError || !ownYards.length))
                }
              >
                {trailerAction.type === 'couple' ? 'Acoplar tráiler' : 'Liberar en patio'}
              </Button>
            </div>
          </div>
        )}
      </SuperModal>
    </div>
  );
};
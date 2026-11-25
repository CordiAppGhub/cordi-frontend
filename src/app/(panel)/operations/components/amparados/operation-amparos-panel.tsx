"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  ChevronDown,
  Loader2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/use-auth.store";
import { useAmparosStore } from "@/store/use-amparos.store";
import { showToast } from "@/utils/alerts";
import { getUserFriendlyErrorMessage } from "@/utils/api-error";
import { SuperModal } from "@/components/organisms/modal/modal";
import styles from "./operation-amparos-panel.module.css";
import {
  AmparoSuggestion,
  AmparoSuggestionOperation,
} from "@/services/operation.service";
import { TRAILER_TYPE_LABELS, type Vehicle } from "@/types/vehicles";
import { useAmparos } from "../../hooks/use-amparos";
import { operationService } from "@/services/operation.service";
import type { Operation } from "@/types/operation-types";
import { OperationDispatchDrawer } from "../actions/operation-dispatch-drawer";

interface Props {
  enabled: boolean;
}

interface AmparoGroup {
  kind: "PUERTO" | "PATIO";
  exportOperation: AmparoSuggestionOperation;
  importOptions: (AmparoSuggestionOperation & {
    suggestion: AmparoSuggestion;
  })[];
}

interface SelectedAmparoFleet {
  driverId: number;
  vehicleId: number;
  driverName: string;
  vehiclePlate: string;
}

const groupSuggestions = (suggestions: AmparoSuggestion[]): AmparoGroup[] => {
  const groups = new Map<string, AmparoGroup>();

  for (const suggestion of suggestions) {
    const kind = suggestion.kind ?? "PUERTO";
    const exportId = suggestion.exportOperation.id;
    const groupKey = `${kind}:${exportId}`;
    let group = groups.get(groupKey);
    if (!group) {
      group = {
        kind,
        exportOperation: suggestion.exportOperation,
        importOptions: [],
      };
      groups.set(groupKey, group);
    }
    group.importOptions.push({ ...suggestion.importOperation, suggestion });
  }

  return Array.from(groups.values());
};

const formatAppointment = (date: string) =>
  new Date(date).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });

const formatDestination = (date?: string | null) =>
  date ? formatAppointment(date) : "Sin cita asignada";

const getCounterpartAnalystName = (
  suggestion: AmparoSuggestion,
  userId: number,
) => {
  const { exportOperation, importOperation } = suggestion;
  if (
    exportOperation.analyst?.id === userId &&
    importOperation.analyst?.id !== userId
  )
    return importOperation.analyst?.name || "responsable de importación";
  if (
    importOperation.analyst?.id === userId &&
    exportOperation.analyst?.id !== userId
  )
    return exportOperation.analyst?.name || "responsable de exportación";
  return "responsable de la otra operación";
};

const getAmparoAxleIssues = (
  vehicle: Vehicle,
  suggestion: AmparoSuggestion,
): string[] => {
  const issues: string[] = [];
  if (vehicle.axles !== 2 && vehicle.axles !== 3) {
    issues.push("ejes del cabezote sin registrar (se requieren 2 o 3)");
  }

  for (const operation of [
    suggestion.exportOperation,
    suggestion.importOperation,
  ]) {
    const configuration = operation.cargoVehicleType;
    if (
      configuration?.tractorAxles != null &&
      (vehicle.axles ?? 0) < configuration.tractorAxles
    ) {
      issues.push(
        `operación #${operation.id}: requiere al menos ${configuration.tractorAxles} ejes en el cabezote`,
      );
    }
    if (configuration?.requiresTrailer && !vehicle.currentTrailer) {
      issues.push(`operación #${operation.id}: requiere tráiler`);
    }
    if (
      configuration?.trailerAxles != null &&
      (vehicle.currentTrailer?.axles ?? 0) < configuration.trailerAxles
    ) {
      issues.push(
        `operación #${operation.id}: requiere al menos ${configuration.trailerAxles} ejes en el tráiler`,
      );
    }
    if (
      operation.requiredTrailerType &&
      vehicle.currentTrailer?.trailerType !== operation.requiredTrailerType
    ) {
      issues.push(
        `operación #${operation.id}: tráiler tipo ${TRAILER_TYPE_LABELS[operation.requiredTrailerType]}`,
      );
    }
  }

  return [...new Set(issues)];
};

export function OperationAmparosPanel({ enabled }: Props) {
  const user = useAuthStore((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const [fleetDrawerOperation, setFleetDrawerOperation] =
    useState<Operation | null>(null);
  const [isOpeningFleetDrawer, setIsOpeningFleetDrawer] = useState(false);
  const [selectedFleet, setSelectedFleet] =
    useState<SelectedAmparoFleet | null>(null);
  const canConfirmAmparo =
    user?.role === "ADMIN" ||
    user?.role === "JEFE_DE_FLOTA" ||
    user?.role === "ANALISTA";

  const {
    selectedSuggestion,
    driverId,
    vehicleId,
    agreementConfirmed,
    openConfirmation,
    closeConfirmation,
    setDriverId,
    setVehicleId,
    setAgreementConfirmed,
  } = useAmparosStore();

  const { suggestionsQuery, driversQuery, vehiclesQuery, confirmMutation } =
    useAmparos(enabled);

  useEffect(() => {
    if (enabled && suggestionsQuery.isError) {
      showToast.error(
        suggestionsQuery.error,
        "No se pudieron consultar las posibilidades de amparo.",
      );
    }
  }, [enabled, suggestionsQuery.error, suggestionsQuery.isError]);

  if (!enabled) return null;

  const suggestions = suggestionsQuery.data ?? [];
  const groupedSuggestions = groupSuggestions(suggestions);
  const selectedVehicle = (vehiclesQuery.data ?? []).find(
    (vehicle) => String(vehicle.id) === vehicleId,
  );
  const selectedVehicleIssues =
    selectedVehicle && selectedSuggestion
      ? getAmparoAxleIssues(selectedVehicle, selectedSuggestion)
      : [];
  const selectedDriver =
    (driversQuery.data ?? []).find(
      (driver) => String(driver.id) === driverId,
    ) ??
    (selectedSuggestion?.exportOperation.driver?.id === Number(driverId)
      ? selectedSuggestion.exportOperation.driver
      : selectedSuggestion?.importOperation.driver);
  const selectedVehicleSuggestion =
    (vehiclesQuery.data ?? []).find(
      (vehicle) => String(vehicle.id) === vehicleId,
    ) ??
    (selectedSuggestion?.exportOperation.vehicle?.id === Number(vehicleId)
      ? selectedSuggestion.exportOperation.vehicle
      : selectedSuggestion?.importOperation.vehicle);

  const handleOpenConfirmation = (suggestion: AmparoSuggestion) => {
    setSelectedFleet(null);
    openConfirmation(suggestion);
    setDriverId(
      String(
        suggestion.exportOperation.driver?.id ??
          suggestion.importOperation.driver?.id ??
          "",
      ),
    );
    setVehicleId(
      String(
        suggestion.exportOperation.vehicle?.id ??
          suggestion.importOperation.vehicle?.id ??
          "",
      ),
    );
  };

  const handleCloseConfirmation = () => {
    setFleetDrawerOperation(null);
    setSelectedFleet(null);
    closeConfirmation();
  };

  const handleOpenFleetDrawer = async () => {
    if (!selectedSuggestion || isOpeningFleetDrawer) return;
    setIsOpeningFleetDrawer(true);
    try {
      const operation = await operationService.getOperationById(
        selectedSuggestion.exportOperation.id,
      );
      setFleetDrawerOperation(operation);
    } catch (error) {
      showToast.error(
        error,
        getUserFriendlyErrorMessage(
          error,
          "No se pudo cargar la operación para seleccionar flota.",
        ),
      );
    } finally {
      setIsOpeningFleetDrawer(false);
    }
  };

  const handleConfirm = () => {
    if (
      !selectedSuggestion ||
      !driverId ||
      !vehicleId ||
      selectedVehicleIssues.length > 0
    ) {
      return;
    }
    if (user?.role === "ANALISTA" && !agreementConfirmed) return;

    confirmMutation.mutate({
      kind: selectedSuggestion.kind ?? "PUERTO",
      exportOperationId: selectedSuggestion.exportOperation.id,
      importOperationId: selectedSuggestion.importOperation.id,
      driverId: Number(driverId),
      vehicleId: Number(vehicleId),
    });
  };

  return (
    <section
      aria-labelledby="amparos-panel-title"
      className={`${styles.panel} ${suggestions.length > 0 && !isOpen ? styles.panelGlow : ""}`}
    >
      <div className={styles.panelHeader}>
        <div className={styles.heading}>
          <span className={styles.headingIcon}>
            <ShieldCheck size={21} aria-hidden="true" />
          </span>
          <div className={styles.headingText}>
            <h2 id="amparos-panel-title">Amparos disponibles</h2>
            <p>
              Operaciones de exportación e importación compatibles para
              compartir recursos, además de dobles traslados en patios.
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {!suggestionsQuery.isLoading && !suggestionsQuery.isError && (
            <span className={styles.count}>
              {suggestions.length}{" "}
              {suggestions.length === 1 ? " oportunidad" : " oportunidades"}
            </span>
          )}
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setIsOpen((value) => !value)}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Contraer amparos" : "Desplegar amparos"}
          >
            <ChevronDown
              size={18}
              aria-hidden="true"
              className={isOpen ? styles.chevronOpen : undefined}
            />
          </button>
        </div>
      </div>

      {suggestionsQuery.isLoading ? (
        <div className={styles.panelMessage} role="status">
          <Loader2 size={17} className={styles.loaderSpin} aria-hidden="true" />{" "}
          Consultando operaciones compatibles…
        </div>
      ) : suggestionsQuery.isError && suggestions.length === 0 ? (
        <div
          className={`${styles.panelMessage} ${styles.panelError}`}
          role="alert"
        >
          <span>
            {getUserFriendlyErrorMessage(
              suggestionsQuery.error,
              "No se pudieron consultar las posibilidades de amparo.",
            )}
          </span>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => void suggestionsQuery.refetch()}
          >
            Reintentar
          </button>
        </div>
      ) : suggestions.length === 0 ? (
        isOpen && (
          <p className={styles.panelMessage}>
            No hay amparos disponibles. Las citas deben ser el mismo día y en el
            mismo puerto. Las devoluciones pendientes también deben coincidir en
            tipo de contenedor.
          </p>
        )
      ) : (
        isOpen && (
          <ul className={styles.suggestionList}>
            {groupedSuggestions.map(
              ({ kind, exportOperation, importOptions }) => (
                <li key={exportOperation.id}>
                  <article className={styles.groupCard}>
                    <span className={styles.rowExport}>
                      {kind === "PATIO"
                        ? "Doble traslado / Amparo en patio · Retiro de vacío #"
                        : "Exportación #"}
                      {exportOperation.numeroPedido?.trim() || "Sin pedido"}
                    </span>
                    <div className={styles.suggestionMeta}>
                      <span className={styles.metaItem}>
                        <MapPin size={14} aria-hidden="true" />
                        {exportOperation.port?.name ?? "Puerto sin nombre"}
                      </span>
                      {(kind === "PATIO" ||
                        exportOperation.isContainerized === true) && (
                        <span className={styles.metaItem}>
                          <CalendarClock size={14} aria-hidden="true" />
                          {kind === "PATIO"
                            ? formatAppointment(exportOperation.appointmentAt)
                            : formatDestination(
                                exportOperation.fechaCitaDestino,
                              )}
                        </span>
                      )}
                      <span>
                        Responsable:{" "}
                        {exportOperation.analyst?.name || "No disponible"}
                      </span>
                      <span>
                        Conductor:{" "}
                        {exportOperation.driver?.name || "No disponible"}
                      </span>
                      <span>
                        Vehículo:{" "}
                        {exportOperation.vehicle?.plate || "No disponible"}
                      </span>
                    </div>
                    <details className={styles.groupDetails}>
                      <summary className={styles.groupSummary}>
                        <span>
                          {importOptions.length}{" "}
                          {importOptions.length === 1
                            ? kind === "PATIO"
                              ? "devolución compatible"
                              : "opción de importación"
                            : kind === "PATIO"
                              ? "devoluciones compatibles"
                              : "opciones de importación"}
                        </span>
                        <ChevronDown
                          className={styles.groupChevron}
                          size={16}
                          aria-hidden="true"
                        />
                      </summary>
                      <ul className={styles.importOptions}>
                        {importOptions.map((option) => (
                          <li key={option.id} className={styles.importOption}>
                            <div className={styles.importOptionInfo}>
                              <span className={styles.rowImport}>
                                {kind === "PATIO"
                                  ? "Devolución"
                                  : option.isReturnAmparo
                                    ? "Devolución"
                                    : "Importación"}{" "}
                                #{option.numeroPedido?.trim() || "Sin pedido"}
                              </span>
                              <span>
                                Responsable:{" "}
                                {option.analyst?.name || "Sin responsable"}
                              </span>
                            </div>
                            <button
                              type="button"
                              className={styles.acceptButton}
                              onClick={() =>
                                handleOpenConfirmation(option.suggestion)
                              }
                              aria-label={`Seleccionar ${option.isReturnAmparo ? "devolución" : "importación"} ${option.numeroPedido?.trim() || `sin pedido, operación ${option.id}`} para la exportación ${exportOperation.numeroPedido?.trim() || `sin pedido, operación ${exportOperation.id}`}`}
                            >
                              {kind === "PATIO"
                                ? "Seleccionar doble traslado"
                                : "Seleccionar amparo"}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </article>
                </li>
              ),
            )}
          </ul>
        )
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      <SuperModal
        isOpen={Boolean(selectedSuggestion) && !fleetDrawerOperation}
        onClose={handleCloseConfirmation}
        title={
          selectedSuggestion?.kind === "PATIO"
            ? "Confirmar doble traslado en patio"
            : "Confirmar amparo"
        }
        width="520px"
      >
        {selectedSuggestion && (
          <div className={styles.modalContent}>
            <p className={styles.modalIntro}>Vas a relacionar estos pedidos:</p>

            <div className={styles.modalOperations}>
              <div
                className={`${styles.modalOperation} ${styles.exportOperation}`}
              >
                <p className={styles.operationType}>
                  {selectedSuggestion.kind === "PATIO"
                    ? "Retiro de vacío"
                    : "Exportación"}
                </p>
                <p className={styles.modalOrder}>
                  Pedido:{" "}
                  {selectedSuggestion.exportOperation.numeroPedido ||
                    "Sin número de pedido"}
                </p>
                <p className={styles.modalOperationId}>
                  Operación #{selectedSuggestion.exportOperation.id}
                </p>
                <p className={styles.modalOperationId}>
                  Responsable:{" "}
                  {selectedSuggestion.exportOperation.analyst?.name ||
                    "Sin responsable"}
                </p>
                <p className={styles.modalOperationId}>
                  {selectedSuggestion.kind === "PATIO" ? "Patio" : "Puerto"}:{" "}
                  {selectedSuggestion.exportOperation.port?.name ?? "—"}
                </p>
                {(selectedSuggestion.kind === "PATIO" ||
                  selectedSuggestion.exportOperation.isContainerized ===
                    true) && (
                  <p className={styles.modalOperationId}>
                    {selectedSuggestion.kind === "PATIO"
                      ? "Fecha programada: "
                      : "Cita destino: "}
                    {selectedSuggestion.kind === "PATIO"
                      ? formatAppointment(
                          selectedSuggestion.exportOperation.appointmentAt,
                        )
                      : formatDestination(
                          selectedSuggestion.exportOperation.fechaCitaDestino,
                        )}
                  </p>
                )}
              </div>
              <div
                className={`${styles.modalOperation} ${styles.importOperation}`}
              >
                <p className={styles.operationType}>
                  {selectedSuggestion.kind === "PATIO"
                    ? "Devolución de vacío"
                    : selectedSuggestion.importOperation.isReturnAmparo
                      ? "Devolución pendiente"
                      : "Importación"}
                </p>
                <p className={styles.modalOrder}>
                  Pedido:{" "}
                  {selectedSuggestion.importOperation.numeroPedido ||
                    "Sin número de pedido"}
                </p>
                <p className={styles.modalOperationId}>
                  Operación #{selectedSuggestion.importOperation.id}
                </p>
                <p className={styles.modalOperationId}>
                  Responsable:{" "}
                  {selectedSuggestion.importOperation.analyst?.name ||
                    "Sin responsable"}
                </p>
                <p className={styles.modalOperationId}>
                  {selectedSuggestion.kind === "PATIO" ? "Patio" : "Puerto"}:{" "}
                  {selectedSuggestion.importOperation.port?.name ??
                    "Por confirmar"}
                </p>
                {selectedSuggestion.importOperation.isContainerized ===
                  true && (
                  <p className={styles.modalOperationId}>
                    Cita destino:{" "}
                    {formatDestination(
                      selectedSuggestion.importOperation.fechaCitaDestino,
                    )}
                  </p>
                )}
              </div>
            </div>

            <p className={styles.modalDescription}>
              Selecciona la flota común para ambas operaciones. Si ya hay flota
              asignada, aparecerá como selección inicial; puedes cambiarla desde
              el drawer antes de confirmar.
            </p>
            {selectedSuggestion.conflictingDrivers && (
              <p className={styles.panelError} role="alert">
                Las operaciones tienen conductores distintos. Se prioriza la
                flota de Exportación; puedes cambiarla desde el drawer.
              </p>
            )}

            {/* CHECKBOX DE ACUERDO OBLIGATORIO PARA ANALISTAS */}
            {user?.role === "ANALISTA" && (
              <label className={styles.agreementCheckbox}>
                <input
                  type="checkbox"
                  checked={agreementConfirmed}
                  onChange={(event) =>
                    setAgreementConfirmed(event.target.checked)
                  }
                />
                <span>
                  Confirmo que hablé y llegué a un acuerdo con{" "}
                  <strong>
                    {getCounterpartAnalystName(selectedSuggestion, user.id)}
                  </strong>
                  .
                </span>
              </label>
            )}

            <div className={styles.fieldLabel}>
              Conductor y vehículo
              <span>
                Conductor:{" "}
                {selectedFleet?.driverId === Number(driverId)
                  ? selectedFleet.driverName
                  : selectedDriver?.name || "Sin seleccionar"}
              </span>
              <span>
                Vehículo:{" "}
                {selectedFleet?.vehicleId === Number(vehicleId)
                  ? selectedFleet.vehiclePlate
                  : selectedVehicleSuggestion?.plate || "Sin seleccionar"}
              </span>
              <button
                type="button"
                className={styles.acceptButton}
                onClick={() => void handleOpenFleetDrawer()}
                disabled={isOpeningFleetDrawer}
              >
                {isOpeningFleetDrawer
                  ? "Cargando operación..."
                  : driverId && vehicleId
                    ? "Cambiar conductor / vehículo"
                    : "Seleccionar conductor y vehículo"}
              </button>
              {selectedVehicleIssues.length > 0 ? (
                <span role="alert">
                  No compatible por ejes: {selectedVehicleIssues.join("; ")}.
                </span>
              ) : null}
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={handleCloseConfirmation}
                disabled={confirmMutation.isPending}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={
                  !canConfirmAmparo ||
                  confirmMutation.isPending ||
                  !driverId ||
                  !vehicleId ||
                  selectedVehicleIssues.length > 0 ||
                  (user?.role === "ANALISTA" && !agreementConfirmed) // Valida que el checkbox esté marcado
                }
                className={styles.confirmButton}
              >
                {confirmMutation.isPending && (
                  <Loader2 size={15} className={styles.loaderSpin} />
                )}{" "}
                Aceptar y asignar a ambas
              </button>
            </div>
          </div>
        )}
      </SuperModal>
      <OperationDispatchDrawer
        operation={fleetDrawerOperation}
        isAnalyst={user?.role === "ANALISTA"}
        allowAnalystFleetReassignment
        selectionOnly
        preassignedFleet={{
          driverIds: [
            selectedSuggestion?.exportOperation.driver?.id,
            selectedSuggestion?.importOperation.driver?.id,
          ].filter((id): id is number => typeof id === "number"),
          vehicleIds: [
            selectedSuggestion?.exportOperation.vehicle?.id,
            selectedSuggestion?.importOperation.vehicle?.id,
          ].filter((id): id is number => typeof id === "number"),
        }}
        onClose={() => setFleetDrawerOperation(null)}
        onFleetSelected={(selection) => {
          setDriverId(String(selection.driverId));
          setVehicleId(String(selection.vehicleId));
          setSelectedFleet(selection);
          setFleetDrawerOperation(null);
          showToast.success("Flota seleccionada para el amparo.");
        }}
      />
    </section>
  );
}

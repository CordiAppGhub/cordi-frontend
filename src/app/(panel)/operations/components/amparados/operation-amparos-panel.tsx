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

interface Props {
  enabled: boolean;
}

interface AmparoGroup {
  exportOperation: AmparoSuggestionOperation;
  importOptions: (AmparoSuggestionOperation & {
    suggestion: AmparoSuggestion;
  })[];
}

const groupSuggestions = (suggestions: AmparoSuggestion[]): AmparoGroup[] => {
  const groups = new Map<number, AmparoGroup>();

  for (const suggestion of suggestions) {
    const exportId = suggestion.exportOperation.id;
    let group = groups.get(exportId);
    if (!group) {
      group = { exportOperation: suggestion.exportOperation, importOptions: [] };
      groups.set(exportId, group);
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
      vehicle.axles !== configuration.tractorAxles
    ) {
      issues.push(
        `operación #${operation.id}: cabezote de ${configuration.tractorAxles} ejes`,
      );
    }
    if (configuration?.requiresTrailer && !vehicle.currentTrailer) {
      issues.push(`operación #${operation.id}: requiere tráiler`);
    }
    if (
      configuration?.trailerAxles != null &&
      vehicle.currentTrailer?.axles !== configuration.trailerAxles
    ) {
      issues.push(
        `operación #${operation.id}: tráiler de ${configuration.trailerAxles} ejes`,
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
  const compatibleVehicleCount = selectedSuggestion
    ? (vehiclesQuery.data ?? []).filter(
        (vehicle) =>
          getAmparoAxleIssues(vehicle, selectedSuggestion).length === 0,
      ).length
    : 0;

  const handleConfirm = () => {
    if (!selectedSuggestion || selectedSuggestion.conflictingDrivers ||
        (!selectedSuggestion.hasAssignedDriver && !driverId) || !vehicleId ||
        !selectedVehicle || selectedVehicleIssues.length > 0) return;
    if (user?.role === "ANALISTA" && !agreementConfirmed) return;

    confirmMutation.mutate({
      exportOperationId: selectedSuggestion.exportOperation.id,
      importOperationId: selectedSuggestion.importOperation.id,
      ...(selectedSuggestion.hasAssignedDriver ? {} : { driverId: Number(driverId) }),
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
              compartir recursos.
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
            {groupedSuggestions.map(({ exportOperation, importOptions }) => (
              <li key={exportOperation.id}>
                <article className={styles.groupCard}>
                  <span className={styles.rowExport}>
                    Exportación #
                    {exportOperation.numeroPedido?.trim() || "Sin pedido"}
                  </span>
                  <div className={styles.suggestionMeta}>
                    <span className={styles.metaItem}>
                      <MapPin size={14} aria-hidden="true" />
                      {exportOperation.port?.name ?? "Puerto sin nombre"}
                    </span>
                    {exportOperation.isContainerized === true && (
                      <span className={styles.metaItem}>
                        <CalendarClock size={14} aria-hidden="true" />
                        {formatDestination(exportOperation.fechaCitaDestino)}
                      </span>
                    )}
                    <span>
                      Responsable: {exportOperation.analyst?.name || "No disponible"}
                    </span>
                    <span>
                      Conductor: {exportOperation.driver?.name || "No disponible"}
                    </span>
                    <span>
                      Vehículo: {exportOperation.vehicle?.plate || "No disponible"}
                    </span>
                  </div>
                  <details className={styles.groupDetails}>
                    <summary className={styles.groupSummary}>
                      <span>
                        {importOptions.length} {importOptions.length === 1
                          ? "opción de importación"
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
                              {option.isReturnAmparo ? "Devolución" : "Importación"}{" "}
                              #{option.numeroPedido?.trim() || "Sin pedido"}
                            </span>
                            <span>Responsable: {option.analyst?.name || "Sin responsable"}</span>
                          </div>
                          <button
                            type="button"
                            className={styles.acceptButton}
                            onClick={() => openConfirmation(option.suggestion)}
                            aria-label={`Seleccionar ${option.isReturnAmparo ? "devolución" : "importación"} ${option.numeroPedido?.trim() || `sin pedido, operación ${option.id}`} para la exportación ${exportOperation.numeroPedido?.trim() || `sin pedido, operación ${exportOperation.id}`}`}
                          >
                            Seleccionar amparo
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                </article>
              </li>
            ))}
          </ul>
        )
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      <SuperModal
        isOpen={Boolean(selectedSuggestion)}
        onClose={closeConfirmation}
        title="Confirmar amparo"
        width="520px"
      >
        {selectedSuggestion && (
          <div className={styles.modalContent}>
            <p className={styles.modalIntro}>Vas a relacionar estos pedidos:</p>

            <div className={styles.modalOperations}>
              <div
                className={`${styles.modalOperation} ${styles.exportOperation}`}
              >
                <p className={styles.operationType}>Exportación</p>
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
                  Puerto: {selectedSuggestion.exportOperation.port?.name ?? "—"}
                </p>
                {selectedSuggestion.exportOperation.isContainerized === true && (
                  <p className={styles.modalOperationId}>
                    Cita destino:{" "}
                    {formatDestination(
                      selectedSuggestion.exportOperation.fechaCitaDestino,
                    )}
                  </p>
                )}
              </div>
              <div
                className={`${styles.modalOperation} ${styles.importOperation}`}
              >
                <p className={styles.operationType}>
                  {selectedSuggestion.importOperation.isReturnAmparo
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
                  Puerto: {selectedSuggestion.importOperation.port?.name ?? "Por confirmar"}
                </p>
                {selectedSuggestion.importOperation.isContainerized === true && (
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
              Al aceptar, ambas operaciones compartirán conductor y vehículo.
              Si ya hay un conductor asignado, se conservará. La relación
              quedará registrada en la trazabilidad de ambas.
            </p>
            {selectedSuggestion.conflictingDrivers && (
              <p className={styles.panelError} role="alert">
                Las operaciones tienen conductores distintos. Coordina la reasignación antes de confirmar el amparo.
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

            <label className={styles.fieldLabel}>
              Conductor
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                disabled={selectedSuggestion.hasAssignedDriver || driversQuery.isLoading}
                className={styles.select}
              >
                <option value="">
                  {selectedSuggestion.hasAssignedDriver
                    ? "Se utilizará el conductor ya asignado"
                    : "Seleccionar conductor"}
                </option>
                {driverId && !(driversQuery.data ?? []).some((driver) => driver.isActive && String(driver.id) === driverId) && (
                  <option value={driverId}>
                    {selectedSuggestion.exportOperation.driver?.name ||
                      selectedSuggestion.importOperation.driver?.name ||
                      "Conductor asignado"}
                  </option>
                )}
                {(driversQuery.data ?? [])
                  .filter((d) => d.isActive)
                  .map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name || driver.cedula}
                    </option>
                  ))}
              </select>
              {selectedSuggestion.hasAssignedDriver && !selectedSuggestion.conflictingDrivers && (
                <span>El amparo conservará el conductor ya asignado a la operación.</span>
              )}
            </label>

            <label className={styles.fieldLabel}>
              Vehículo
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                disabled={vehiclesQuery.isLoading}
                className={styles.select}
              >
                <option value="">Seleccionar vehículo</option>
                {vehicleId && !(vehiclesQuery.data ?? []).some((vehicle) => String(vehicle.id) === vehicleId) && (
                  <option value={vehicleId}>
                    {selectedSuggestion.exportOperation.vehicle?.plate ||
                      selectedSuggestion.importOperation.vehicle?.plate ||
                      "Vehículo asignado"}
                  </option>
                )}
                {(vehiclesQuery.data ?? []).map((vehicle) => (
                  <option
                    key={vehicle.id}
                    value={vehicle.id}
                    disabled={
                      getAmparoAxleIssues(vehicle, selectedSuggestion).length > 0
                    }
                  >
                    {vehicle.plate} · Cabezote {vehicle.axles ?? "—"} ejes
                  </option>
                ))}
              </select>
              {selectedVehicleIssues.length > 0 ? (
                <span role="alert">
                  No compatible por ejes: {selectedVehicleIssues.join("; ")}.
                </span>
              ) : compatibleVehicleCount === 0 && !vehiclesQuery.isLoading ? (
                <span role="alert">
                  No hay vehículos con ejes compatibles para ambas operaciones.
                </span>
              ) : null}
            </label>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={closeConfirmation}
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
                  selectedSuggestion.conflictingDrivers ||
                  (!selectedSuggestion.hasAssignedDriver && !driverId) ||
                  !vehicleId ||
                  !selectedVehicle ||
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
    </section>
  );
}

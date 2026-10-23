"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Loader2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/use-auth.store";
import { useAmparosStore } from "@/store/use-amparos.store";
import { showToast } from "@/utils/alerts";
import { getUserFriendlyErrorMessage } from "@/utils/api-error";
import { SuperModal } from "@/components/organisms/modal/modal";
import styles from "./OperationAmparosPanel.module.css";
import { AmparoSuggestion } from "@/services/operation.service";
import { useAmparos } from "../../hooks/useAmparos";

interface Props {
  enabled: boolean;
}

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

export function OperationAmparosPanel({ enabled }: Props) {
  const user = useAuthStore((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const canConfirmAmparo = user?.role === "ADMIN" || user?.role === "ANALISTA";

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

  const handleConfirm = () => {
    if (!selectedSuggestion || !driverId || !vehicleId) return;
    if (user?.role === "ANALISTA" && !agreementConfirmed) return;

    confirmMutation.mutate({
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
        <p className={styles.panelMessage}>
          No hay amparos disponibles. Se muestran las importaciones del mismo
          puerto de una exportación con cita vigente y las devoluciones
          pendientes con exportaciones del mismo tipo de contenedor.
        </p>
      ) : (
        isOpen && (
          <ul className={styles.suggestionList}>
            {suggestions.map((suggestion) => (
              <li
                key={`${suggestion.exportOperation.id}-${suggestion.importOperation.id}`}
              >
                <button
                  type="button"
                  className={styles.suggestionRow}
                  onClick={() => openConfirmation(suggestion)}
                >
                  <span className={styles.rowPair}>
                    <span className={styles.rowExport}>
                      Exportación #{suggestion.exportOperation.id}
                    </span>
                    <ArrowRight size={15} aria-hidden="true" />
                    <span className={styles.rowImport}>
                      {suggestion.importOperation.isReturnAmparo
                        ? "Devolución"
                        : "Importación"}{" "}
                      #{suggestion.importOperation.id}
                    </span>
                  </span>
                  <span className={styles.metaItem}>
                    <MapPin size={14} aria-hidden="true" />{" "}
                    {suggestion.importOperation.isReturnAmparo
                      ? (suggestion.importOperation.port?.name ??
                        "Ubicación por confirmar")
                      : (suggestion.exportOperation.port?.name ??
                        "Puerto sin nombre")}
                  </span>
                  <span className={styles.metaItem}>
                    <CalendarClock size={14} aria-hidden="true" />{" "}
                    {formatDestination(
                      suggestion.exportOperation.fechaCitaDestino,
                    )}
                  </span>
                  <span className={styles.metaItem}>
                    Resp.: {suggestion.exportOperation.analyst?.name || "—"} /{" "}
                    {suggestion.importOperation.analyst?.name || "—"}
                  </span>
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
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
                <p className={styles.modalOperationId}>
                  Cita destino:{" "}
                  {formatDestination(
                    selectedSuggestion.exportOperation.fechaCitaDestino,
                  )}
                </p>
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
                <p className={styles.modalOperationId}>
                  Cita destino:{" "}
                  {formatDestination(
                    selectedSuggestion.importOperation.fechaCitaDestino,
                  )}
                </p>
              </div>
            </div>

            <p className={styles.modalDescription}>
              Al aceptar, se asignarán el conductor y el vehículo seleccionados
              a ambas operaciones. La relación quedará registrada en la
              trazabilidad de ambas.
            </p>

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
                disabled={driversQuery.isLoading}
                className={styles.select}
              >
                <option value="">Seleccionar conductor</option>
                {(driversQuery.data ?? [])
                  .filter((d) => d.isActive)
                  .map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name || driver.cedula}
                    </option>
                  ))}
              </select>
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
                {(vehiclesQuery.data ?? []).map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate}
                  </option>
                ))}
              </select>
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
                  !driverId ||
                  !vehicleId ||
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

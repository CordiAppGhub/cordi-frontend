"use client";

import React, { useState } from "react";
import styles from "./novedades.module.css";
import { Tabs } from "@/components/molecules/tabs/tabs";
import { useNovedades } from "@/hooks/ueNovedades";
import { TruckLoader } from "@/components/TruckLoader";
import { LiveClock } from "@/components/atoms/liveClock/LiveClock";
import { SuperModal } from "@/components/organisms/modal/modal";
import { NovedadResourceForm } from "../components/novedad-resource-form";
import { useQueryClient } from "@tanstack/react-query";
import { useLocations } from "@/app/(panel)/locations/hooks/useLocation";
import { operationService } from "@/services/operation.service";
import { showToast } from "@/utils/alerts";
import { NovedadItem, NOVEDAD_CATEGORY_LABELS } from "@/services/novedades.servies";
import { ResourceAbsencesPanel } from "../components/resource-absences-panel";

// Definición de las Tabs con íconos
const NOVEDADES_TABS = [
  { id: "PENDING", label: "Urgencias y Bloqueos", icon: "🚨" },
  { id: "IN_REVIEW", label: "En revisión", icon: "🛠️" },
  { id: "RESOLVED", label: "Historial Resueltas", icon: "✅" },
  { id: "TODAS", label: "Todas las Incidencias", icon: "🗂️" },
];

export function NovedadesPageView() {
  const queryClient = useQueryClient();
  const { locations } = useLocations();
  const {
    novedades,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    activeTarget,
    setActiveTarget,
    refresh,
    resolve,
    markInReview,
  } = useNovedades("PENDING");
  const [selectedForResolve, setSelectedForResolve] = useState<number | null>(
    null,
  );
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [destinationDrafts, setDestinationDrafts] = useState<
    Record<number, string>
  >({});
  const [appointmentDrafts, setAppointmentDrafts] = useState<
    Record<number, string>
  >({});

  const formatDateInput = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
  };

  const selectOcrDestination = (
    novedadId: number,
    suggestedName: string,
  ) => {
    const normalizedSuggestion = suggestedName.trim().toLocaleLowerCase("es");
    const matchingLocation = locations.find(
      (location) =>
        (location.isDepot || location.isPort) &&
        location.name.trim().toLocaleLowerCase("es") === normalizedSuggestion,
    );
    if (!matchingLocation) return;
    setDestinationDrafts((current) => ({
      ...current,
      [novedadId]: String(matchingLocation.id),
    }));
  };

  const saveDeviationDestination = async (novedad: NovedadItem) => {
    const operation = novedad.operation;
    if (!operation || !novedad.operationId) return;
    const destinationId = Number(
      destinationDrafts[novedad.id] ?? operation.nuevoDestinoId ?? "",
    );
    const appointment =
      appointmentDrafts[novedad.id] ??
      formatDateInput(operation.fechaCitaDesvio);
    if (!destinationId || !appointment) {
      showToast.error(
        "Selecciona el nuevo patio/puerto e indica la fecha y hora.",
      );
      return;
    }

    try {
      await operationService.updateOperation(novedad.operationId, {
        nuevoDestinoId: destinationId,
        fechaCitaDesvio: new Date(appointment).toISOString(),
      });
      showToast.success("Destino y cita de devolución actualizados.");
      await Promise.all([
        refresh(),
        queryClient.invalidateQueries({ queryKey: ["trafico"] }),
      ]);
    } catch (error: unknown) {
      showToast.error(error, "No se pudo actualizar el destino de devolución.");
    }
  };

  const handleResolveSubmit = async (id: number) => {
    if (!resolutionNotes.trim()) {
      alert("Debe ingresar las notas de resolución para liberar los recursos.");
      return;
    }
    const success = await resolve(id, resolutionNotes);
    if (success) {
      setSelectedForResolve(null);
      setResolutionNotes("");
      refresh();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Centro de Control de Novedades e Incidentes
          </h1>
          <p className={styles.subtitle}>
            Gestión de bloqueos operativos, fallas mecánicas e incapacidades.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: 0,
              background: "#1d4ed8",
              color: "white",
              fontWeight: 700,
            }}
          >
            + Novedad de personal o vehículo
          </button>
          <LiveClock onRefresh={refresh} isRefetching={isLoading} />
        </div>
      </div>

      <ResourceAbsencesPanel />

      <Tabs
        tabs={NOVEDADES_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <label
          htmlFor="novedad-target"
          style={{ fontWeight: 600, color: "#475569" }}
        >
          Recurso:
        </label>
        <select
          id="novedad-target"
          value={activeTarget}
          onChange={(event) => setActiveTarget(event.target.value)}
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            padding: "8px 12px",
            background: "white",
          }}
        >
          <option value="TODAS">Todos</option>
          <option value="OPERATION">Operación</option>
          <option value="DRIVER">Conductor</option>
          <option value="ANALYST">Analista</option>
          <option value="VEHICLE">Vehículo</option>
        </select>
      </div>

      {error && <div className={styles.errorAlert}>⚠️ {error}</div>}

      {isLoading ? (
        <TruckLoader variant="compact" message="Sincronizando incidencias..." />
      ) : novedades.length === 0 ? (
        <div className={styles.emptyState}>
          <span>🎉</span>
          <p>Excelente trabajo. No hay novedades en esta categoría.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {novedades.map((nov) => (
            <div
              key={nov.id}
              className={`${styles.card} ${styles[nov.severity.toLowerCase()]}`}
            >
              <div className={styles.cardHeader}>
                <div
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <span
                    className={`${styles.badge} ${styles[nov.severity.toLowerCase()]}`}
                  >
                    {nov.severity}
                  </span>
                  {nov.status !== "PENDING" && (
                    <span
                      style={{
                        fontSize: "0.65rem",
                        background:
                          nov.status === "RESOLVED" ? "#dcfce7" : "#dbeafe",
                        color:
                          nov.status === "RESOLVED" ? "#166534" : "#1e40af",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontWeight: "bold",
                      }}
                    >
                      {nov.status === "RESOLVED" ? "RESUELTO" : "EN REVISIÓN"}
                    </span>
                  )}
                </div>
                <span className={styles.targetTag}>
                  Afecta: {nov.target}
                  {nov.category ? ` · ${NOVEDAD_CATEGORY_LABELS[nov.category]}` : ""}
                  {nov.blocksAvailability && nov.status !== "RESOLVED" ? " · Bloquea disponibilidad" : ""}
                </span>
              </div>

              <p className={styles.description}>{nov.description}</p>

              <div className={styles.metaInfo}>
                {nov.vehicle && (
                  <div>
                    🚗 Vehículo: <strong>{nov.vehicle.plate}</strong>
                  </div>
                )}
                {nov.driver && (
                  <div>
                    👤 Conductor: <strong>{nov.driver.name}</strong>
                  </div>
                )}
                {nov.analyst && (
                  <div>
                    👤 Analista: <strong>{nov.analyst.name}</strong>
                  </div>
                )}
                {nov.operation && (
                  <div>
                    📦 Viaje:{" "}
                    <strong>
                      {nov.operation.type} (
                      {nov.operation.origen?.name || "Origen"})
                    </strong>
                  </div>
                )}
                {nov.operation?.containerStatus === "PENDIENTE_DEVOLUCION" && (
                  <div>
                    Contenedor:{" "}
                    <strong>
                      {nov.operation.containerType || "Tipo sin registrar"}
                    </strong>
                    {" · "}Pendiente de devolución
                  </div>
                )}
                <div className={styles.reporter}>
                  Reportado por: {nov.reportedBy?.name}
                </div>
              </div>

              {nov.operation?.containerStatus === "PENDIENTE_DEVOLUCION" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {nov.metadata?.comodatoOcr && (
                    <div
                      role="status"
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: "#eff6ff",
                        color: "#1e3a8a",
                      }}
                    >
                      <strong>Lectura IA del comodato (sugerencia)</strong>
                      {nov.metadata.comodatoOcr.legible ? (
                        <>
                          <p>
                            Destino escrito:{" "}
                            {nov.metadata.comodatoOcr.destino ||
                              "No identificado"}
                          </p>
                          {nov.metadata.comodatoOcr.fechaCita && (
                            <p>
                              Cita escrita:{" "}
                              {nov.metadata.comodatoOcr.fechaCita}
                            </p>
                          )}
                          {nov.metadata.comodatoOcr.numeroContenedor && (
                            <p>
                              Contenedor:{" "}
                              {nov.metadata.comodatoOcr.numeroContenedor}
                            </p>
                          )}
                          {nov.metadata.comodatoOcr.referencia && (
                            <p>
                              Referencia:{" "}
                              {nov.metadata.comodatoOcr.referencia}
                            </p>
                          )}
                          {nov.metadata.comodatoOcr.destino && (
                            <button
                              type="button"
                              onClick={() => {
                                const suggestedDestination =
                                  nov.metadata?.comodatoOcr?.destino;
                                if (suggestedDestination) {
                                  selectOcrDestination(
                                    nov.id,
                                    suggestedDestination,
                                  );
                                }
                              }}
                            >
                              Usar destino sugerido en el selector
                            </button>
                          )}
                        </>
                      ) : (
                        <p>
                          No se pudo leer el documento. Revisa manualmente el
                          comodato adjunto.
                        </p>
                      )}
                    </div>
                  )}
                  {nov.operation.evidences?.map((evidence) =>
                    evidence.url ? (
                      <a
                        key={evidence.id}
                        href={evidence.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver comodato del conductor
                      </a>
                    ) : null,
                  )}
                  <label>
                    Nuevo destino confirmado por naviera
                    <select
                      value={
                        destinationDrafts[nov.id] ??
                        String(nov.operation.nuevoDestinoId ?? "")
                      }
                      onChange={(event) =>
                        setDestinationDrafts((current) => ({
                          ...current,
                          [nov.id]: event.target.value,
                        }))
                      }
                      style={{ display: "block", width: "100%", padding: 8 }}
                    >
                      <option value="">Seleccionar patio o puerto</option>
                      {locations
                        .filter(
                          (location) => location.isDepot || location.isPort,
                        )
                        .map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Fecha y hora de nueva cita
                    <input
                      type="datetime-local"
                      value={
                        appointmentDrafts[nov.id] ??
                        formatDateInput(nov.operation.fechaCitaDesvio)
                      }
                      onChange={(event) =>
                        setAppointmentDrafts((current) => ({
                          ...current,
                          [nov.id]: event.target.value,
                        }))
                      }
                      style={{ display: "block", width: "100%", padding: 8 }}
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.resolveTriggerBtn}
                    onClick={() => void saveDeviationDestination(nov)}
                  >
                    Guardar destino y cita
                  </button>
                </div>
              )}

              {nov.status === "RESOLVED" ? (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    padding: "10px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                  }}
                >
                  <strong style={{ color: "#166534" }}>
                    Solución ({nov.resolvedBy?.name}):
                  </strong>
                  <p style={{ margin: "4px 0 0 0", color: "#15803d" }}>
                    {nov.resolutionNotes}
                  </p>
                </div>
              ) : nov.status === "PENDING" ? (
                <button
                  onClick={() => void markInReview(nov.id)}
                  className={styles.resolveTriggerBtn}
                >
                  Tomar para revisión
                </button>
              ) : selectedForResolve === nov.id ? (
                <div className={styles.resolveBox}>
                  <textarea
                    placeholder="Escriba cómo se solucionó (Ej. Se reparó alternador en taller)..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className={styles.textarea}
                  />
                  <div className={styles.resolveActions}>
                    <button
                      onClick={() => setSelectedForResolve(null)}
                      className={styles.cancelBtn}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleResolveSubmit(nov.id)}
                      className={styles.confirmResolveBtn}
                    >
                      Cerrar y Liberar Recursos
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedForResolve(nov.id)}
                  className={styles.resolveTriggerBtn}
                >
                  Resolver novedad 🔓
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <SuperModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Registrar novedad de personal o vehículo"
        width="600px"
      >
        <NovedadResourceForm
          onCancel={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            setActiveTab("PENDING");
            setActiveTarget("TODAS");
            void queryClient.invalidateQueries({ queryKey: ["novedades"] });
          }}
        />
      </SuperModal>
    </div>
  );
}

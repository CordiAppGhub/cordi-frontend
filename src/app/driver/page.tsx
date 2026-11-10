// src/app/driver/page.tsx
"use client";

import React, { useState, useRef } from "react";
import { useDriverPortal } from "@/hooks/use-driverPortal";
import { TruckLoader } from "@/components/TruckLoader";
import styles from "./driver.module.css";
import { Button } from "@/components/atoms/button/button";
import { Select } from "@/components/atoms/select/select";
import { SuperModal } from "@/components/organisms/modal/modal";
import {
  Operation,
  TrailerDestinationType,
} from "@/types/driver-portal.types";
import { DriverHeaderNav } from "./components/DriverHeaderNav";
import { DriverProfile } from "./components/DriverProfile";
import { DriverAuthSection } from "./views/DriverAuthSection";
import { HistoryTab } from "./components/HistoryTab";
import { DriverNovedadesTab } from "./components/DriverNovedadesTab";
import type { DriverTab } from "./components/DriverHeaderNav";
import { CurrentTripTab } from "./components/CurrentTripTab";
import { OperationDetailsCard } from "./components/operation-details-card";
import Swal from "sweetalert2";
import { getUserFriendlyErrorMessage } from "@/utils/api-error";
import { compressFiles } from "@/utils/image-compressor";

function evidenceTypeLabel(type?: string): string {
  switch (type) {
    case "INGRESO_PUERTO":
      return "ARIN de ingreso a puerto";
    case "SELLOS_CONTENEDOR":
      return "Fotos de los sellos";
    case "SALIDA_PUERTO":
      return "ARIN de salida del puerto";
    case "Soporte de cierre":
      return "Soporte de cierre";
    case "COMODATO":
      return "Documento de comodato";
    case "FOTO_CARGUE":
      return "Foto cargando el contenedor";
    case "EVIDENCIA_CARGA_SUELTA":
      return "Fotos de frente, atrás y ambos lados de la carga";
    case "FOTOS_LLEGADA_CARGA_SUELTA":
      return "Fotos de la carga al llegar al cliente";
    case "FOTOS_DESCARGUE_CARGA_SUELTA":
      return "Fotos del descargue de la carga";
    case "ANOMALY_PHOTO":
      return "Fotos de anomalías en la mercancía";
    case "DELIVERY_DOC":
      return "Soporte de descargado y devolución";
    case "TIRILLA_EIR":
      return "Tirilla de Devolución (EIR)";
    default:
      return "Soporte del viaje";
  }
}

export default function DriverPortalPage() {
  const {
    driver,
    loading,
    uploading,
    processingState,
    isAuthenticated,
    authStep,
    setAuthStep,
    authError,
    requestOtp,
    verifyOtp,
    logout,
    uploadEvidence,
    reportDeviation,
    updateTravelState,
    updateContainerStatus,
    updateCargoStatus,
    completeStop,
    updateSealNumber,
    scanPlate,
    scanContainer,
    verifyFleetPlates,
    reportTrailerLocation,
    isUncouplingTrailer,
    isVerifyingFleetPlates,
    history = [],
    loadingHistory,
  } = useDriverPortal();

  const [cedulaInput, setCedulaInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(
    null,
  );
  const [selectedOperationId, setSelectedOperationId] = useState<number | null>(
    null,
  );
  const [modalType, setModalType] = useState<
    | "DETAILS"
    | "OCR"
    | "CLOSING"
    | "EVIDENCE"
    | "DEVIATION"
    | "PLATE_VERIFICATION"
  >("DETAILS");
  const [evidenceTypes, setEvidenceTypes] = useState<string[]>([]);
  const [evidenceIndex, setEvidenceIndex] = useState(0);
  const [evidenceNextState, setEvidenceNextState] = useState<
    string | undefined
  >();
  const [ocrStep, setOcrStep] = useState<"PLATE" | "CONTAINER">("PLATE");
  const [cabPlateImage, setCabPlateImage] = useState<File | null>(null);
  const [trailerPlateImage, setTrailerPlateImage] = useState<File | null>(null);
  const [deviationReason, setDeviationReason] = useState("AVERIA_NO_APTO");
  const [activeTab, setActiveTab] = useState<DriverTab>("current");
  const [trailerLocationReport, setTrailerLocationReport] = useState<{
    operationId: number;
    destinationType: TrailerDestinationType;
  } | null>(null);
  const [selectedOwnYardId, setSelectedOwnYardId] = useState("");
  const [isConfirmingTrailerLocation, setIsConfirmingTrailerLocation] =
    useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const assignedOperations: Operation[] = driver?.assignedOperations || [];
  const firstSuggestedOperation =
    assignedOperations.find((operation) => operation.status === "EN_CURSO") ||
    assignedOperations.find((operation) => operation.isActive) ||
    assignedOperations[0];

  const handleCedulaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cedulaInput.trim()) await requestOtp(cedulaInput.trim());
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.trim() && cedulaInput.trim()) {
      await verifyOtp(cedulaInput.trim(), otpInput.trim());
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files ?? []);
    if (rawFiles.length === 0) return;

    if (!selectedOperation) {
      Swal.fire({
        title: "⚠️ Operación no encontrada",
        text: "No hay una operación activa seleccionada.",
        icon: "warning",
      });
      return;
    }

    try {
      const files = await compressFiles(rawFiles);
      const file = files[0];
      if (!file) return;
      if (modalType === "OCR") {
        if (ocrStep === "PLATE") {
          const result = await scanPlate(selectedOperation.id, file);
          if (result?.legible && result?.codigo) {
            setOcrStep("CONTAINER");
            Swal.fire({
              title: "✅ Placa detectada",
              text: `${result.codigo}\n\nAhora selecciona o toma la foto del contenedor.`,
              icon: "success",
            });
          } else {
            Swal.fire({
              title: "⚠️ No legible",
              text: "No se pudo leer la placa. Intenta con una imagen más clara.",
              icon: "warning",
            });
          }
        } else {
          const result = await scanContainer(selectedOperation.id, file);
          if (result?.legible && result?.codigo) {
            Swal.fire({
              title: "✅ Contenedor validado",
              text: result.codigo,
              icon: "success",
            });
            setIsModalOpen(false);
          } else {
            Swal.fire({
              title: "⚠️ No detectado",
              text: "No se detectó un código válido. Intenta con otra imagen.",
              icon: "warning",
            });
          }
        }
      } else if (modalType === "CLOSING") {
        const requiresEir =
          selectedOperation.type === "IMPORTACION" ||
          selectedOperation.type === "DEVOLUCION_VACIO";
        await uploadEvidence(
          selectedOperation.id,
          file,
          requiresEir ? "TIRILLA_EIR" : undefined,
        );
        await updateTravelState(selectedOperation.id, "FINALIZADO");
        setIsModalOpen(false);
      } else if (modalType === "EVIDENCE") {
        const evidenceType = evidenceTypes[evidenceIndex];
        if (!evidenceType) {
          throw new Error("No se encontró el tipo de soporte solicitado.");
        }
        await uploadEvidence(selectedOperation.id, files, evidenceType);
        const nextIndex = evidenceIndex + 1;
        if (nextIndex < evidenceTypes.length) {
          setEvidenceIndex(nextIndex);
        } else {
          if (evidenceNextState) {
            await updateTravelState(selectedOperation.id, evidenceNextState);
          }
          setIsModalOpen(false);
        }
      } else if (modalType === "DEVIATION") {
        if (deviationReason !== "AVERIA_NO_APTO") {
          throw new Error("Selecciona un motivo de desvío válido.");
        }
        await reportDeviation(selectedOperation.id, file);
        setIsModalOpen(false);
      }
    } catch (err: unknown) {
      // Axios/Nest 400 (p. ej. getClosingMissingRequirements) no debe quedar silencioso
      const message = getUserFriendlyErrorMessage(
        err,
        "Ocurrió un error al procesar la solicitud. Revisa el mensaje del servidor.",
      );
      await Swal.fire({
        title: "No se pudo completar",
        text: message,
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleVerifyFleetPlates = async () => {
    if (!selectedOperation || !cabPlateImage || !trailerPlateImage) {
      await Swal.fire({
        title: "Faltan fotos",
        text: "Adjunta las fotos de la placa del cabezote y del tráiler.",
        icon: "warning",
      });
      return;
    }

    try {
      const [cabFiles, trailerFiles] = await Promise.all([
        compressFiles([cabPlateImage]),
        compressFiles([trailerPlateImage]),
      ]);
      const cabImage = cabFiles[0];
      const trailerImage = trailerFiles[0];
      if (!cabImage || !trailerImage) {
        throw new Error("No se pudieron preparar ambas imágenes.");
      }

      const result = await verifyFleetPlates(
        selectedOperation.id,
        cabImage,
        trailerImage,
      );
      await Swal.fire({
        title: "Flota verificada",
        text: `Cabezote: ${result.cabPlate} · Tráiler: ${result.trailerPlate}`,
        icon: "success",
      });
      setCabPlateImage(null);
      setTrailerPlateImage(null);
      setIsModalOpen(false);
    } catch (error: unknown) {
      await Swal.fire({
        title: "No se pudieron verificar las placas",
        text: getUserFriendlyErrorMessage(
          error,
          "Ocurrió un error al analizar las placas. Inténtalo de nuevo.",
        ),
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  const handleOpenTrailerLocationReport = (
    operationId: number,
    destinationType: TrailerDestinationType,
  ) => {
    setSelectedOwnYardId("");
    setTrailerLocationReport({ operationId, destinationType });
  };

  const handleConfirmTrailerLocation = async () => {
    if (!trailerLocationReport) return;
    const operation = assignedOperations.find(
      (item) => item.id === trailerLocationReport.operationId,
    );
    if (!operation?.trailer) {
      await Swal.fire({
        title: "Tráiler no encontrado",
        text: "Actualiza el portal e inténtalo nuevamente.",
        icon: "error",
      });
      return;
    }
    if (isConfirmingTrailerLocation || isUncouplingTrailer) return;

    const ownYard = operation.trailerOwnYards?.find(
      (location) => String(location.id) === selectedOwnYardId,
    );
    const clientLocation = operation.trailerClientLocation;
    if (
      trailerLocationReport.destinationType === "OWN_YARD" &&
      !ownYard
    ) {
      return;
    }
    if (
      trailerLocationReport.destinationType === "CLIENT" &&
      (!clientLocation || !operation.clientId)
    ) {
      return;
    }

    setIsConfirmingTrailerLocation(true);
    try {
      let coordinates: { lat?: number; lng?: number } = {};
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
              });
            },
          );
          coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        } catch {
          const continueWithoutGps = await Swal.fire({
            title: "No se obtuvo la ubicación GPS",
            text: "Puedes continuar con la ubicación seleccionada; el reporte se guardará sin coordenadas.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Continuar sin GPS",
            cancelButtonText: "Volver",
            confirmButtonColor: "#c2410c",
          });
          if (!continueWithoutGps.isConfirmed) return;
        }
      } else {
        const continueWithoutGps = await Swal.fire({
          title: "GPS no disponible",
          text: "Este navegador no permite obtener la ubicación. Puedes continuar sin coordenadas GPS.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Continuar sin GPS",
          cancelButtonText: "Volver",
          confirmButtonColor: "#c2410c",
        });
        if (!continueWithoutGps.isConfirmed) return;
      }

      await reportTrailerLocation(operation.id, {
        destinationType: trailerLocationReport.destinationType,
        ...(trailerLocationReport.destinationType === "CLIENT"
          ? { clientId: operation.clientId ?? undefined }
          : { ownYardId: ownYard?.id }),
        ...coordinates,
      });
      setTrailerLocationReport(null);
    } catch (error: unknown) {
      await Swal.fire({
        title: "No se pudo reportar la ubicación",
        text: getUserFriendlyErrorMessage(
          error,
          "Ocurrió un error al guardar la ubicación del tráiler.",
        ),
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setIsConfirmingTrailerLocation(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <DriverAuthSection
        authStep={authStep}
        authError={authError}
        cedulaInput={cedulaInput}
        setCedulaInput={setCedulaInput}
        otpInput={otpInput}
        setOtpInput={setOtpInput}
        onCedulaSubmit={handleCedulaSubmit}
        onOtpSubmit={handleOtpSubmit}
        onBackToCedula={() => setAuthStep("CEDULA")}
      />
    );
  }

  if (loading || !driver) {
    return <TruckLoader variant="page" message="Cargando tus datos..." />;
  }

  const activeOperation =
    assignedOperations.find(
      (operation) => operation.id === selectedOperationId,
    ) || firstSuggestedOperation;
  const vehiculo = activeOperation?.vehicle || driver.drivenVehicles?.[0];
  const trailerReportOperation = trailerLocationReport
    ? assignedOperations.find(
        (operation) => operation.id === trailerLocationReport.operationId,
      )
    : undefined;
  const trailerReportOwnYard = trailerReportOperation?.trailerOwnYards?.find(
    (location) => String(location.id) === selectedOwnYardId,
  );

  return (
    <div className={styles.dashboardContainer}>
      <DriverHeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={history.length}
        onLogout={logout}
      />

      {activeTab === "current" ? (
        <CurrentTripTab
          driver={driver}
          assignedOperations={assignedOperations}
          activeOperation={activeOperation}
          onSelectOperation={setSelectedOperationId}
          vehiculo={vehiculo}
          processingState={processingState}
          onUpdateState={updateTravelState}
          onUpdateContainerStatus={updateContainerStatus}
          onUpdateCargoStatus={updateCargoStatus}
          onCompleteStop={completeStop}
          onUpdateSealNumber={updateSealNumber}
          onReportDeviation={() => {
            setSelectedOperation(activeOperation || null);
            setDeviationReason("AVERIA_NO_APTO");
            setModalType("DEVIATION");
            setIsModalOpen(true);
          }}
          onOpenOcrModal={() => {
            const operation = activeOperation || null;
            setSelectedOperation(operation);
            setOcrStep("CONTAINER");
            setModalType("OCR");
            setIsModalOpen(true);
          }}
          onOpenPlateVerification={() => {
            setSelectedOperation(activeOperation || null);
            setCabPlateImage(null);
            setTrailerPlateImage(null);
            setModalType("PLATE_VERIFICATION");
            setIsModalOpen(true);
          }}
          onOpenEvidenceModal={(operationId, requestedTypes, nextState) => {
            const operation =
              assignedOperations.find((item) => item.id === operationId) ||
              null;
            setSelectedOperation(operation);
            setEvidenceTypes(requestedTypes);
            setEvidenceIndex(0);
            setEvidenceNextState(nextState);
            setModalType("EVIDENCE");
            setIsModalOpen(true);
          }}
          onOpenClosingModal={() => {
            setSelectedOperation(activeOperation || null);
            setModalType("CLOSING");
            setIsModalOpen(true);
          }}
          onOpenDetailsModal={() => {
            if (activeOperation) {
              setSelectedOperation(activeOperation);
              setModalType("DETAILS");
              setIsModalOpen(true);
            }
          }}
          onReportTrailerLocation={(operationId, destinationType) =>
            handleOpenTrailerLocationReport(operationId, destinationType)
          }
          isUncouplingTrailer={isUncouplingTrailer}
        />
      ) : activeTab === "history" ? (
        <HistoryTab history={history} loadingHistory={loadingHistory} />
      ) : activeTab === "novedades" ? (
        <DriverNovedadesTab
          operations={assignedOperations}
          vehicles={driver.drivenVehicles}
        />
      ) : (
        <DriverProfile driver={driver} />
      )}

      <SuperModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalType === "OCR"
            ? "📸 Escáner de IA"
            : modalType === "PLATE_VERIFICATION"
              ? "Verificar Placas de la Flota"
            : modalType === "EVIDENCE"
              ? `📸 ${evidenceTypeLabel(evidenceTypes[evidenceIndex])}`
              : modalType === "CLOSING"
                ? "✅ Subir Soporte"
                : modalType === "DEVIATION"
                  ? "⚠️ Reportar desvío"
                  : `Detalle #${selectedOperation?.id || ""}`
        }
      >
        {selectedOperation && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {modalType === "DETAILS" && (
              <OperationDetailsCard operation={selectedOperation} />
            )}
            {modalType === "PLATE_VERIFICATION" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <p style={{ margin: 0 }}>
                  Las placas deben coincidir con la asignación de esta
                  operación. Cabezote esperado:{" "}
                  <strong>{selectedOperation.vehicle?.plate || "No asignado"}</strong>
                  {" · "}Tráiler esperado:{" "}
                  <strong>{selectedOperation.trailer?.plate || "No asignado"}</strong>
                </p>
                <label style={{ display: "grid", gap: 6 }}>
                  Foto Placa Cabezote
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) =>
                      setCabPlateImage(event.target.files?.[0] ?? null)
                    }
                    disabled={isVerifyingFleetPlates}
                    required
                  />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  Foto Placa Tráiler
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) =>
                      setTrailerPlateImage(event.target.files?.[0] ?? null)
                    }
                    disabled={isVerifyingFleetPlates}
                    required
                  />
                </label>
                <Button
                  type="button"
                  onClick={() => void handleVerifyFleetPlates()}
                  isLoading={isVerifyingFleetPlates}
                  disabled={
                    !cabPlateImage ||
                    !trailerPlateImage ||
                    isVerifyingFleetPlates
                  }
                >
                  {isVerifyingFleetPlates
                    ? "Analizando placas con IA..."
                    : "Verificar placas"}
                </Button>
              </div>
            )}
            {modalType !== "DETAILS" &&
              modalType !== "PLATE_VERIFICATION" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {modalType === "OCR" && (
                  <div
                    style={{
                      backgroundColor: "#f0f9ff",
                      padding: "10px",
                      borderRadius: "8px",
                      borderLeft: "4px solid #0ea5e9",
                    }}
                  >
                    <p
                      style={{ margin: 0, fontWeight: "500", color: "#0369a1" }}
                    >
                      {ocrStep === "PLATE"
                        ? "Paso 1: Toma una foto de la PLACA del camión."
                        : "Paso 2: Toma una foto clara de las puertas del CONTENEDOR."}
                    </p>
                  </div>
                )}
                {modalType === "DEVIATION" && (
                  <label
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    Motivo del desvío
                    <Select
                      value={deviationReason}
                      onChange={(event) =>
                        setDeviationReason(event.target.value)
                      }
                      disabled={processingState}
                    >
                      <option value="AVERIA_NO_APTO">Avería / No apto</option>
                    </Select>
                    <span>
                      Adjunta una foto clara del comodato entregado por el
                      patio.
                    </span>
                  </label>
                )}
                {modalType === "CLOSING" &&
                  (selectedOperation.type === "IMPORTACION" ||
                    selectedOperation.type === "DEVOLUCION_VACIO") && (
                    <p role="note">
                      Para finalizar, adjunta la Tirilla de Devolución (EIR)
                      emitida por el puerto o patio.
                    </p>
                  )}
                {modalType === "EVIDENCE" && (
                  <p>
                    {evidenceTypes[evidenceIndex] === "EVIDENCIA_CARGA_SUELTA"
                      ? "Selecciona cuatro fotos: frente, atrás y ambos lados de la carga. "
                      : evidenceTypes[evidenceIndex] ===
                          "FOTOS_LLEGADA_CARGA_SUELTA"
                        ? "Al llegar al cliente, selecciona al menos dos fotos del estado de la carga. "
                        : evidenceTypes[evidenceIndex] ===
                            "FOTOS_DESCARGUE_CARGA_SUELTA"
                          ? "Selecciona al menos dos fotos mientras descargan el producto. "
                          : evidenceTypes[evidenceIndex] === "ANOMALY_PHOTO"
                            ? "Puedes seleccionar más de cuatro fotos de las anomalías: "
                            : evidenceTypes[evidenceIndex] === "DELIVERY_DOC"
                              ? "Adjunta el soporte de descargado y devolución (imagen o PDF): "
                              : "Adjunta una foto o documento claro: "}
                    <strong>
                      {evidenceTypeLabel(evidenceTypes[evidenceIndex])}
                    </strong>
                    {evidenceTypes.length > 1 &&
                      ` (${evidenceIndex + 1} de ${evidenceTypes.length})`}
                  </p>
                )}

                {/* 
                  El atributo "capture" ha sido removido aquí para que funcione 
                  perfectamente el explorador de archivos en PC 
                */}
                <input
                  type="file"
                  accept={
                    modalType === "OCR" ||
                    (modalType === "EVIDENCE" &&
                      [
                        "EVIDENCIA_CARGA_SUELTA",
                        "FOTOS_LLEGADA_CARGA_SUELTA",
                        "FOTOS_DESCARGUE_CARGA_SUELTA",
                        "ANOMALY_PHOTO",
                      ].includes(evidenceTypes[evidenceIndex]))
                      ? "image/*"
                      : "image/*,application/pdf"
                  }
                  multiple={
                    modalType === "EVIDENCE" &&
                    evidenceTypes[evidenceIndex] !== "TIRILLA_EIR"
                  }
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                <Button
                  variant="primary"
                  onClick={() => {
                    // Limpia el input antes de abrirlo para que funcione si seleccionas
                    // la misma foto 2 veces seguidas en PC.
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    fileInputRef.current?.click();
                  }}
                  disabled={uploading || processingState}
                >
                  {uploading || processingState
                    ? "Procesando..."
                    : modalType === "EVIDENCE"
                      ? "📎 Seleccionar archivo / Tomar foto"
                      : "📸 Seleccionar imagen / Tomar foto"}
                </Button>
              </div>
            )}
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        )}
      </SuperModal>
      <SuperModal
        isOpen={trailerLocationReport !== null}
        onClose={() => {
          if (!isConfirmingTrailerLocation && !isUncouplingTrailer) {
            setTrailerLocationReport(null);
          }
        }}
        title={
          trailerLocationReport?.destinationType === "CLIENT"
            ? "Confirmar desenganche en Cliente"
            : "Confirmar entrega en Patio Propio"
        }
        width="520px"
      >
        {trailerReportOperation?.trailer && trailerLocationReport && (
          <div className={styles.trailerLocationSummary}>
            {trailerLocationReport.destinationType === "CLIENT" ? (
              <>
                <p>
                  ¿Confirmas que el tráiler{" "}
                  <strong>{trailerReportOperation.trailer.plate}</strong> ha
                  sido desenganchado en las instalaciones de{" "}
                  <strong>
                    {trailerReportOperation.trailerClientLocation?.clientName}
                  </strong>
                  {" — "}
                  {trailerReportOperation.trailerClientLocation?.name}
                  {trailerReportOperation.trailerClientLocation?.address
                    ? ` — ${trailerReportOperation.trailerClientLocation.address}`
                    : ""}
                  ?
                </p>
              </>
            ) : (
              <>
                <label className={styles.trailerLocationSelect}>
                  Patio propio de destino
                  <Select
                    value={selectedOwnYardId}
                    onChange={(event) =>
                      setSelectedOwnYardId(event.target.value)
                    }
                    options={[
                      { value: "", label: "Selecciona un patio propio" },
                      ...(trailerReportOperation.trailerOwnYards ?? []).map(
                        (location) => ({
                          value: location.id,
                          label: location.name,
                        }),
                      ),
                    ]}
                  />
                </label>
                <p>
                  ¿Confirmas que el tráiler{" "}
                  <strong>{trailerReportOperation.trailer.plate}</strong> se
                  dejará en el patio propio{" "}
                  <strong>{trailerReportOwnYard?.name || "seleccionado"}</strong>
                  {trailerReportOwnYard?.address
                    ? ` — ${trailerReportOwnYard.address}`
                    : ""}
                  ?
                </p>
              </>
            )}
            <p>Se guardará la ubicación GPS cuando esté disponible.</p>
            <div className={styles.trailerLocationModalActions}>
              <Button
                variant="secondary"
                onClick={() => setTrailerLocationReport(null)}
                disabled={isConfirmingTrailerLocation || isUncouplingTrailer}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => void handleConfirmTrailerLocation()}
                isLoading={isConfirmingTrailerLocation || isUncouplingTrailer}
                disabled={
                  isConfirmingTrailerLocation ||
                  isUncouplingTrailer ||
                  (trailerLocationReport.destinationType === "OWN_YARD" &&
                    !trailerReportOwnYard)
                }
              >
                Confirmar desenganche
              </Button>
            </div>
          </div>
        )}
      </SuperModal>
    </div>
  );
}

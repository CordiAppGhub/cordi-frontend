// src/app/driver/page.tsx
"use client";

import React, { useState, useRef } from "react";
import { useDriverPortal } from "@/hooks/use-driverPortal";
import { TruckLoader } from "@/components/TruckLoader";
import styles from "./driver.module.css";
import { Button } from "@/components/atoms/button/button";
import { SuperModal } from "@/components/organisms/modal/modal";
import { Operation } from "@/types/driver-portal.types";
import { DriverHeaderNav } from "./components/DriverHeaderNav";
import { DriverProfile } from "./components/DriverProfile";
import { DriverAuthSection } from "./views/DriverAuthSection";
import { HistoryTab } from "./components/HistoryTab";
import { DriverNovedadesTab } from "./components/DriverNovedadesTab";
import type { DriverTab } from "./components/DriverHeaderNav";
import { CurrentTripTab } from "./components/CurrentTripTab";
import Swal from "sweetalert2";
import { getUserFriendlyErrorMessage } from "@/utils/api-error";

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
    scanPlate,
    scanContainer,
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
    "DETAILS" | "OCR" | "CLOSING" | "EVIDENCE" | "DEVIATION"
  >("DETAILS");
  const [evidenceTypes, setEvidenceTypes] = useState<string[]>([]);
  const [evidenceIndex, setEvidenceIndex] = useState(0);
  const [evidenceNextState, setEvidenceNextState] = useState<string | undefined>();
  const [ocrStep, setOcrStep] = useState<"PLATE" | "CONTAINER">("PLATE");
  const [deviationReason, setDeviationReason] = useState("AVERIA_NO_APTO");
  const [activeTab, setActiveTab] = useState<DriverTab>("current");
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
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedOperation) {
      Swal.fire({
        title: "⚠️ Operación no encontrada",
        text: "No hay una operación activa seleccionada.",
        icon: "warning",
      });
      return;
    }

    try {
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
        await uploadEvidence(selectedOperation.id, file);
        await updateTravelState(selectedOperation.id, "FINALIZADO");
        setIsModalOpen(false);
      } else if (modalType === "EVIDENCE") {
        const evidenceType = evidenceTypes[evidenceIndex];
        if (!evidenceType) {
          throw new Error("No se encontró el tipo de soporte solicitado.");
        }
        await uploadEvidence(selectedOperation.id, file, evidenceType);
        const nextIndex = evidenceIndex + 1;
        if (nextIndex < evidenceTypes.length) {
          setEvidenceIndex(nextIndex);
        } else {
          if (evidenceNextState) {
            await updateTravelState(
              selectedOperation.id,
              evidenceNextState,
            );
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
          onReportDeviation={() => {
            setSelectedOperation(activeOperation || null);
            setDeviationReason("AVERIA_NO_APTO");
            setModalType("DEVIATION");
            setIsModalOpen(true);
          }}
          onOpenOcrModal={() => {
            const operation = activeOperation || null;
            setSelectedOperation(operation);
            
            // Si la operación ya tiene placaIA, pasamos directo al contenedor. Si no, pedimos placa primero.
            setOcrStep(operation?.placaIA ? "CONTAINER" : "PLATE");
            setModalType("OCR");
            setIsModalOpen(true);
          }}
          onOpenEvidenceModal={(operationId, requestedTypes, nextState) => {
            const operation =
              assignedOperations.find((item) => item.id === operationId) || null;
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
        />
      ) : activeTab === "history" ? (
        <HistoryTab history={history} loadingHistory={loadingHistory} />
      ) : activeTab === "novedades" ? (
        <DriverNovedadesTab />
      ) : (
        <DriverProfile driver={driver} />
      )}

      <SuperModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalType === "OCR"
            ? "📸 Escáner de IA"
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
            {modalType !== "DETAILS" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {modalType === "OCR" && (
                  <div style={{ backgroundColor: "#f0f9ff", padding: "10px", borderRadius: "8px", borderLeft: "4px solid #0ea5e9" }}>
                    <p style={{ margin: 0, fontWeight: "500", color: "#0369a1" }}>
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
                    <select
                      value={deviationReason}
                      onChange={(event) =>
                        setDeviationReason(event.target.value)
                      }
                      disabled={processingState}
                    >
                      <option value="AVERIA_NO_APTO">Avería / No apto</option>
                    </select>
                    <span>
                      Adjunta una foto clara del comodato entregado por el
                      patio.
                    </span>
                  </label>
                )}
                {modalType === "EVIDENCE" && (
                  <p>
                    Adjunta una foto clara:{" "}
                    <strong>{evidenceTypeLabel(evidenceTypes[evidenceIndex])}</strong>
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
                  accept="image/*"
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
                    : "📸 Seleccionar Imagen / Tomar Foto"}
                </Button>
              </div>
            )}
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        )}
      </SuperModal>
    </div>
  );
}
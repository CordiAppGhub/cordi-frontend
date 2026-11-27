// src/app/driver/page.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDriverAuth } from "@/providers/authDriverProvider";
import { TruckLoader } from "@/components/TruckLoader";
import styles from "./driver.module.css";
import { Button } from "@/components/atoms/button/button";
import { Select } from "@/components/atoms/select/select";
import { SuperModal } from "@/components/organisms/modal/modal";
import type {
  Operation,
  OperationContainerStatus,
  DriverTrailerOption,
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
import { ReportExtraModal } from "./components/ReportExtraModal";
import { showAlert } from "@/utils/alerts";
import { getUserFriendlyErrorMessage } from "@/utils/api-error";
import { compressFiles } from "@/utils/image-compressor";
import { formatEvidenceTypeLabel } from "@/utils/format-labels";
import { SealAndClosureModal } from "./components/workflow/components/SealAndClosureModal";
import { TrailerCouplingSelector } from "./components/TrailerCouplingSelector";

type PairedAmparoPreview = {
  id: number;
  type: string;
  status: string;
  estadoViaje: string | null;
  numeroPedido: string | null;
  containerNumber: string | null;
  containerType: string | null;
  containerStatus: string | null;
  scheduledAt: string | null;
  clientName: string;
  origenName: string;
  destinoName: string;
};

type DriverOperation = Operation & {
  isAmparado?: boolean;
  amparoExportOperationId?: number | null;
  amparoExportFinished?: boolean | null;
  pairedAmparoOperation?: PairedAmparoPreview | null;
};

type PendingEvidenceFile = {
  file: File;
  previewUrl: string | null;
};

async function compressOcrPhoto(file: File): Promise<File> {
  const image = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  try {
    const scale = Math.min(1, 1024 / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo procesar la imagen OCR.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error("No se pudo comprimir la imagen OCR.")),
        "image/jpeg",
        0.75,
      );
    });
    const fileName = file.name.replace(/\.[^/.]+$/, "") || "ocr-photo";
    return new File([blob], `${fileName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    image.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}

export default function DriverPortalPage() {
  const queryClient = useQueryClient();
  const {
    driver,
    loading,
    uploading,
    processingState,
    isAuthenticated,
    authStep,
    setAuthStep,
    authError,
    authNotice,
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
  } = useDriverAuth();

  const [cedulaInput, setCedulaInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(
    null,
  );
  const [selectedOperationId, setSelectedOperationId] = useState<number | null>(
    null,
  );
  const [extraReportOperationId, setExtraReportOperationId] = useState<number | null>(
    null,
  );
  const [modalType, setModalType] = useState<
    | "DETAILS"
    | "OCR"
    | "CLOSING"
    | "EVIDENCE"
    | "DEVIATION"
    | "PLATE_VERIFICATION"
    | "EXPORT_SEAL"
  >("DETAILS");
  const [evidenceTypes, setEvidenceTypes] = useState<string[]>([]);
  const [evidenceIndex, setEvidenceIndex] = useState(0);
  const [evidenceNextState, setEvidenceNextState] = useState<
    string | undefined
  >();
  const [evidenceBeforeState, setEvidenceBeforeState] = useState<
    string | undefined
  >();
  const [pendingContainerStatus, setPendingContainerStatus] = useState<
    OperationContainerStatus | undefined
  >();
  const [ocrStep, setOcrStep] = useState<"PLATE" | "CONTAINER">("PLATE");
  const [ocrContainerPhoto, setOcrContainerPhoto] = useState<File | null>(null);
  const [ocrFallback, setOcrFallback] = useState(false);
  const [manualContainerNumber, setManualContainerNumber] = useState("");
  const [cabPlateImage, setCabPlateImage] = useState<File | null>(null);
  const [trailerPlateImage, setTrailerPlateImage] = useState<File | null>(null);
  const [deviationReason, setDeviationReason] = useState<
    "AVERIA_NO_APTO" | "PATIO_LLENO"
  >("AVERIA_NO_APTO");
  const [activeTab, setActiveTab] = useState<DriverTab>("current");
  const [trailerLocationReport, setTrailerLocationReport] = useState<{
    operationId: number;
    destinationType: TrailerDestinationType;
  } | null>(null);
  const [selectedOwnYardId, setSelectedOwnYardId] = useState("");
  const [isConfirmingTrailerLocation, setIsConfirmingTrailerLocation] =
    useState(false);
  const [exportSealNumber, setExportSealNumber] = useState("");
  const [exportSealPhoto, setExportSealPhoto] = useState<File | null>(null);
  const [hasRegisteredExportPhoto, setHasRegisteredExportPhoto] =
    useState(false);
  const [isExportSealSubmitting, setIsExportSealSubmitting] = useState(false);
  const submissionLockRef = useRef(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [pendingEvidenceFiles, setPendingEvidenceFiles] = useState<
    PendingEvidenceFile[]
  >([]);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);

  useEffect(
    () => () => {
      pendingEvidenceFiles.forEach(({ previewUrl }) => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      });
    },
    [pendingEvidenceFiles],
  );

  const assignedOperations: DriverOperation[] =
    driver?.assignedOperations || [];
  const currentEvidenceType = evidenceTypes[evidenceIndex];
  const closingRequiresEir =
    modalType === "CLOSING" &&
    selectedOperation?.isContainerized === true &&
    (selectedOperation.type === "IMPORTACION" ||
      selectedOperation.type === "DEVOLUCION_VACIO");
  const galleryAllowsPdf =
    currentEvidenceType === "COMODATO" ||
    currentEvidenceType === "TIRILLA_EIR" ||
    modalType === "DEVIATION" ||
    closingRequiresEir;
  const allowsMultipleFiles =
    modalType === "DEVIATION" ||
    (modalType === "EVIDENCE" && currentEvidenceType !== "TIRILLA_EIR");

  const closeEvidenceModal = () => {
    setPendingEvidenceFiles([]);
    setIsModalOpen(false);
  };

  const handleDriverTravelStateUpdate = async (
    operationId: number,
    newState: string,
  ) => {
    const operation = assignedOperations.find(
      (candidate) => candidate.id === operationId,
    );
    const isImportClientDeparture =
      operation?.type === "IMPORTACION" && newState === "RUMBO_AL_CLIENTE";

    try {
      await updateTravelState(operationId, newState);
    } catch (error: unknown) {
      if (isImportClientDeparture) {
        await showAlert({
          title: "No se pudo iniciar el viaje",
          text: getUserFriendlyErrorMessage(
            error,
            "No se pudo iniciar el viaje al cliente. Verifica los soportes del puerto e inténtalo de nuevo.",
          ),
          icon: "error",
          confirmButtonColor: "#dc2626",
        });
      }
      throw error;
    }

    if (isImportClientDeparture) {
      await queryClient.invalidateQueries({
        queryKey: ["driver-portal-profile"],
      });
    }
  };
  const firstSuggestedOperation =
    assignedOperations.find(
      (operation) => operation.isDriverActive ?? operation.isActive,
    ) || assignedOperations[0];

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (submissionLockRef.current || rawFiles.length === 0) return;
    setPendingEvidenceFiles(
      rawFiles.map((file) => ({
        file,
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
      })),
    );
  };

  const handleConfirmFileSelection = async () => {
    if (submissionLockRef.current || pendingEvidenceFiles.length === 0) return;
    if (!selectedOperation) {
      await showAlert({
        title: "⚠️ Operación no encontrada",
        text: "No hay una operación activa seleccionada.",
        icon: "warning",
      });
      return;
    }

    submissionLockRef.current = true;
    setIsProcessingOcr(modalType === "OCR");
    let completed = false;
    try {
      const rawFiles = pendingEvidenceFiles.map(({ file }) => file);
      const files =
        modalType === "OCR"
          ? await Promise.all(rawFiles.map(compressOcrPhoto))
          : await compressFiles(rawFiles);
      const file = files[0];
      if (!file) return;
      if (modalType === "OCR") {
        if (ocrStep === "PLATE") {
          const result = await scanPlate(selectedOperation.id, file);
          if (result?.legible && result?.codigo) {
            setOcrStep("CONTAINER");
            showAlert({
              title: "✅ Placa detectada",
              text: `${result.codigo}\n\nAhora selecciona o toma la foto del contenedor.`,
              icon: "success",
            });
          } else {
            showAlert({
              title: "⚠️ No legible",
              text: "No se pudo leer la placa. Intenta con una imagen más clara.",
              icon: "warning",
            });
          }
        } else {
          setOcrContainerPhoto(file);
          setOcrFallback(false);
          const result = await scanContainer(selectedOperation.id, file);
          if (pendingContainerStatus) {
            await updateContainerStatus(
              selectedOperation.id,
              pendingContainerStatus,
            );
            setPendingContainerStatus(undefined);
          }
          await queryClient.invalidateQueries({
            queryKey: ["driver-portal-profile"],
          });
          if (result?.ocrFallback || !result?.legible || !result?.codigo) {
            setOcrFallback(true);
            setManualContainerNumber(result?.codigo ?? "");
          } else {
            showAlert({
              title: "✅ Contenedor validado",
              text: result.codigo,
              icon: "success",
            });
            setIsModalOpen(false);
            setOcrContainerPhoto(null);
          }
        }
      } else if (modalType === "CLOSING") {
        const requiresEir =
          selectedOperation.isContainerized === true &&
          (selectedOperation.type === "IMPORTACION" ||
            selectedOperation.type === "DEVOLUCION_VACIO");
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
        const containerStatusBeforeEvidence =
          evidenceNextState && pendingContainerStatus
            ? pendingContainerStatus
            : undefined;
        if (containerStatusBeforeEvidence) {
          await updateContainerStatus(
            selectedOperation.id,
            containerStatusBeforeEvidence,
          );
          setPendingContainerStatus(undefined);
        }
        await uploadEvidence(
          selectedOperation.id,
          files,
          evidenceType,
          evidenceBeforeState,
        );
        const nextIndex = evidenceIndex + 1;
        if (nextIndex < evidenceTypes.length) {
          setEvidenceIndex(nextIndex);
        } else {
          if (evidenceNextState) {
            await updateTravelState(selectedOperation.id, evidenceNextState);
          }
          if (pendingContainerStatus && !containerStatusBeforeEvidence) {
            await updateContainerStatus(
              selectedOperation.id,
              pendingContainerStatus,
            );
            setPendingContainerStatus(undefined);
          }
          setIsModalOpen(false);
        }
      } else if (modalType === "DEVIATION") {
        if (
          deviationReason !== "AVERIA_NO_APTO" &&
          deviationReason !== "PATIO_LLENO"
        ) {
          throw new Error("Selecciona un motivo de desvío válido.");
        }
        await reportDeviation(selectedOperation.id, files, deviationReason);
        setIsModalOpen(false);
      }
      completed = true;
    } catch (err: unknown) {
      // Axios/Nest 400 (p. ej. getClosingMissingRequirements) no debe quedar silencioso
      const message = getUserFriendlyErrorMessage(
        err,
        "Ocurrió un error al procesar la solicitud. Revisa el mensaje del servidor.",
      );
      await showAlert({
        title: "No se pudo completar",
        text: message,
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      submissionLockRef.current = false;
      setIsProcessingOcr(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
      if (completed) setPendingEvidenceFiles([]);
    }
  };

  const handleConfirmManualContainerNumber = async () => {
    if (!selectedOperation || !ocrContainerPhoto) return;
    if (!manualContainerNumber.trim()) {
      await showAlert({
        title: "Falta el número",
        text: "Digita el número que aparece en la foto del contenedor.",
        icon: "warning",
      });
      return;
    }
    if (submissionLockRef.current) return;
    submissionLockRef.current = true;
    try {
      await scanContainer(
        selectedOperation.id,
        ocrContainerPhoto,
        manualContainerNumber.trim(),
      );
      if (pendingContainerStatus) {
        await updateContainerStatus(
          selectedOperation.id,
          pendingContainerStatus,
        );
        setPendingContainerStatus(undefined);
      }
      await queryClient.invalidateQueries({
        queryKey: ["driver-portal-profile"],
      });
      await showAlert({
        title: "Evidencia guardada",
        text: "El número quedó asociado a la foto. El analista validará la evidencia OCR.",
        icon: "success",
      });
      setOcrContainerPhoto(null);
      setOcrFallback(false);
      setManualContainerNumber("");
      setIsModalOpen(false);
    } catch (error: unknown) {
      await showAlert({
        title: "No se pudo guardar el número",
        text: getUserFriendlyErrorMessage(
          error,
          "Ocurrió un error al guardar la foto y el número digitado.",
        ),
        icon: "error",
      });
    } finally {
      submissionLockRef.current = false;
    }
  };

  const handleConfirmExportSeal = async () => {
    if (submissionLockRef.current) return;
    if (!selectedOperation) return;
    if (!exportSealNumber.trim()) {
      await showAlert({
        title: "Falta el sello",
        text: "Ingresa el número de sello o precinto.",
        icon: "warning",
      });
      return;
    }
    if (!hasRegisteredExportPhoto && !exportSealPhoto) {
      await showAlert({
        title: "Falta la foto",
        text: "Adjunta la foto del contenedor cerrado.",
        icon: "warning",
      });
      return;
    }

    submissionLockRef.current = true;
    setIsExportSealSubmitting(true);
    try {
      await updateSealNumber(selectedOperation.id, exportSealNumber.trim());
      if (exportSealPhoto && !hasRegisteredExportPhoto) {
        const [compressed] = await compressFiles([exportSealPhoto]);
        if (!compressed) throw new Error("No se pudo preparar la foto.");
        await uploadEvidence(selectedOperation.id, compressed, "FOTO_CARGUE");
      }
      if (pendingContainerStatus) {
        await updateContainerStatus(
          selectedOperation.id,
          pendingContainerStatus,
        );
        setPendingContainerStatus(undefined);
      }
      await queryClient.invalidateQueries({
        queryKey: ["driver-portal-profile"],
      });
      setIsModalOpen(false);
      setExportSealPhoto(null);
    } catch (err: unknown) {
      await showAlert({
        title: "No se pudo completar",
        text: getUserFriendlyErrorMessage(
          err,
          "No pudimos guardar el sello y la foto.",
        ),
        icon: "error",
      });
    } finally {
      submissionLockRef.current = false;
      setIsExportSealSubmitting(false);
    }
  };

  const handleVerifyFleetPlates = async () => {
    if (
      submissionLockRef.current ||
      isProcessingOcr ||
      isVerifyingFleetPlates
    ) {
      return;
    }
    if (!selectedOperation || !cabPlateImage || !trailerPlateImage) {
      await showAlert({
        title: "Faltan fotos",
        text: "Adjunta las fotos de la placa del cabezote y del tráiler.",
        icon: "warning",
      });
      return;
    }

    submissionLockRef.current = true;
    setIsProcessingOcr(true);
    try {
      const [cabImage, trailerImage] = await Promise.all([
        compressOcrPhoto(cabPlateImage),
        compressOcrPhoto(trailerPlateImage),
      ]);

      const result = await verifyFleetPlates(
        selectedOperation.id,
        cabImage,
        trailerImage,
      );
      await showAlert({
        title: "Flota verificada",
        text: `Cabezote: ${result.cabPlate} · Tráiler: ${result.trailerPlate}`,
        icon: "success",
      });
      setCabPlateImage(null);
      setTrailerPlateImage(null);
      setIsModalOpen(false);
    } catch (error: unknown) {
      await showAlert({
        title: "No se pudieron verificar las placas",
        text: getUserFriendlyErrorMessage(
          error,
          "Ocurrió un error al analizar las placas. Inténtalo de nuevo.",
        ),
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      submissionLockRef.current = false;
      setIsProcessingOcr(false);
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
      await showAlert({
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
          const continueWithoutGps = await showAlert({
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
        const continueWithoutGps = await showAlert({
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
      await showAlert({
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
        authNotice={authNotice}
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
  const pairedAmparoOperation = activeOperation?.pairedAmparoOperation;

  return (
    <div className={styles.dashboardContainer}>
      <DriverHeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={history.length}
        onLogout={logout}
      />

      {activeTab === "current" ? (
        <>
          {activeOperation?.isAmparado && pairedAmparoOperation && (
            <section
              role="status"
              style={{
                margin: "16px auto",
                maxWidth: 960,
                padding: 16,
                border: "1px solid #bfdbfe",
                borderRadius: 12,
                background: "#eff6ff",
              }}
            >
              <strong>
                {activeOperation.type === "EXPORTACION"
                  ? "Exportación amparada con una Importación"
                  : "Importación amparada con una Exportación"}
              </strong>
              {activeOperation.type === "IMPORTACION" &&
              activeOperation.amparoExportFinished === false ? (
                <p>
                  La importación está en espera. Podrás iniciarla cuando la
                  exportación termine de desmontar el contenedor en el puerto.
                </p>
              ) : (
                <p>
                  Operación vinculada #{pairedAmparoOperation.id}; continúa en
                  secuencia cuando se habilite.
                </p>
              )}
              <details>
                <summary>
                  Ver detalles de{" "}
                  {pairedAmparoOperation.type === "IMPORTACION"
                    ? "la Importación"
                    : "la Exportación"}{" "}
                  #{pairedAmparoOperation.id}
                </summary>
                <dl>
                  <dt>Pedido</dt>
                  <dd>{pairedAmparoOperation.numeroPedido || "Sin pedido"}</dd>
                  <dt>Cliente</dt>
                  <dd>{pairedAmparoOperation.clientName}</dd>
                  <dt>Contenedor</dt>
                  <dd>
                    {pairedAmparoOperation.containerNumber || "Sin registrar"}
                    {pairedAmparoOperation.containerType
                      ? ` · ${pairedAmparoOperation.containerType}`
                      : ""}
                  </dd>
                  <dt>Origen / destino</dt>
                  <dd>
                    {pairedAmparoOperation.origenName} →{" "}
                    {pairedAmparoOperation.destinoName}
                  </dd>
                  <dt>Estado</dt>
                  <dd>
                    {pairedAmparoOperation.status} ·{" "}
                    {pairedAmparoOperation.estadoViaje || "Sin iniciar"} ·{" "}
                    {pairedAmparoOperation.containerStatus || "Pendiente"}
                  </dd>
                  <dt>Fecha programada</dt>
                  <dd>
                    {pairedAmparoOperation.scheduledAt
                      ? new Date(
                          pairedAmparoOperation.scheduledAt,
                        ).toLocaleDateString("es-CO")
                      : "Sin fecha"}
                  </dd>
                </dl>
              </details>
            </section>
          )}
          <CurrentTripTab
            driver={driver}
            assignedOperations={assignedOperations}
            activeOperation={activeOperation}
            onSelectOperation={setSelectedOperationId}
            vehiculo={vehiculo}
            processingState={processingState}
            onUpdateState={handleDriverTravelStateUpdate}
            onUpdateContainerStatus={updateContainerStatus}
            onUpdateCargoStatus={updateCargoStatus}
            onCompleteStop={completeStop}
            onUpdateSealNumber={updateSealNumber}
            onReportDeviation={(reason = "AVERIA_NO_APTO") => {
              setSelectedOperation(activeOperation || null);
              setDeviationReason(reason);
              setModalType("DEVIATION");
              setIsModalOpen(true);
            }}
            onReportExtra={(operationId) => {
              setExtraReportOperationId(operationId);
            }}
            onOpenOcrModal={(containerStatus) => {
              const operation = activeOperation || null;
              setSelectedOperation(operation);
              setOcrStep("CONTAINER");
              setPendingContainerStatus(containerStatus);
              setOcrContainerPhoto(null);
              setOcrFallback(false);
              setManualContainerNumber("");
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
            onOpenExportSealModal={(operationId, containerStatus) => {
              const operation =
                assignedOperations.find((item) => item.id === operationId) ??
                null;
              setSelectedOperation(operation);
              setPendingContainerStatus(containerStatus);
              setExportSealNumber(operation?.sealNumber ?? "");
              setExportSealPhoto(null);
              setHasRegisteredExportPhoto(
                Boolean(
                  operation?.evidences?.some(
                    (evidence) =>
                      [
                        "FOTO_CARGUE",
                        "LOADING_PHOTO_EVIDENCE",
                        "SELLOS_CONTENEDOR",
                        "SEAL_EVIDENCE",
                      ].includes(evidence.type) &&
                      evidence.estadoRevision !== "DEVUELTO",
                  ),
                ),
              );
              setModalType("EXPORT_SEAL");
              setIsModalOpen(true);
            }}
            onOpenEvidenceModal={(
              operationId,
              requestedTypes,
              nextState,
              beforeState,
              containerStatus,
            ) => {
              const operation =
                assignedOperations.find((item) => item.id === operationId) ||
                null;
              setSelectedOperation(operation);
              setEvidenceTypes(requestedTypes);
              setEvidenceIndex(0);
              setEvidenceNextState(nextState);
              setEvidenceBeforeState(beforeState);
              setPendingContainerStatus(containerStatus);
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
            onTrailerUpdated={(operationId, trailer) => {
              setSelectedOperation((current) =>
                current?.id === operationId
                  ? {
                      ...current,
                      trailer,
                      vehicle: current.vehicle
                        ? { ...current.vehicle, currentTrailerId: trailer.id }
                        : current.vehicle,
                    }
                  : current,
              );
            }}
            isUncouplingTrailer={isUncouplingTrailer}
          />
        </>
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

      <ReportExtraModal
        operationId={extraReportOperationId}
        onClose={() => setExtraReportOperationId(null)}
        onSuccess={() => {
          setExtraReportOperationId(null);
        }}
      />

      <SuperModal
        isOpen={isModalOpen && modalType !== "EXPORT_SEAL"}
        onClose={closeEvidenceModal}
        title={
          modalType === "OCR"
            ? "📸 Escáner de IA"
            : modalType === "PLATE_VERIFICATION"
              ? "Verificar Placas de la Flota"
              : modalType === "EVIDENCE"
                ? `📸 ${formatEvidenceTypeLabel(evidenceTypes[evidenceIndex])}`
                : modalType === "EXPORT_SEAL"
                  ? "Sello y contenedor cerrado"
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
                  <strong>
                    {selectedOperation.vehicle?.plate || "No asignado"}
                  </strong>
                  {" · "}Tráiler esperado:{" "}
                  <strong>
                    {selectedOperation.trailer?.plate || "No asignado"}
                  </strong>
                </p>
                <TrailerCouplingSelector
                  operation={selectedOperation}
                  onTrailerUpdated={(trailer: DriverTrailerOption) => {
                    setSelectedOperation((current) =>
                      current?.id === selectedOperation.id
                        ? {
                            ...current,
                            trailer,
                            vehicle: current.vehicle
                              ? {
                                  ...current.vehicle,
                                  currentTrailerId: trailer.id,
                                }
                              : current.vehicle,
                          }
                        : current,
                    );
                  }}
                />
                <label style={{ display: "grid", gap: 6 }}>
                  Foto Placa Cabezote
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) =>
                      setCabPlateImage(event.target.files?.[0] ?? null)
                    }
                    disabled={isVerifyingFleetPlates || isProcessingOcr}
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
                    disabled={isVerifyingFleetPlates || isProcessingOcr}
                    required
                  />
                </label>
                <Button
                  type="button"
                  onClick={() => void handleVerifyFleetPlates()}
                  isLoading={isVerifyingFleetPlates || isProcessingOcr}
                  disabled={
                    !cabPlateImage ||
                    !trailerPlateImage ||
                    isVerifyingFleetPlates ||
                    isProcessingOcr
                  }
                >
                  {isVerifyingFleetPlates
                    ? "Analizando placas con IA..."
                    : "Verificar placas"}
                </Button>
              </div>
            )}
            {modalType !== "DETAILS" && modalType !== "PLATE_VERIFICATION" && (
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
                {modalType === "OCR" &&
                  ocrStep === "CONTAINER" &&
                  ocrFallback &&
                  ocrContainerPhoto && (
                    <div
                      style={{
                        display: "grid",
                        gap: 10,
                        padding: 12,
                        border: "1px solid #f59e0b",
                        borderRadius: 8,
                        backgroundColor: "#fffbeb",
                      }}
                    >
                      <p role="status" style={{ margin: 0 }}>
                        El servicio OCR está temporalmente indisponible o no
                        logró leer la foto. La evidencia ya se guardó para
                        validación; puedes digitar el número para asociarlo.
                      </p>
                      <label style={{ display: "grid", gap: 6 }}>
                        Número del contenedor
                        <input
                          type="text"
                          value={manualContainerNumber}
                          onChange={(event) =>
                            setManualContainerNumber(event.target.value)
                          }
                          maxLength={16}
                          autoComplete="off"
                        />
                      </label>
                      <Button
                        type="button"
                        onClick={() =>
                          void handleConfirmManualContainerNumber()
                        }
                        disabled={uploading || processingState}
                      >
                        Confirmar número con la misma foto
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setOcrContainerPhoto(null);
                          setOcrFallback(false);
                          setManualContainerNumber("");
                          setIsModalOpen(false);
                        }}
                      >
                        Continuar con validación del analista
                      </Button>
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
                        setDeviationReason(
                          event.target.value as
                            "AVERIA_NO_APTO" | "PATIO_LLENO",
                        )
                      }
                      disabled={processingState}
                    >
                      <option value="AVERIA_NO_APTO">Avería / No apto</option>
                      <option value="PATIO_LLENO">Desvío de patio</option>
                    </Select>
                    <span>
                      Adjunta una o varias fotos o documentos PDF del comodato.
                    </span>
                  </label>
                )}
                {modalType === "CLOSING" &&
                  selectedOperation.isContainerized === true &&
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
                              ? "Adjunta el soporte de entrega / descargue (imagen o PDF): "
                              : "Adjunta una foto o documento claro: "}
                    <strong>
                      {formatEvidenceTypeLabel(evidenceTypes[evidenceIndex])}
                    </strong>
                    {evidenceTypes.length > 1 &&
                      ` (${evidenceIndex + 1} de ${evidenceTypes.length})`}
                  </p>
                )}

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple={allowsMultipleFiles}
                  ref={cameraInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  style={{ display: "none" }}
                />
                <input
                  type="file"
                  accept={
                    galleryAllowsPdf
                      ? "image/*,application/pdf,.pdf"
                      : "image/*"
                  }
                  multiple={allowsMultipleFiles}
                  ref={galleryInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  style={{ display: "none" }}
                />

                <Button
                  variant="primary"
                  onClick={() => {
                    cameraInputRef.current?.click();
                  }}
                  disabled={uploading || processingState}
                >
                  Tomar foto con cámara
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploading || processingState}
                >
                  {galleryAllowsPdf
                    ? "Elegir de galería o PDF"
                    : "Elegir foto de galería"}
                </Button>
                {pendingEvidenceFiles.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gap: 8,
                      padding: 10,
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                    }}
                  >
                    <strong>Vista previa</strong>
                    {pendingEvidenceFiles.map(({ file, previewUrl }, index) => (
                      <div
                        key={`${file.name}-${file.lastModified}-${index}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={`Vista previa de ${file.name}`}
                            style={{
                              width: 72,
                              height: 56,
                              objectFit: "cover",
                              borderRadius: 4,
                            }}
                          />
                        ) : (
                          <span aria-hidden="true">PDF</span>
                        )}
                        <span>{file.name}</span>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => void handleConfirmFileSelection()}
                      isLoading={
                        uploading || processingState || isProcessingOcr
                      }
                      disabled={
                        uploading || processingState || isProcessingOcr
                      }
                    >
                      Confirmar y subir
                    </Button>
                  </div>
                )}
              </div>
            )}
            <Button variant="secondary" onClick={closeEvidenceModal}>
              Cerrar
            </Button>
          </div>
        )}
      </SuperModal>
      {selectedOperation && (
        <SealAndClosureModal
          isOpen={isModalOpen && modalType === "EXPORT_SEAL"}
          operationId={selectedOperation.id}
          sealNumber={exportSealNumber}
          onSealNumberChange={setExportSealNumber}
          photo={exportSealPhoto}
          onPhotoChange={setExportSealPhoto}
          hasRegisteredPhoto={hasRegisteredExportPhoto}
          isSubmitting={isExportSealSubmitting}
          onConfirm={() => void handleConfirmExportSeal()}
          onClose={() => setIsModalOpen(false)}
        />
      )}
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
                  <strong>
                    {trailerReportOwnYard?.name || "seleccionado"}
                  </strong>
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

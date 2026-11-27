"use client";

import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Upload, X } from "lucide-react";
import { SuperModal } from "@/components/organisms/modal/modal";
import { operationService } from "@/services/operation.service";
import type {
  ImportedOperationPreviewRow,
  ImportedOperationsPreview,
} from "@/services/operation.service";
import { getUserFriendlyErrorMessage } from "@/utils/api-error";
import { showAlert } from "@/utils/alerts";
import styles from "./import-operations-excel-modal.module.css";

interface ImportOperationsExcelModalProps {
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}

const CLIENT_LOCATION_ERROR =
  "La ubicación seleccionada no pertenece al cliente.";

function isClientLocationError(message: string): boolean {
  return (
    message === CLIENT_LOCATION_ERROR ||
    (message.toLowerCase().includes("ubicación") &&
      message.toLowerCase().includes("cliente seleccionado"))
  );
}

function normalizeLocationName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function recomputeStatus(
  row: ImportedOperationPreviewRow,
): ImportedOperationPreviewRow["status"] {
  if (row.errors.length > 0) return "ERROR";
  return row.clientId === null ? "NEEDS_CLIENT_FIX" : "VALID";
}

export function ImportOperationsExcelModal({
  onClose,
  onCreated,
}: ImportOperationsExcelModalProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportedOperationsPreview | null>(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rowCounts = useMemo(() => {
    const rows = preview?.rows ?? [];
    return {
      total: rows.length,
      valid: rows.filter((row) => row.status === "VALID").length,
      needsClientFix: rows.filter(
        (row) => row.status === "NEEDS_CLIENT_FIX",
      ).length,
      errors: rows.filter((row) => row.status === "ERROR").length,
    };
  }, [preview]);

  const updateRow = (
    rowNumber: number,
    update: (row: ImportedOperationPreviewRow) => ImportedOperationPreviewRow,
  ) => {
    setPreview((current) =>
      current
        ? {
            ...current,
            rows: current.rows.map((row) =>
              row.rowNumber === rowNumber ? update(row) : row,
            ),
          }
        : current,
    );
  };

  const uploadFile = async (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setPreview(null);
      setError("Selecciona un archivo de Excel con extensión .xlsx.");
      return;
    }

    setIsUploading(true);
    setFileName(file.name);
    try {
      setPreview(await operationService.previewOperationsExcel(file));
    } catch (uploadError: unknown) {
      setPreview(null);
      setError(
        getUserFriendlyErrorMessage(
          uploadError,
          "No se pudo validar el archivo Excel.",
        ),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void uploadFile(file);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void uploadFile(file);
  };

  const downloadTemplate = async () => {
    setError(null);
    setIsDownloading(true);
    try {
      const blob = await operationService.downloadOperationsImportTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "solicitudes_operaciones.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (downloadError: unknown) {
      setError(
        getUserFriendlyErrorMessage(
          downloadError,
          "No se pudo descargar la plantilla oficial.",
        ),
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const changeClient = (row: ImportedOperationPreviewRow, clientId: number) => {
    if (!preview) return;
    const client = preview.availableClients.find(
      (candidate) => candidate.id === clientId,
    );
    if (!client) return;
    const matchedLocation = preview.availableClientLocations.find(
      (location) =>
        location.clientId === client.id &&
        normalizeLocationName(location.name) ===
          normalizeLocationName(row.locationName),
    );

    updateRow(row.rowNumber, (current) => {
      const errors = current.errors.filter(
        (message) =>
          !isClientLocationError(message),
      );
      if (!matchedLocation) errors.push(CLIENT_LOCATION_ERROR);
      const clientFixMessage = current.messages.filter(
        (message) =>
          !message.toLowerCase().includes("cliente no reconocido") &&
          !message.toLowerCase().includes("selecciona manualmente"),
      );
      const updated: ImportedOperationPreviewRow = {
        ...current,
        clientId: client.id,
        clientName: client.name,
        analystId: client.analystId,
        analystName: client.analystName,
        clientLocationId: matchedLocation?.id ?? null,
        errors,
        messages: matchedLocation
          ? clientFixMessage.filter((message) => !isClientLocationError(message))
          : [...clientFixMessage, CLIENT_LOCATION_ERROR],
        status: "ERROR",
      };
      updated.status = recomputeStatus(updated);
      return updated;
    });
  };

  const changeClientLocation = (rowNumber: number, locationId: number) => {
    const location = preview?.availableClientLocations.find(
      (candidate) => candidate.id === locationId,
    );
    if (!location) return;
    updateRow(rowNumber, (current) => {
      const errors = current.errors.filter(
        (message) => !isClientLocationError(message),
      );
      const messages = current.messages.filter(
        (message) => !isClientLocationError(message),
      );
      const updated: ImportedOperationPreviewRow = {
        ...current,
        clientLocationId: location.id,
        locationName: location.name,
        errors,
        messages,
        status: "ERROR",
      };
      updated.status = recomputeStatus(updated);
      return updated;
    });
  };

  const changePort = (rowNumber: number, portId: number) => {
    const port = preview?.availablePorts.find(
      (candidate) => candidate.id === portId,
    );
    if (!port) return;
    updateRow(rowNumber, (current) => ({
      ...current,
      portId: port.id,
      portName: port.name,
      messages: current.messages.map((message) =>
        message.startsWith("Puerto predeterminado:")
          ? `Puerto seleccionado: ${port.name}.`
          : message,
      ),
    }));
  };

  const confirmImport = async () => {
    if (!preview || isConfirming) return;
    const validRows = preview.rows.filter(
      (row): row is ImportedOperationPreviewRow & {
        clientId: number;
        clientLocationId: number;
        portId: number;
        type: "EXPORTACION" | "IMPORTACION";
        routeScope: "URBANO" | "NACIONAL";
        isContainerized: boolean;
        weight: number;
      } =>
        row.status === "VALID" &&
        row.clientId !== null &&
        row.clientLocationId !== null &&
        row.portId !== null &&
        row.type !== null &&
        row.routeScope !== null &&
        row.isContainerized !== null &&
        row.weight !== null,
    );
    if (validRows.length === 0 || rowCounts.needsClientFix > 0) return;

    setIsConfirming(true);
    setError(null);
    try {
      await operationService.confirmOperationsExcel(
        validRows.map((row) => ({
          clientId: row.clientId,
          clientLocationId: row.clientLocationId,
          portId: row.portId,
          ...(row.yardId !== null ? { yardId: row.yardId } : {}),
          ...(row.shippingLineId !== null
            ? { shippingLineId: row.shippingLineId }
            : {}),
          numeroPedido: row.numeroPedido,
          type: row.type,
          routeScope: row.routeScope,
          isContainerized: row.isContainerized,
          containerNumber: row.isContainerized ? row.containerNumber : null,
          weight: row.weight,
          volumeM3: row.volumeM3 ?? undefined,
          cargoVehicleTypeCode: row.cargoVehicleTypeCode,
        })),
      );

      const analystCounts = new Map<string, number>();
      for (const row of validRows) {
        const analystName = row.analystName ?? "Sin analista asignado";
        analystCounts.set(
          analystName,
          (analystCounts.get(analystName) ?? 0) + 1,
        );
      }
      const distribution = [...analystCounts.entries()]
        .map(([analystName, count]) => `${analystName}: ${count}`)
        .join(" · ");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trafico"] }),
        queryClient.invalidateQueries({ queryKey: ["operations"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({
          queryKey: ["operations", "pending-manifest"],
        }),
        onCreated(),
      ]);
      await showAlert({
        icon: "success",
        title: "Importación completada",
        text: `${validRows.length} operaciones creadas. Enrutamiento: ${distribution}.`,
        confirmButtonText: "Aceptar",
      });
      onClose();
    } catch (confirmError: unknown) {
      setError(
        getUserFriendlyErrorMessage(
          confirmError,
          "No se pudieron crear las operaciones.",
        ),
      );
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <SuperModal
      isOpen
      onClose={onClose}
      title="Carga masiva de solicitudes por Excel"
      width="min(1180px, 96vw)"
      maxHeight="92vh"
    >
      <div className={styles.modalContent}>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.templateButton}
            onClick={() => void downloadTemplate()}
            disabled={isDownloading}
          >
            <Download size={17} />
            {isDownloading
              ? "Preparando plantilla..."
              : "Descargar Plantilla Oficial (.xlsx)"}
          </button>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar importador"
          >
            <X size={18} />
          </button>
        </div>

        <ul className={styles.instructions}>
          <li>
            Contenerizada: requiere contenedor, patio y naviera; se asigna
            <strong> DRY_40</strong> por defecto.
          </li>
          <li>
            Carga suelta: requiere peso y volumen; la descripción se registra
            como «Carga suelta».
          </li>
          <li>
            Ubicación es la planta/bodega del cliente; revisa o cambia el puerto
            predeterminado antes de confirmar. Tipología vehicular es opcional.
          </li>
        </ul>

        <div
          className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className={styles.fileInput}
            onChange={handleFileChange}
          />
          <Upload size={20} />
          <span>
            {isUploading
              ? "Validando filas..."
              : fileName
                ? `Archivo: ${fileName} · Selecciona otro o arrástralo aquí`
                : "Arrastra aquí tu archivo .xlsx o haz clic para seleccionarlo"}
          </span>
        </div>

        {error && (
          <p className={styles.errorMessage} role="alert">
            {error}
          </p>
        )}

        {preview && (
          <>
            <div className={styles.summary} aria-label="Resumen de validación">
              <span>Total filas: <strong>{rowCounts.total}</strong></span>
              <span className={styles.validCount}>
                Listas para crear: <strong>{rowCounts.valid}</strong>
              </span>
              <span className={styles.fixCount}>
                Por corregir cliente: <strong>{rowCounts.needsClientFix}</strong>
              </span>
              <span className={styles.errorCount}>
                Con error: <strong>{rowCounts.errors}</strong>
              </span>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>N° Pedido</th>
                    <th>Cliente</th>
                    <th>Analista asignado</th>
                    <th>Tipo / Alcance</th>
                    <th>Contenedor o carga</th>
                    <th>Ubicación / Patio / Naviera</th>
                    <th>Puerto</th>
                    <th>Validación</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => {
                    const rowLocations = preview.availableClientLocations.filter(
                      (location) => location.clientId === row.clientId,
                    );
                    return (
                      <tr
                        key={row.rowNumber}
                        className={
                          row.status === "VALID"
                            ? styles.validRow
                            : row.status === "NEEDS_CLIENT_FIX"
                              ? styles.fixRow
                              : styles.errorRow
                        }
                      >
                        <td>
                          <span className={`${styles.status} ${styles[row.status]}`}>
                            {row.status === "VALID"
                              ? "Lista"
                              : row.status === "NEEDS_CLIENT_FIX"
                                ? "Corregir cliente"
                                : "Error"}
                          </span>
                          <small>Fila {row.rowNumber}</small>
                        </td>
                        <td>{row.numeroPedido || "—"}</td>
                        <td>
                          {row.clientId === null ||
                          row.status === "NEEDS_CLIENT_FIX" ? (
                            <select
                              aria-label={`Cliente de la fila ${row.rowNumber}`}
                              value={row.clientId ?? ""}
                              onChange={(event) =>
                                changeClient(row, Number(event.target.value))
                              }
                            >
                              <option value="">Selecciona cliente</option>
                              {preview.availableClients.map((client) => (
                                <option key={client.id} value={client.id}>
                                  {client.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <strong>{row.clientName}</strong>
                          )}
                          {row.clientId !== null &&
                            row.clientLocationId === null && (
                              <select
                                aria-label={`Ubicación de la fila ${row.rowNumber}`}
                                value=""
                                onChange={(event) =>
                                  changeClientLocation(
                                    row.rowNumber,
                                    Number(event.target.value),
                                  )
                                }
                              >
                                <option value="">Selecciona ubicación</option>
                                {rowLocations.map((location) => (
                                  <option key={location.id} value={location.id}>
                                    {location.name}
                                  </option>
                                ))}
                              </select>
                            )}
                        </td>
                        <td>{row.analystName ?? "Sin analista asignado"}</td>
                        <td>
                          {row.type === "EXPORTACION"
                            ? "EXPO"
                            : row.type === "IMPORTACION"
                              ? "IMPO"
                              : "—"}
                          <small>{row.routeScope ?? "—"}</small>
                        </td>
                        <td>
                          {row.isContainerized === true ? (
                            <>
                              <strong>{row.containerNumber ?? "Contenedor pendiente"}</strong>
                              <small>{row.containerType ?? "DRY_40"} · {row.weight ?? "—"} kg</small>
                            </>
                          ) : row.isContainerized === false ? (
                            <>
                              <strong>Carga suelta</strong>
                              <small>
                                {row.weight ?? "—"} kg · {row.volumeM3 ?? "—"} m³
                              </small>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          {row.locationName || "—"}
                          <small>
                            {row.isContainerized ? row.yardName || "Patio pendiente" : "Sin patio"}
                            {row.isContainerized
                              ? ` · ${row.shippingLineName || "Naviera pendiente"}`
                              : ""}
                          </small>
                        </td>
                        <td>
                          {preview.availablePorts.length > 1 ? (
                            <select
                              aria-label={`Puerto de la fila ${row.rowNumber}`}
                              value={row.portId ?? ""}
                              onChange={(event) =>
                                changePort(row.rowNumber, Number(event.target.value))
                              }
                            >
                              <option value="">Selecciona puerto</option>
                              {preview.availablePorts.map((port) => (
                                <option key={port.id} value={port.id}>
                                  {port.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            row.portName ?? "Sin puerto configurado"
                          )}
                        </td>
                        <td>
                          {row.messages.length > 0 ? (
                            <ul className={styles.messages}>
                              {row.messages.map((message, index) => (
                                <li key={`${row.rowNumber}-${index}`}>{message}</li>
                              ))}
                            </ul>
                          ) : (
                            "Sin observaciones"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {rowCounts.errors > 0 && (
              <p className={styles.omissionNote}>
                Las filas con error se omitirán. Corrige las filas amarillas
                antes de continuar.
              </p>
            )}
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={onClose}
                disabled={isConfirming}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.confirmButton}
                onClick={() => void confirmImport()}
                disabled={
                  isConfirming ||
                  rowCounts.valid === 0 ||
                  rowCounts.needsClientFix > 0
                }
              >
                <FileSpreadsheet size={17} />
                {isConfirming
                  ? "Creando operaciones..."
                  : `Confirmar y Crear ${rowCounts.valid} Operaciones`}
              </button>
            </div>
          </>
        )}
      </div>
    </SuperModal>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { driverPortalService } from "@/services/driverPortal.service";
import styles from "./container-photo-capture.module.css";

const CONTAINER_PHOTO_TYPES = [
  { type: "CONTENEDOR_PUERTA", label: "Puerta" },
  { type: "CONTENEDOR_COSTADO_DERECHO", label: "Costado derecho" },
  { type: "CONTENEDOR_COSTADO_IZQUIERDO", label: "Costado izquierdo" },
  { type: "CONTENEDOR_FRENTE", label: "Frente" },
] as const;

interface ContainerPhotoCaptureProps {
  operationId: number;
  evidenceStage: string;
  evidences: Array<{
    type: string;
    invalidated?: boolean;
    url?: string | null;
  }>;
  isLoading: boolean;
  onCompleteStop: () => Promise<void>;
}

async function compressPhoto(file: File): Promise<File> {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    image.close();
    throw new Error("No se pudo procesar la imagen.");
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(new Error("No se pudo comprimir la imagen.")),
      "image/jpeg",
      0.75,
    );
  });
  return new File([blob], `${Date.now()}-contenedor.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export function ContainerPhotoCapture({
  operationId,
  evidenceStage,
  evidences,
  isLoading,
  onCompleteStop,
}: ContainerPhotoCaptureProps) {
  const [readyTypes, setReadyTypes] = useState<Set<string>>(
    () =>
      new Set(
        evidences
          .filter(
            (evidence) =>
              evidence.invalidated !== true && Boolean(evidence.url),
          )
          .map((evidence) => evidence.type)
          .filter((type) =>
            CONTAINER_PHOTO_TYPES.some((photo) => photo.type === type),
          ),
      ),
  );
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCompletingStop, setIsCompletingStop] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(
    () => () => {
      for (const preview of Object.values(previews)) {
        if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
      }
    },
    [previews],
  );

  const handlePhotoChange = async (type: string, file?: File) => {
    if (!file) return;
    setErrorMessage(null);
    setUploadingType(type);
    try {
      const compressed = await compressPhoto(file);
      const previewUrl = URL.createObjectURL(compressed);
      setPreviews((current) => ({ ...current, [type]: previewUrl }));
      setReadyTypes((current) => {
        const next = new Set(current);
        next.delete(type);
        return next;
      });
      await driverPortalService.uploadEvidence(
        operationId,
        compressed,
        type,
        evidenceStage,
        "image",
      );
      setReadyTypes((current) => new Set(current).add(type));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo subir la foto. Inténtalo nuevamente.",
      );
    } finally {
      setUploadingType(null);
    }
  };

  const allPhotosReady = CONTAINER_PHOTO_TYPES.every((photo) =>
    readyTypes.has(photo.type),
  );

  const completeStop = async () => {
    setErrorMessage(null);
    setIsCompletingStop(true);
    try {
      await onCompleteStop();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo completar la parada. Inténtalo nuevamente.",
      );
    } finally {
      setIsCompletingStop(false);
    }
  };

  return (
    <section className={styles.captureSection} aria-labelledby={`container-photo-title-${operationId}`}>
      <header className={styles.captureHeader}>
        <div>
          <h4 id={`container-photo-title-${operationId}`}>
            Inspección Fotográfica del Contenedor (4 lados)
          </h4>
          <p>Las fotos se comprimen y se suben al seleccionarlas.</p>
        </div>
        <strong>{readyTypes.size} de 4 fotos listas</strong>
      </header>

      <div className={styles.photoGrid}>
        {CONTAINER_PHOTO_TYPES.map((photo) => {
          const currentEvidence = evidences.find(
            (evidence) =>
              evidence.type === photo.type && evidence.invalidated !== true,
          );
          const preview =
            previews[photo.type] ?? currentEvidence?.url ?? undefined;
          const isReady = readyTypes.has(photo.type);
          return (
            <article className={styles.photoCard} key={photo.type}>
              <strong>{photo.label}</strong>
              {preview ? (
                <img
                  className={styles.photoPreview}
                  src={preview}
                  alt={`Vista previa: ${photo.label}`}
                />
              ) : (
                <div className={styles.photoPlaceholder}>Foto pendiente</div>
              )}
              <input
                ref={(element) => {
                  inputRefs.current[photo.type] = element;
                }}
                className={styles.fileInput}
                type="file"
                accept="image/*"
                capture="environment"
                aria-label={`Tomar foto: ${photo.label}`}
                disabled={isLoading || uploadingType !== null}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  void handlePhotoChange(photo.type, file);
                }}
              />
              <button
                type="button"
                className={styles.captureButton}
                disabled={isLoading || uploadingType !== null}
                onClick={() => inputRefs.current[photo.type]?.click()}
              >
                {uploadingType === photo.type
                  ? "Subiendo foto..."
                  : isReady
                    ? "Volver a tomar"
                    : `Tomar foto: ${photo.label}`}
              </button>
            </article>
          );
        })}
      </div>

      {errorMessage && (
        <p className={styles.errorMessage} role="alert">
          {errorMessage}
        </p>
      )}
      <button
        type="button"
        className={styles.completeButton}
        disabled={
          !allPhotosReady ||
          isLoading ||
          uploadingType !== null ||
          isCompletingStop
        }
        onClick={() => void completeStop()}
      >
        {isCompletingStop ? "Completando parada..." : "Completar parada"}
      </button>
    </section>
  );
}

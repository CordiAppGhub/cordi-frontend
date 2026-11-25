"use client";

import type { ChangeEvent } from "react";
import { Button } from "@/components/atoms/button/button";
import { SuperModal } from "@/components/organisms/modal/modal";

interface SealAndClosureModalProps {
  isOpen: boolean;
  operationId: number;
  sealNumber: string;
  onSealNumberChange: (value: string) => void;
  photo: File | null;
  onPhotoChange: (file: File | null) => void;
  hasRegisteredPhoto: boolean;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function SealAndClosureModal({
  isOpen,
  operationId,
  sealNumber,
  onSealNumberChange,
  photo,
  onPhotoChange,
  hasRegisteredPhoto,
  isSubmitting,
  onConfirm,
  onClose,
}: SealAndClosureModalProps) {
  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    onPhotoChange(event.target.files?.[0] ?? null);
  };

  return (
    <SuperModal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title={`Sello y contenedor cerrado · Operación #${operationId}`}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {hasRegisteredPhoto ? (
          <p role="status" style={{ margin: 0, color: "#166534" }}>
            Foto registrada ✓
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            Adjunta una foto donde se vea el contenedor cerrado y el sello.
          </p>
        )}
        <label style={{ display: "grid", gap: 6 }}>
          Número de sello
          <input
            type="text"
            value={sealNumber}
            onChange={(event) =>
              onSealNumberChange(event.target.value.toUpperCase())
            }
            maxLength={100}
            placeholder="Ingresa el número de sello"
            disabled={isSubmitting}
            style={{ minHeight: 42 }}
          />
        </label>
        {!hasRegisteredPhoto && (
          <label style={{ display: "grid", gap: 6 }}>
            Foto del contenedor cerrado
            <input
              type="file"
              accept="image/*"
              capture="environment"
              disabled={isSubmitting}
              onChange={handlePhotoChange}
            />
          </label>
        )}
        {photo && (
          <p role="status" style={{ margin: 0 }}>
            Nueva foto seleccionada: {photo.name}
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            isLoading={isSubmitting}
            disabled={
              isSubmitting ||
              !sealNumber.trim() ||
              (!hasRegisteredPhoto && !photo)
            }
          >
            Guardar sello y foto
          </Button>
        </div>
      </div>
    </SuperModal>
  );
}

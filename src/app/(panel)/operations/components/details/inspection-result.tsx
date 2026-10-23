"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { useLocations } from "@/app/(panel)/locations/hooks/useLocation";
import {
  InspectionResultFormData,
  inspectionResultSchema,
} from "@/schemas/inspection-result.schema";
import { operationService } from "@/services/operation.service";
import type { Operation } from "@/types/operation-types";
import { showToast } from "@/utils/alerts";

interface Props {
  operation: Operation;
}

export function InspectionResult({ operation }: Props) {
  const queryClient = useQueryClient();
  const { locations, isLoadingLocations } = useLocations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InspectionResultFormData>({
    resolver: zodResolver(inspectionResultSchema),
    defaultValues: {
      result: "APROBADO",
      newLocationId: "",
      observations: "",
    },
  });

  const result = useWatch({ control, name: "result" });
  const isRejected = result === "RECHAZADO_MAL_ESTADO";
  const latestDeviation = operation.deviations?.[0];

  const submit = async (data: InspectionResultFormData) => {
    setIsSubmitting(true);
    try {
      const updatedOperation = await operationService.recordInspectionResult(
        operation.id,
        {
          result: data.result,
          ...(isRejected
            ? {
                newLocationId: Number(data.newLocationId),
                comodato: data.comodato?.item(0) ?? undefined,
              }
            : {}),
          ...(data.observations.trim()
            ? { observations: data.observations.trim() }
            : {}),
        },
      );
      queryClient.setQueryData(
        ["trafico-detail", operation.id],
        updatedOperation,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trafico"] }),
        queryClient.invalidateQueries({
          queryKey: ["operation-timeline", operation.id],
        }),
      ]);
      showToast.success("Resultado de inspección registrado correctamente.");
    } catch {
      showToast.error("No se pudo registrar el resultado de inspección.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!operation.requiresInspection) return null;

  if (operation.inspectionStatus) {
    return (
      <section
        aria-label="Resultado de inspección"
        style={{
          marginBottom: 24,
          padding: 16,
          border: "1px solid #cbd5e1",
          borderRadius: 10,
          background: "#f8fafc",
        }}
      >
        <h3 style={{ margin: "0 0 8px", color: "#0f172a" }}>
          Resultado de inspección · {operation.shippingLine?.name ?? "Naviera"}
        </h3>
        <p style={{ margin: 0 }}>
          {operation.inspectionStatus === "APROBADO"
            ? "Aprobado"
            : "Rechazado por mal estado"}
        </p>
        {latestDeviation && (
          <div style={{ marginTop: 10 }}>
            <p style={{ margin: "0 0 4px" }}>
              Nuevo patio: {latestDeviation.newLocation.name}
            </p>
            <a href={latestDeviation.comodatoUrl} target="_blank" rel="noreferrer">
              Ver soporte del comodato
            </a>
            {latestDeviation.observations && (
              <p style={{ marginBottom: 0 }}>{latestDeviation.observations}</p>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      aria-label="Resultado de inspección"
      style={{
        marginBottom: 24,
        padding: 16,
        border: "1px solid #bfdbfe",
        borderRadius: 10,
        background: "#eff6ff",
      }}
    >
      <h3 style={{ margin: "0 0 14px", color: "#0f172a" }}>
        Resultado de inspección
        {operation.shippingLine ? ` · ${operation.shippingLine.name}` : ""}
      </h3>
      <form
        onSubmit={(event) => void handleSubmit(submit)(event)}
        style={{ display: "grid", gap: 12 }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span>Resultado</span>
          <select {...register("result")}>
            <option value="APROBADO">Aprobado</option>
            <option value="RECHAZADO_MAL_ESTADO">
              Rechazado por mal estado
            </option>
          </select>
        </label>

        {isRejected && (
          <>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Nuevo patio de destino *</span>
              <select
                {...register("newLocationId")}
                disabled={isLoadingLocations}
              >
                <option value="">Selecciona un patio</option>
                {locations
                  .filter((location) => location.isDepot)
                  .map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
              </select>
              {errors.newLocationId && (
                <span role="alert">{errors.newLocationId.message}</span>
              )}
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Fotografía del comodato *</span>
              <input
                type="file"
                accept="image/*"
                {...register("comodato")}
              />
              {errors.comodato && (
                <span role="alert">{errors.comodato.message}</span>
              )}
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Observaciones</span>
              <textarea rows={3} {...register("observations")} />
            </label>
          </>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : "Registrar resultado"}
        </button>
      </form>
    </section>
  );
}

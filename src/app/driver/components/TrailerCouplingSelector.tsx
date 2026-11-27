"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/atoms/button/button";
import { driverPortalService } from "@/services/driverPortal.service";
import { trailersService } from "@/services/trailers.service";
import type {
  DriverTrailerOption,
  Operation,
} from "@/types/driver-portal.types";
import { showToast } from "@/utils/alerts";
import styles from "./trailer-coupling-selector.module.css";

interface TrailerCouplingSelectorProps {
  operation: Operation;
  onTrailerUpdated: (trailer: DriverTrailerOption) => void;
}

export function TrailerCouplingSelector({
  operation,
  onTrailerUpdated,
}: TrailerCouplingSelectorProps) {
  const queryClient = useQueryClient();
  const [trailerId, setTrailerId] = useState("");
  const trailersQuery = useQuery({
    queryKey: ["driver-available-trailers"],
    queryFn: trailersService.getAvailableForDriver,
  });
  const assignTrailerMutation = useMutation({
    mutationFn: () =>
      driverPortalService.assignTrailer(operation.id, trailerId),
    onSuccess: async ({ trailer }) => {
      showToast.success("Chasis acoplado a la operación.");
      onTrailerUpdated(trailer);
      setTrailerId("");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["driver-portal-profile"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["driver-available-trailers"],
        }),
      ]);
    },
    onError: (error: unknown) => {
      showToast.error(error, "No se pudo acoplar el chasis seleccionado.");
    },
  });

  const mustUncoupleFirst = Boolean(operation.vehicle?.currentTrailerId);
  const availableTrailers = trailersQuery.data ?? [];

  return (
    <section className={styles.selector} aria-label="Acoplar o cambiar chasis">
      <strong>Acoplar / Cambiar Chasis</strong>
      {operation.trailer?.plate && (
        <p className={styles.currentTrailer}>
          Chasis de la operación: <strong>{operation.trailer.plate}</strong>
        </p>
      )}
      {mustUncoupleFirst && (
        <p className={styles.notice} role="status">
          Desengancha primero el chasis actual y reporta dónde queda para poder
          acoplar uno diferente.
        </p>
      )}
      {trailersQuery.isLoading ? (
        <p className={styles.message} role="status">
          Cargando chasis disponibles…
        </p>
      ) : trailersQuery.isError ? (
        <div className={styles.error} role="alert">
          <span>No se pudieron cargar los chasis disponibles.</span>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void trailersQuery.refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : availableTrailers.length === 0 ? (
        <p className={styles.message}>No hay chasis disponibles en patio.</p>
      ) : (
        <div className={styles.controls}>
          <label htmlFor={`trailer-${operation.id}`}>Chasis disponible</label>
          <select
            id={`trailer-${operation.id}`}
            value={trailerId}
            onChange={(event) => setTrailerId(event.target.value)}
            disabled={mustUncoupleFirst || assignTrailerMutation.isPending}
          >
            <option value="">Selecciona un chasis</option>
            {availableTrailers.map((trailer) => (
              <option key={trailer.id} value={trailer.id}>
                {trailer.plate} · {trailer.axles ?? "—"} ejes ·{" "}
                {trailer.trailerType ?? "Tipo sin registrar"}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            onClick={() => assignTrailerMutation.mutate()}
            disabled={
              !trailerId ||
              mustUncoupleFirst ||
              assignTrailerMutation.isPending
            }
            isLoading={assignTrailerMutation.isPending}
          >
            Confirmar chasis
          </Button>
        </div>
      )}
    </section>
  );
}

"use client";

import type { Operation } from "@/types/driver-portal.types";
import { generateDriverOperationRoute } from "@/utils/driver-operation-route";
import { formatAppointmentLocationLabel } from "@/utils/appointment-label";
import styles from "./operation-details-card.module.css";

interface LocationStep {
  key: string;
  label: string;
  name: string;
  address?: string | null;
}

interface OperationDetailsCardProps {
  operation: Operation;
}

function getLocationName(
  location: { name: string; address?: string | null } | null | undefined,
  fallback: string,
): string {
  return location?.name || fallback;
}

function getStopLocation(
  operation: Operation,
  stopType: "CARGUE" | "DESCARGUE",
  fallbackName: string,
): { name: string; address?: string | null } | null {
  const stop = [...(operation.stops ?? [])]
    .sort((left, right) => left.stopOrder - right.stopOrder)
    .find(
      (item) =>
        item.stopType === stopType &&
        (operation.clientId == null || item.clientId === operation.clientId),
    );

  if (!stop) return null;

  return {
    name: stop.isCustomAddress
      ? "Dirección personalizada"
      : stop.location?.name || stop.address || fallbackName,
    address: stop.isCustomAddress
      ? stop.address
      : stop.location?.address || stop.address,
  };
}

export function OperationDetailsCard({
  operation,
}: OperationDetailsCardProps) {
  const stops = [...(operation.stops ?? [])].sort(
    (left, right) => left.stopOrder - right.stopOrder,
  );
  const origin =
    operation.originLocation ||
    operation.origen ||
    (operation.origenName ? { name: operation.origenName } : null);
  const destination =
    operation.destinationLocation ||
    operation.destino ||
    (operation.destinoName ? { name: operation.destinoName } : null);
  const clientStopType =
    operation.type === "IMPORTACION" ? "DESCARGUE" : "CARGUE";
  const clientLocation =
    getStopLocation(
      operation,
      clientStopType,
      "Ubicación del cliente por confirmar",
    ) ||
    (operation.type === "IMPORTACION"
      ? operation.descargue
      : operation.cargue) ||
    operation.customer?.locations.find(
      (location) => location.id === operation.clientLocationId,
    ) ||
    (operation.clientLocationName
      ? { name: operation.clientLocationName }
      : null);

  const locationSteps: LocationStep[] = (() => {
    switch (operation.type) {
      case "IMPORTACION":
        return [
          {
            key: "pickup-full",
            label: "1. Retiro (Lleno)",
            name: getLocationName(origin, "Origen por confirmar"),
            address: origin?.address,
          },
          {
            key: "client-unloading",
            label: "2. Descargue (Cliente)",
            name: getLocationName(clientLocation, "Ubicación por confirmar"),
            address: clientLocation?.address,
          },
          {
            key: "return-empty",
            label: "3. Devolución (Vacío)",
            name: getLocationName(destination, "Destino por confirmar"),
            address: destination?.address,
          },
        ];
      case "EXPORTACION":
        return [
          {
            key: "pickup-empty",
            label: "1. Retiro (Vacío)",
            name: getLocationName(origin, "Origen por confirmar"),
            address: origin?.address,
          },
          {
            key: "client-loading",
            label: "2. Cargue (Cliente)",
            name: getLocationName(clientLocation, "Ubicación por confirmar"),
            address: clientLocation?.address,
          },
          {
            key: "entry-full",
            label: "3. Ingreso (Lleno)",
            name: getLocationName(destination, "Destino por confirmar"),
            address: destination?.address,
          },
        ];
      case "RETIRO_VACIO":
        return [
          {
            key: "empty-origin",
            label: "1. Origen (Vacío)",
            name: getLocationName(origin, "Origen por confirmar"),
            address: origin?.address,
          },
          {
            key: "empty-destination",
            label: "2. Destino (Vacío)",
            name: getLocationName(destination, "Destino por confirmar"),
            address: destination?.address,
          },
        ];
      case "DEVOLUCION_VACIO":
        return [
          {
            key: "pickup",
            label: "1. Recogida",
            name: getLocationName(origin, "Origen por confirmar"),
            address: origin?.address,
          },
          {
            key: "shipping-depot",
            label: "2. Depósito Naviera",
            name: getLocationName(destination, "Destino por confirmar"),
            address: destination?.address,
          },
        ];
      case "MOVIMIENTO_INTERNO":
        return [
          {
            key: "internal-origin",
            label: "1. Ubicación Origen",
            name: getLocationName(origin, "Origen por confirmar"),
            address: origin?.address,
          },
          {
            key: "internal-destination",
            label: "2. Ubicación Destino",
            name: getLocationName(destination, "Destino por confirmar"),
            address: destination?.address,
          },
        ];
      default:
        return [
          {
            key: "origin",
            label: "1. Origen",
            name: getLocationName(origin, "Origen por confirmar"),
            address: origin?.address,
          },
          {
            key: "destination",
            label: "2. Destino",
            name: getLocationName(destination, "Destino por confirmar"),
            address: destination?.address,
          },
        ];
    }
  })();

  const route = generateDriverOperationRoute(operation);
  const stopWeight = stops.reduce(
    (total, stop) => total + (stop.weightKg ?? 0),
    0,
  );
  const weight = operation.weight ?? operation.peso ?? (stopWeight || null);
  const advanceRetrievalDate =
    operation.isAnticipada || operation.isAdvanceRetrieval
      ? (operation.advanceRetrievalDate ?? operation.fechaRetiro ?? null)
      : null;
  const operationDate = operation.operationDate ?? operation.scheduledAt;
  const originAppointment =
    operation.originAppointment ?? operation.fechaCitaOrigen;
  const destinationAppointment =
    operation.destinationAppointment ?? operation.fechaCitaDestino;
  const dates = [
    operationDate
      ? {
          key: "operation",
          label: "Fecha de operación",
          date: operationDate,
        }
      : null,
    originAppointment
      ? {
          key: "origin",
          label: formatAppointmentLocationLabel(
            "Cita de origen",
            operation.originLocation?.name || operation.origen?.name,
          ),
          date: originAppointment,
        }
      : null,
    destinationAppointment
      ? {
          key: "destination",
          label: formatAppointmentLocationLabel(
            "Cita de destino",
            operation.destinationLocation?.name ||
              operation.destino?.name ||
              operation.descargue?.name,
          ),
          date: destinationAppointment,
        }
      : null,
    advanceRetrievalDate
      ? {
          key: "advance-retrieval",
          label: "Retiro anticipado",
          date: advanceRetrievalDate,
        }
      : null,
  ].filter((date) => date !== null);

  const customerName = operation.customer?.name || operation.clientName;
  const customerPhone =
    operation.customer?.contactPhone || operation.clientContactPhone;
  const customerContact =
    operation.customer?.contactName || operation.clientContactName;
  const phoneHref = customerPhone?.replace(/[^\d+]/g, "");

  return (
    <section className={styles.detailsCard} aria-label="Detalles de la operación">
      <div className={styles.routeCard}>
        <span className={styles.sectionLabel}>Ruta</span>
        <strong className={styles.longText}>
          📍 {route || "Ruta por confirmar"}
        </strong>
      </div>

      {customerName && (
        <section className={styles.customerCard}>
          <h3>Información del Cliente</h3>
          <strong>{customerName}</strong>
          {operation.clientLocationName && (
            <p className={styles.longText}>
              Sede: {operation.clientLocationName}
            </p>
          )}
          {customerContact && <p>Contacto: {customerContact}</p>}
          {customerPhone && (
            <p>
              Teléfono: <a href={`tel:${phoneHref}`}>{customerPhone}</a>
            </p>
          )}
        </section>
      )}

      <div className={styles.locationGrid}>
        {locationSteps.map((step) => (
          <article className={styles.locationCard} key={step.key}>
            <h3>{step.label}</h3>
            <h4>{step.name}</h4>
            {step.address && (
              <p className={styles.longText}>{step.address}</p>
            )}
          </article>
        ))}
      </div>

      {dates.length > 0 && (
        <section className={styles.cargoCard}>
          <h3>Fechas y citas</h3>
          <dl className={styles.cargoGrid}>
            {dates.map(({ key, label, date }) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>
                  {new Date(date).toLocaleString("es-CO", {
                    timeZone: "America/Bogota",
                  })}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className={styles.cargoCard}>
        <h3>Carga</h3>
        <dl className={styles.cargoGrid}>
          <div>
            <dt>Peso</dt>
            <dd>
              {weight
                ? `${weight.toLocaleString("es-CO")} kg`
                : "Por confirmar"}
            </dd>
          </div>
          <div>
            <dt>Volumen</dt>
            <dd>
              {operation.volumeM3 != null
                ? `${operation.volumeM3.toLocaleString("es-CO")} m³`
                : "Por confirmar"}
            </dd>
          </div>
          {(operation.packageType || operation.packageCount != null) && (
            <div>
              <dt>Empaque</dt>
              <dd>
                {[operation.packageCount, operation.packageType]
                  .filter(Boolean)
                  .join(" · ")}
              </dd>
            </div>
          )}
        </dl>
        <p className={styles.cargoDescription}>
          {operation.cargoDescription || "Descripción por confirmar"}
        </p>
      </section>
    </section>
  );
}

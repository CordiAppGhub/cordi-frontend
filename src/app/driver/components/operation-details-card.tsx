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
  appointmentAt?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  observations?: string | null;
  status?: string;
  actualArrivalAt?: string | null;
  actualDepartureAt?: string | null;
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

function formatDateTime(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  });
}

function formatCodeLabel(value?: string | null): string {
  if (!value) return "Por confirmar";
  const labels: Record<string, string> = {
    ASIGNADO: "Asignada",
    EN_CURSO: "En curso",
    CIERRE_FISICO: "Cierre físico",
    FINALIZADO: "Finalizada",
    PAUSADA: "Pausada",
    CANCELADO: "Cancelada",
    DRY_20: "Seco · 20 pies",
    DRY_40: "Seco · 40 pies",
    HC_40: "High Cube · 40 pies",
    REEFER_20: "Refrigerado · 20 pies",
    REEFER_40_HC: "Refrigerado High Cube · 40 pies",
    OPEN_TOP_20: "Open Top · 20 pies",
    OPEN_TOP_40: "Open Top · 40 pies",
    FLAT_RACK_20: "Flat Rack · 20 pies",
    FLAT_RACK_40: "Flat Rack · 40 pies",
    ISO_TANK_20: "Tanque ISO · 20 pies",
    PENDIENTE_DEVOLUCION: "Pendiente de devolución",
    DEVUELTO_VACIO: "Devuelto vacío",
    VACIO: "Vacío",
    EN_PISO: "En piso",
    PENDIENTE_CARGUE: "Pendiente de cargue",
    EN_CARGUE: "En cargue",
    CARGADO: "Cargado",
    SELLADO: "Sellado",
    INSPECCIONADO: "Inspeccionado",
    EN_DESCARGUE: "En descargue",
    DESCARGADO: "Descargado",
    ENTREGADO: "Entregado",
    DEVUELTO: "Devuelto",
  };
  if (labels[value]) return labels[value];
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^./, (character) => character.toLocaleUpperCase("es-CO"));
}

function formatOperationType(type?: string): string {
  const labels: Record<string, string> = {
    IMPORTACION: "Importación",
    EXPORTACION: "Exportación",
    EXPORTACION_ANTICIPADA: "Exportación anticipada",
    RETIRO_VACIO: "Retiro de vacío",
    DEVOLUCION_VACIO: "Devolución de vacío",
    NACIONAL: "Nacional",
    MOVIMIENTO_INTERNO: "Movimiento interno",
  };
  return (type && labels[type]) || formatCodeLabel(type);
}

function formatFreight(value?: number | null): string {
  if (value == null) return "Pendiente de liquidación";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
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
    if (operation.isContainerized !== true) {
      if (stops.length > 0) {
        return stops.map((stop) => ({
          key: `stop-${stop.id}`,
          label: `${stop.stopOrder}. ${stop.stopType === "CARGUE" ? "Cargue" : "Descargue"}`,
          name: stop.isCustomAddress
            ? "Dirección personalizada"
            : stop.location?.name || stop.address || "Ubicación por confirmar",
          address: stop.isCustomAddress
            ? stop.address
            : stop.location?.address || stop.address,
          appointmentAt: stop.appointmentAt,
          contactName: stop.contactName,
          contactPhone: stop.contactPhone,
          observations: stop.observations,
          status: stop.status,
          actualArrivalAt: stop.actualArrivalAt,
          actualDepartureAt: stop.actualDepartureAt,
        }));
      }

      if (operation.type === "IMPORTACION") {
        return [
          {
            key: "port-origin",
            label: "1. Puerto de origen",
            name: getLocationName(origin, "Puerto por confirmar"),
            address: origin?.address,
          },
          {
            key: "client-delivery",
            label: "2. Entrega al cliente",
            name: getLocationName(
              clientLocation || destination,
              "Ubicación del cliente por confirmar",
            ),
            address: (clientLocation || destination)?.address,
          },
        ];
      }

      if (
        operation.type === "EXPORTACION" ||
        operation.type === "EXPORTACION_ANTICIPADA"
      ) {
        return [
          {
            key: "client-pickup",
            label: "1. Retiro en cliente",
            name: getLocationName(
              clientLocation || origin,
              "Ubicación del cliente por confirmar",
            ),
            address: (clientLocation || origin)?.address,
          },
          {
            key: "port-destination",
            label: "2. Puerto de destino",
            name: getLocationName(destination, "Puerto por confirmar"),
            address: destination?.address,
          },
        ];
      }

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
      case "EXPORTACION_ANTICIPADA":
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
    operation.isContainerized === true &&
    (operation.isAnticipada || operation.isAdvanceRetrieval)
      ? (operation.advanceRetrievalDate ?? operation.fechaRetiro ?? null)
      : null;
  const operationDate = operation.operationDate ?? operation.scheduledAt;
  const originAppointment =
    operation.type &&
    operation.type !== "NACIONAL"
      ? operation.originAppointment ?? operation.fechaCitaOrigen
      : null;
  const destinationAppointment =
    operation.type &&
    operation.type !== "NACIONAL"
      ? operation.destinationAppointment ?? operation.fechaCitaDestino
      : null;
  const operationDateLabel = formatDateTime(operationDate);
  const originAppointmentLabel = formatDateTime(originAppointment);
  const destinationAppointmentLabel = formatDateTime(destinationAppointment);
  const advanceRetrievalDateLabel = formatDateTime(advanceRetrievalDate);
  const dates = [
    operationDateLabel
      ? {
          key: "operation",
          label: "Fecha de operación",
          date: operationDateLabel,
        }
      : null,
    originAppointmentLabel
      ? {
          key: "origin",
          label: formatAppointmentLocationLabel(
            "Cita de origen",
            operation.originLocation?.name || operation.origen?.name,
          ),
          date: originAppointmentLabel,
        }
      : null,
    destinationAppointmentLabel
      ? {
          key: "destination",
          label: formatAppointmentLocationLabel(
            "Cita de destino",
            operation.destinationLocation?.name ||
              operation.destino?.name ||
              operation.descargue?.name,
          ),
          date: destinationAppointmentLabel,
        }
      : null,
    advanceRetrievalDateLabel
      ? {
          key: "advance-retrieval",
          label: "Retiro anticipado",
          date: advanceRetrievalDateLabel,
        }
      : null,
  ].filter((date) => date !== null);

  const customerName = operation.customer?.name || operation.clientName;
  const customerPhone =
    operation.customer?.contactPhone || operation.clientContactPhone;
  const customerContact =
    operation.customer?.contactName || operation.clientContactName;
  const phoneHref = customerPhone?.replace(/[^\d+]/g, "");
  const operationStatus = operation.estadoViaje || operation.status;
  const vehiclePlate = operation.vehicle?.plate || operation.vehiclePlate;
  const trailerPlate = operation.trailer?.plate;

  return (
    <section className={styles.detailsCard} aria-label="Detalles de la operación">
      <header className={styles.operationHeader}>
        <div>
          <span className={styles.sectionLabel}>Resumen del servicio</span>
          <h2>Operación #{operation.id}</h2>
          <p>
            {formatOperationType(operation.type)}
            {operation.isAnticipada || operation.isAdvanceRetrieval
              ? " · Modalidad anticipada"
              : ""}
          </p>
        </div>
        <div className={styles.headerBadges}>
          <span className={styles.modalityBadge}>
            {operation.isContainerized === true
              ? "Contenerizada"
              : "Carga suelta"}
          </span>
          {operationStatus && (
            <span className={styles.statusBadge}>
              {formatCodeLabel(operationStatus)}
            </span>
          )}
        </div>
      </header>

      <section className={styles.freightCard} aria-label="Flete del conductor">
        <div>
          <span>Flete a pagar al conductor</span>
          <strong>{formatFreight(operation.fleteAPagar)}</strong>
        </div>
        <span className={styles.freightNote}>
          {operation.fleteAPagar == null
            ? "El valor será informado cuando se liquide la operación."
            : "Valor asignado para este viaje"}
        </span>
      </section>

      {(operation.numeroPedido ||
        operation.documentoTransporte ||
        operation.arin ||
        operation.radicado ||
        vehiclePlate ||
        trailerPlate) && (
        <section className={styles.cargoCard}>
          <h3>Referencias y asignación</h3>
          <dl className={styles.cargoGrid}>
            {operation.numeroPedido && (
              <div>
                <dt>Número de operación / pedido</dt>
                <dd>{operation.numeroPedido}</dd>
              </div>
            )}
            {operation.documentoTransporte && (
              <div>
                <dt>Documento de transporte</dt>
                <dd>{operation.documentoTransporte}</dd>
              </div>
            )}
            {operation.arin && (
              <div>
                <dt>ARIN</dt>
                <dd>{operation.arin}</dd>
              </div>
            )}
            {operation.radicado && (
              <div>
                <dt>Radicado</dt>
                <dd>{operation.radicado}</dd>
              </div>
            )}
            {vehiclePlate && (
              <div>
                <dt>Cabezote</dt>
                <dd>{vehiclePlate}</dd>
              </div>
            )}
            {trailerPlate && (
              <div>
                <dt>Tráiler</dt>
                <dd>{trailerPlate}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {operation.isContainerized === true && (
        <section className={styles.containerCard}>
          <h3>Información del contenedor</h3>
          <dl className={styles.cargoGrid}>
            <div>
              <dt>Número de contenedor</dt>
              <dd>{operation.containerNumber || "Por confirmar"}</dd>
            </div>
            <div>
              <dt>Tipo de contenedor</dt>
              <dd>{formatCodeLabel(operation.containerType)}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{formatCodeLabel(operation.containerStatus)}</dd>
            </div>
            {operation.sealNumber && (
              <div>
                <dt>Sello / precinto</dt>
                <dd>{operation.sealNumber}</dd>
              </div>
            )}
            {operation.shippingLine?.name && (
              <div>
                <dt>Línea naviera</dt>
                <dd>{operation.shippingLine.name}</dd>
              </div>
            )}
            {operation.pinRetiro && (
              <div>
                <dt>PIN de retiro</dt>
                <dd>{operation.pinRetiro}</dd>
              </div>
            )}
            {operation.diasLibresDevolucion != null && (
              <div>
                <dt>Días libres para devolución</dt>
                <dd>{operation.diasLibresDevolucion}</dd>
              </div>
            )}
            {formatDateTime(operation.fechaLimiteDevolucion) && (
              <div>
                <dt>Fecha límite de devolución</dt>
                <dd>{formatDateTime(operation.fechaLimiteDevolucion)}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

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
            {step.appointmentAt && (
              <p className={styles.stopDetail}>
                Cita: {formatDateTime(step.appointmentAt) || "Por confirmar"}
              </p>
            )}
            {step.contactName && (
              <p className={styles.stopDetail}>Contacto: {step.contactName}</p>
            )}
            {step.contactPhone && (
              <p className={styles.stopDetail}>
                Teléfono: <a href={`tel:${step.contactPhone}`}>{step.contactPhone}</a>
              </p>
            )}
            {step.status && (
              <span className={styles.stopStatus}>
                {formatCodeLabel(step.status)}
              </span>
            )}
            {formatDateTime(step.actualArrivalAt) && (
              <p className={styles.stopDetail}>
                Llegada: {formatDateTime(step.actualArrivalAt)}
              </p>
            )}
            {formatDateTime(step.actualDepartureAt) && (
              <p className={styles.stopDetail}>
                Salida: {formatDateTime(step.actualDepartureAt)}
              </p>
            )}
            {step.observations && (
              <p className={styles.stopDetail}>
                Indicaciones: {step.observations}
              </p>
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
                  {date}
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
              {weight != null
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
          {operation.dimensions && (
            <div>
              <dt>Dimensiones</dt>
              <dd>{operation.dimensions}</dd>
            </div>
          )}
          {operation.isContainerized !== true && operation.cargoStatus && (
            <div>
              <dt>Estado de la carga</dt>
              <dd>{formatCodeLabel(operation.cargoStatus)}</dd>
            </div>
          )}
        </dl>
        {operation.cargoDescription && (
          <p className={styles.cargoDescription}>
            {operation.cargoDescription}
          </p>
        )}
      </section>
      {operation.observaciones && (
        <section className={styles.cargoCard}>
          <h3>Indicaciones para el viaje</h3>
          <p className={styles.cargoDescription}>{operation.observaciones}</p>
        </section>
      )}
    </section>
  );
}

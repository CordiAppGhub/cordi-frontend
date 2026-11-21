"use client";

import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { operationService } from "@/services/operation.service";
import { useClients } from "@/hooks/useClient";
import { useLocations } from "@/app/(panel)/locations/hooks/useLocation";
import type { ContainerType } from "@/types/tariff-ypes";
import {
  DEFAULT_CONTAINER_TRAILER_TYPE,
  CARGO_VEHICLE_TYPE_CODES,
  TRAILER_TYPE_OPTIONS,
  TRAILER_TYPES,
  type CargoVehicleTypeCode,
  type TrailerType,
} from "@/types/vehicles";
import { showToast } from "@/utils/alerts";
import { getUserFriendlyErrorMessage } from "@/utils/api-error";
import styles from "./bulk-booking-operation-form.module.css";

const containerTypes: Array<{ value: ContainerType; label: string }> = [
  { value: "DRY_20", label: "20' Dry" },
  { value: "DRY_40", label: "40' Dry" },
  { value: "HC_40", label: "40' HC" },
  { value: "REEFER_20", label: "20' Reefer" },
  { value: "REEFER_40_HC", label: "40' Reefer HC" },
  { value: "OPEN_TOP_20", label: "20' Open Top" },
  { value: "OPEN_TOP_40", label: "40' Open Top" },
  { value: "FLAT_RACK_20", label: "20' Flat Rack" },
  { value: "FLAT_RACK_40", label: "40' Flat Rack" },
  { value: "ISO_TANK_20", label: "20' ISO Tank" },
];

interface ContainerRow {
  key: number;
  containerNumber: string;
  containerType: ContainerType;
  weight: string;
}

interface BulkBookingOperationFormProps {
  onClose: () => void;
}

const getPatioAppointmentError = (value: string): string | null => {
  if (!value) return null;
  const appointment = new Date(value);
  if (Number.isNaN(appointment.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(appointment);
  const getPart = (type: "weekday" | "hour" | "minute") =>
    parts.find((part) => part.type === type)?.value ?? "";
  const weekday = getPart("weekday");
  const time = Number(getPart("hour")) * 60 + Number(getPart("minute"));
  if (
    weekday === "Sun" ||
    (weekday === "Sat" && time > 12 * 60) ||
    (weekday !== "Sat" && weekday !== "Sun" && time > 16 * 60)
  ) {
    return "Horario de patio no válido: lunes a viernes hasta las 4:00 p. m. y sábados hasta las 12:00 m. (domingos cerrado)";
  }
  return null;
};

const toIsoDate = (value: string): string | null =>
  value ? new Date(value).toISOString() : null;

export function BulkBookingOperationForm({
  onClose,
}: BulkBookingOperationFormProps) {
  const queryClient = useQueryClient();
  const { clients, isLoadingClients, error: clientsError } = useClients();
  const {
    locations,
    isLoadingLocations,
    error: locationsError,
  } = useLocations();
  const shippingLinesQuery = useQuery({
    queryKey: ["shipping-lines"],
    queryFn: operationService.getShippingLines,
    staleTime: 5 * 60 * 1000,
  });
  const [type, setType] = useState<"IMPORTACION" | "EXPORTACION">(
    "IMPORTACION",
  );
  const [clientId, setClientId] = useState("");
  const [booking, setBooking] = useState("");
  const [shippingLineId, setShippingLineId] = useState("");
  const [cargoVehicleTypeCode, setCargoVehicleTypeCode] =
    useState<CargoVehicleTypeCode>("2S3");
  const [requiredTrailerType, setRequiredTrailerType] = useState<
    TrailerType | ""
  >(DEFAULT_CONTAINER_TRAILER_TYPE);
  const [routeScope, setRouteScope] = useState<"URBANO" | "NACIONAL">("URBANO");
  const [portId, setPortId] = useState("");
  const [clientLocationId, setClientLocationId] = useState("");
  const [yardId, setYardId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [fechaCitaOrigen, setFechaCitaOrigen] = useState("");
  const [fechaCitaDestino, setFechaCitaDestino] = useState("");
  const [requiresInspection, setRequiresInspection] = useState(false);
  const [containers, setContainers] = useState<ContainerRow[]>([
    { key: 1, containerNumber: "", containerType: "DRY_40", weight: "" },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientLocations = locations.filter((location) =>
    location.clients?.some(
      (relation) =>
        relation.clientId === Number(clientId) &&
        (relation.isClient || relation.isDepot),
    ),
  );
  const ports = locations.filter((location) => location.isPort);
  const yards = locations.filter(
    (location) =>
      !location.isPort &&
      (location.isDepot || location.isOwnYard),
  );
  const yardAppointmentValue =
    type === "EXPORTACION" ? fechaCitaOrigen : fechaCitaDestino;
  const yardAppointmentError = yardId
    ? getPatioAppointmentError(yardAppointmentValue)
    : null;

  const updateContainer = (
    key: number,
    changes: Partial<Omit<ContainerRow, "key">>,
  ) => {
    setContainers((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...changes } : row)),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const numbers = containers
      .map((container) => container.containerNumber.trim().toUpperCase())
      .filter(Boolean);
    const duplicate = numbers.find(
      (number, index) => numbers.indexOf(number) !== index,
    );
    if (duplicate) {
      setError(`El contenedor ${duplicate} aparece más de una vez en el lote.`);
      return;
    }
    if (
      containers.some(
        (container) =>
          !container.weight ||
          !Number.isFinite(Number(container.weight)) ||
          Number(container.weight) <= 0,
      )
    ) {
      setError("Indica el peso de carga de cada contenedor.");
      return;
    }
    if (yardAppointmentError) {
      setError(yardAppointmentError);
      return;
    }
    if (!clientId || !booking.trim() || !shippingLineId || !portId ||
        !clientLocationId || !scheduledAt || containers.length === 0) {
      setError("Completa los datos compartidos y agrega al menos un contenedor.");
      return;
    }
    if (
      (type === "IMPORTACION" && !yardId) ||
      (type === "EXPORTACION" && !yardId)
    ) {
      setError("Selecciona el patio de vacío requerido para esta operación.");
      return;
    }
    for (const number of numbers) {
      if (!/^[A-Z]{4}\d{7}$/.test(number)) {
        setError(`El número ${number} debe tener 4 letras y 7 números.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        clientId: Number(clientId),
        type,
        numeroPedido: booking.trim(),
        shippingLineId: Number(shippingLineId),
        cargoVehicleTypeCode,
        requiredTrailerType: requiredTrailerType || null,
        routeScope,
        origenId: Number(type === "IMPORTACION" ? portId : yardId),
        ...(type === "EXPORTACION"
          ? { cargueId: Number(clientLocationId) }
          : {}),
        destinoId: Number(type === "IMPORTACION" ? clientLocationId : portId),
        ...(type === "IMPORTACION"
          ? { depositoDevolucionId: Number(yardId) }
          : {}),
        scheduledAt: toIsoDate(scheduledAt) as string,
        fechaCitaOrigen: toIsoDate(fechaCitaOrigen),
        fechaCitaDestino: toIsoDate(fechaCitaDestino),
        requiresInspection: type === "IMPORTACION" && requiresInspection,
        containers: containers.map((container) => ({
          containerNumber: container.containerNumber.trim()
            ? container.containerNumber.replace(/\s+/g, "").toUpperCase()
            : null,
          containerType: container.containerType,
          weight: Number(container.weight),
        })),
      };
      const created = await operationService.createBulkOperations(payload);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trafico"] }),
        queryClient.invalidateQueries({ queryKey: ["operations"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      showToast.success(
        `Se crearon ${created.length} operaciones para el Booking ${booking.trim()}.`,
      );
      onClose();
    } catch (submitError: unknown) {
      setError(
        getUserFriendlyErrorMessage(
          submitError,
          "No se pudieron crear las operaciones del Booking.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.modeHeading}>
        <div>
          <strong>Consolidado por Booking</strong>
          <span>Los datos compartidos se aplicarán a cada contenedor.</span>
        </div>
      </div>

      {(clientsError || locationsError || shippingLinesQuery.isError) && (
        <p className={styles.validationError} role="alert">
          {clientsError ||
            locationsError ||
            getUserFriendlyErrorMessage(
              shippingLinesQuery.error,
              "No se pudieron cargar las líneas navieras.",
            )}
        </p>
      )}
      <div className={styles.sharedGrid}>
        <label>
          Cliente *
          <select
            required
            value={clientId}
            onChange={(event) => {
              setClientId(event.target.value);
              setClientLocationId("");
            }}
          >
            <option value="">
              {isLoadingClients ? "Cargando clientes..." : "Selecciona un cliente"}
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.razonSocial}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tipo de operación *
          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value as "IMPORTACION" | "EXPORTACION")
            }
          >
            <option value="IMPORTACION">Importación</option>
            <option value="EXPORTACION">Exportación</option>
          </select>
        </label>
        <label>
          Booking *
          <input
            required
            value={booking}
            onChange={(event) => setBooking(event.target.value)}
            placeholder="Número de Booking"
          />
        </label>
        <label>
          Línea naviera *
          <select
            required
            value={shippingLineId}
            onChange={(event) => setShippingLineId(event.target.value)}
          >
            <option value="">Selecciona una naviera</option>
            {(shippingLinesQuery.data ?? []).map((line) => (
              <option key={line.id} value={line.id}>
                {line.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tipología vehicular requerida *
          <select
            required
            value={cargoVehicleTypeCode}
            onChange={(event) =>
              setCargoVehicleTypeCode(
                CARGO_VEHICLE_TYPE_CODES.find(
                  (code) => code === event.target.value,
                ) ?? "2S3",
              )
            }
          >
            {CARGO_VEHICLE_TYPE_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tipo de tráiler requerido
          <select
            value={requiredTrailerType}
            onChange={(event) =>
              setRequiredTrailerType(
                TRAILER_TYPES.find(
                  (trailerType) => trailerType === event.target.value,
                ) ?? "",
              )
            }
          >
            <option value="">Cualquiera / Sin restricción</option>
            {TRAILER_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Alcance de ruta *
          <select
            value={routeScope}
            onChange={(event) =>
              setRouteScope(event.target.value as "URBANO" | "NACIONAL")
            }
          >
            <option value="URBANO">Urbano</option>
            <option value="NACIONAL">Nacional</option>
          </select>
        </label>
        <label>
          Puerto {type === "IMPORTACION" ? "de origen" : "de destino"} *
          <select
            required
            value={portId}
            onChange={(event) => setPortId(event.target.value)}
          >
            <option value="">
              {isLoadingLocations ? "Cargando ubicaciones..." : "Selecciona un puerto"}
            </option>
            {ports.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ubicación del cliente *
          <select
            required
            value={clientLocationId}
            onChange={(event) => setClientLocationId(event.target.value)}
            disabled={!clientId}
          >
            <option value="">Selecciona una ubicación</option>
            {clientLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Patio de vacío {type === "IMPORTACION" ? "de devolución" : "de retiro"} *
          <select
            required
            value={yardId}
            onChange={(event) => setYardId(event.target.value)}
          >
            <option value="">Selecciona un patio</option>
            {yards.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fecha y hora de operación *
          <input
            required
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
          />
        </label>
        <label>
          Cita de origen
          <input
            type="datetime-local"
            value={fechaCitaOrigen}
            onChange={(event) => setFechaCitaOrigen(event.target.value)}
            placeholder="Opcional · Por confirmar"
          />
          <small>Opcional · Por confirmar</small>
        </label>
        <label>
          Cita de destino
          <input
            type="datetime-local"
            value={fechaCitaDestino}
            onChange={(event) => setFechaCitaDestino(event.target.value)}
            placeholder="Opcional · Por confirmar"
          />
          <small>Opcional · Por confirmar</small>
        </label>
        {type === "IMPORTACION" && (
          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={requiresInspection}
              onChange={(event) => setRequiresInspection(event.target.checked)}
            />
            La línea naviera exige inspección
          </label>
        )}
      </div>

      {yardAppointmentError && (
        <p className={styles.validationError} role="alert">
          {yardAppointmentError}
        </p>
      )}

      <section className={styles.containersSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h3>Contenedores del Booking</h3>
            <p>El número es opcional si la matrícula física aún no está confirmada.</p>
          </div>
          <button
            type="button"
            className={styles.addButton}
            onClick={() =>
              setContainers((rows) => [
                ...rows,
                {
                  key: Math.max(0, ...rows.map((row) => row.key)) + 1,
                  containerNumber: "",
                  containerType: "DRY_40",
                  weight: "",
                },
              ])
            }
          >
            + Agregar contenedor
          </button>
        </div>
        <div className={styles.containerRows}>
          {containers.map((container, index) => (
            <div className={styles.containerRow} key={container.key}>
              <span className={styles.rowNumber}>{index + 1}</span>
              <label>
                Número de contenedor
                <input
                  value={container.containerNumber}
                  onChange={(event) =>
                    updateContainer(container.key, {
                      containerNumber: event.target.value
                        .replace(/\s+/g, "")
                        .toUpperCase(),
                    })
                  }
                  placeholder="Opcional · Ej. MSKU1234567"
                />
              </label>
              <label>
                Tipo de contenedor *
                <select
                  required
                  value={container.containerType}
                  onChange={(event) =>
                    updateContainer(container.key, {
                      containerType: event.target.value as ContainerType,
                    })
                  }
                >
                  {containerTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Peso de carga (kg) *
                <input
                  type="number"
                  min="1"
                  required
                  value={container.weight}
                  onChange={(event) =>
                    updateContainer(container.key, {
                      weight: event.target.value,
                    })
                  }
                  placeholder="Peso en kilogramos"
                />
              </label>
              <button
                type="button"
                className={styles.removeButton}
                aria-label={`Eliminar contenedor ${index + 1}`}
                disabled={containers.length === 1}
                onClick={() =>
                  setContainers((rows) =>
                    rows.filter((row) => row.key !== container.key),
                  )
                }
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p className={styles.validationError} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button type="button" onClick={onClose} disabled={isSaving}>
          Cancelar
        </button>
        <button type="submit" disabled={isSaving || Boolean(yardAppointmentError)}>
          {isSaving ? "Creando operaciones..." : "Crear operaciones"}
        </button>
      </div>
    </form>
  );
}

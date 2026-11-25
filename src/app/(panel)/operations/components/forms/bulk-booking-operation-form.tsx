"use client";

import { useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { operationService } from "@/services/operation.service";
import type {
  BulkContainerType,
  BulkOperationType,
  CreateBulkOperationsPayload,
} from "@/services/operation.service";
import { useClients } from "@/hooks/useClient";
import { useLocations } from "@/app/(panel)/locations/hooks/useLocation";
import { useTariffs } from "../../../tariff/hooks/useTariff";
import {
  CARGO_VEHICLE_TYPE_CODES,
  TRAILER_TYPE_OPTIONS,
  TRAILER_TYPES,
  type CargoVehicleTypeCode,
  type TrailerType,
} from "@/types/vehicles";
import { showToast } from "@/utils/alerts";
import { getUserFriendlyErrorMessage } from "@/utils/api-error";
import styles from "./bulk-booking-operation-form.module.css";
import { operationOptions } from "@/app/constants/operation.constants";

const containerTypes: Array<{ value: BulkContainerType; label: string }> = [
  { value: "DRY_20", label: "Seco de 20'" },
  { value: "DRY_40", label: "Seco de 40'" },
  { value: "HC_40", label: "Alta cubicación de 40' (HC)" },
  { value: "REEFER_20", label: "Refrigerado de 20'" },
  { value: "REEFER_40_HC", label: "Refrigerado de 40' HC" },
  { value: "OPEN_TOP_20", label: "Techo abierto de 20'" },
  { value: "OPEN_TOP_40", label: "Techo abierto de 40'" },
  { value: "FLAT_RACK_20", label: "Plataforma de 20'" },
  { value: "FLAT_RACK_40", label: "Plataforma de 40'" },
  { value: "ISO_TANK_20", label: "Tanque ISO de 20'" },
];

const operationTypes = operationOptions;

interface ContainerRow {
  key: number;
  cargoDescription: string;
  containerNumber: string;
  containerType: BulkContainerType;
  weight: string;
  cargoVehicleTypeCode: CargoVehicleTypeCode;
  requiredTrailerType: TrailerType | "";
  scheduledAt: string;
  fechaCitaOrigen: string;
  fechaCitaDestino: string;
  fechaRetiro: string;
}

interface BulkBookingOperationFormProps {
  onClose: () => void;
}

const INVALID_YARD_APPOINTMENT_MESSAGE =
  "Horario de patio no válido: de lunes a viernes hasta las 4:00 p. m., los sábados hasta las 12:00 m. y los domingos cerrado.";

const getPatioAppointmentError = (value: string): string | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const weekday = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  ).getUTCDay();
  const minutes = Number(hour) * 60 + Number(minute);
  return weekday === 0 ||
    (weekday === 6 && minutes > 720) ||
    (weekday > 0 && weekday < 6 && minutes > 960)
    ? INVALID_YARD_APPOINTMENT_MESSAGE
    : null;
};

const getContainerLengthFeet = (value: string): 20 | 40 | 45 | null => {
  const match = value.match(/(?:^|_)(20|40|45)(?:_|$)/);
  if (!match) return null;
  const length = Number(match[1]);
  return length === 20 || length === 40 || length === 45 ? length : null;
};

const getContainerTareKg = (value: string): number => {
  const length = getContainerLengthFeet(value);
  return length === 20 ? 2300 : length === 40 ? 3750 : length === 45 ? 4800 : 0;
};

const getTrailerCompatibilityError = (
  containerType: string,
  trailerType: string,
): string | null => {
  const length = getContainerLengthFeet(containerType);
  if (!length || !trailerType) return null;
  const normalized = trailerType.toUpperCase();
  const has20 = /(?:^|\D)20(?:\D|$)/.test(normalized);
  const has40 = /(?:^|\D)40(?:\D|$)/.test(normalized);
  const has45 = /(?:^|\D)45(?:\D|$)/.test(normalized);
  if (has20 && !has40 && !has45 && length > 20) {
    return "El tráiler seleccionado es exclusivo para contenedores de 20' y no admite este tamaño.";
  }
  if (length === 45 && has40 && !has20 && !has45) {
    return "El tráiler seleccionado no admite contenedores de 45'.";
  }
  return null;
};

const toIsoDate = (value: string): string | undefined =>
  value ? new Date(value).toISOString() : undefined;

const createInitialRow = (key: number): ContainerRow => ({
  key,
  cargoDescription: "",
  containerNumber: "",
  containerType: "DRY_40",
  weight: "",
  cargoVehicleTypeCode: "2S3",
  requiredTrailerType: "",
  scheduledAt: "",
  fechaCitaOrigen: "",
  fechaCitaDestino: "",
  fechaRetiro: "",
});

const getRowPayloadWarning = (
  row: ContainerRow,
  vehicleTypes: ReturnType<typeof useTariffs>["vehicleTypes"],
): string | null => {
  const weight = Number(row.weight);
  if (!Number.isFinite(weight) || weight <= 0) return null;
  const configuration = vehicleTypes.find(
    (item) => item.code === row.cargoVehicleTypeCode,
  );
  if (!configuration) return "No se encontró la capacidad vehicular seleccionada.";
  const containerGross = weight + getContainerTareKg(row.containerType);
  if (
    configuration.maxPayloadKg != null &&
    containerGross > configuration.maxPayloadKg
  ) {
    return `El peso bruto estimado del contenedor (${containerGross.toLocaleString("es-CO")} kg, incluida su tara) supera la capacidad de ${configuration.code} (${configuration.maxPayloadKg.toLocaleString("es-CO")} kg).`;
  }
  const equipmentTare =
    "approxTareKg" in configuration &&
    typeof configuration.approxTareKg === "number"
      ? configuration.approxTareKg
      : 0;
  const legalPbv =
    "maxLegalPbvKg" in configuration &&
    typeof configuration.maxLegalPbvKg === "number"
      ? configuration.maxLegalPbvKg
      : null;
  const tolerance =
    "maxTolerancePbvKg" in configuration &&
    typeof configuration.maxTolerancePbvKg === "number"
      ? configuration.maxTolerancePbvKg
      : 0;
  if (legalPbv != null && containerGross + equipmentTare > legalPbv + tolerance) {
    return `El peso bruto estimado del equipo y el contenedor supera el PBV permitido para ${configuration.code}.`;
  }
  return null;
};

const getContainerSizeSummary = (rows: ContainerRow[]): string => {
  const counts = new Map<number, number>();
  for (const row of rows) {
    const length = getContainerLengthFeet(row.containerType);
    if (length !== null) counts.set(length, (counts.get(length) ?? 0) + 1);
  }
  const breakdown = [...counts.entries()]
    .sort(([first], [second]) => second - first)
    .map(([length, count]) => `${count}×${length}'`)
    .join(" + ");
  const totalFeet = rows.reduce(
    (total, row) => total + (getContainerLengthFeet(row.containerType) ?? 0),
    0,
  );
  return `${breakdown || "0 contenedores"} = ${totalFeet} pies`;
};

const getFailedRowNumber = (message: string): number | null => {
  const rowMatch = message.match(/\bfila\s*(\d+)\b/i);
  if (rowMatch) return Number(rowMatch[1]);
  const nestedValidationMatch = message.match(/\bcontainers?\.(\d+)\b/i);
  return nestedValidationMatch ? Number(nestedValidationMatch[1]) + 1 : null;
};

export function BulkBookingOperationForm({
  onClose,
}: BulkBookingOperationFormProps) {
  const queryClient = useQueryClient();
  const submitInProgress = useRef(false);
  const { clients, isLoadingClients, error: clientsError } = useClients();
  const { locations, isLoadingLocations, error: locationsError } = useLocations();
  const { vehicleTypes } = useTariffs();
  const shippingLinesQuery = useQuery({
    queryKey: ["shipping-lines"],
    queryFn: operationService.getShippingLines,
    staleTime: 300000,
  });

  const [operationType, setOperationType] =
    useState<BulkOperationType>("IMPORTACION");
  const [clientId, setClientId] = useState("");
  const [clientLocationId, setClientLocationId] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [yardId, setYardId] = useState("");
  const [portId, setPortId] = useState("");
  const [shippingLineId, setShippingLineId] = useState("");
  const [routeScope, setRouteScope] = useState<"URBANO" | "NACIONAL">("URBANO");
  const [isContainerized, setIsContainerized] = useState(true);
  const [genericOriginId, setGenericOriginId] = useState("");
  const [genericDestinationId, setGenericDestinationId] = useState("");
  const [requiresInspection, setRequiresInspection] = useState(false);
  const [isAnticipada, setIsAnticipada] = useState(false);
  const [fechaLimiteDocumental, setFechaLimiteDocumental] = useState("");
  const [fechaLimiteFisico, setFechaLimiteFisico] = useState("");
  const [containers, setContainers] = useState<ContainerRow[]>([
    createInitialRow(1),
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedRow, setFailedRow] = useState<number | null>(null);

  const clientLocations = locations.filter((location) =>
    location.clients?.some(
      (relation) =>
        relation.clientId === Number(clientId) &&
        (relation.isClient || relation.isDepot),
    ),
  );
  const ports = locations.filter((location) => location.isPort);
  const yards = locations.filter(
    (location) => !location.isPort && (location.isDepot || location.isOwnYard),
  );
  const locationsOptions = locations.map((location) => ({
    id: location.id,
    name: location.name,
  }));
  const type = operationType;
  const isEmptyOperation =
    type === "RETIRO_VACIO" || type === "DEVOLUCION_VACIO";
  const rowErrors = containers.map((row) => {
    if (!clientId) return "Selecciona un cliente.";
    if (
      type === "IMPORTACION" &&
      (!portId || !clientLocationId)
    ) {
      return "La importación requiere puerto de origen y ubicación del cliente.";
    }
    if (
      type === "EXPORTACION" &&
      (!yardId || !clientLocationId || !portId)
    ) {
      return "La exportación requiere patio de retiro, ubicación de cargue y puerto de destino.";
    }
    if (isAnticipada && !row.fechaRetiro) {
      return "La exportación anticipada requiere fecha de retiro.";
    }
    if (type === "RETIRO_VACIO" && (!portId || !yardId)) {
      return "El retiro de vacío requiere puerto y patio de destino.";
    }
    if (
      type === "DEVOLUCION_VACIO" &&
      (!clientLocationId || (!yardId && !portId))
    ) {
      return "La devolución de vacío requiere ubicación de origen y patio o puerto de destino.";
    }
    if (
      (type === "NACIONAL" || type === "MOVIMIENTO_INTERNO") &&
      !genericOriginId
    ) {
      return "Selecciona el origen de la operación.";
    }
    if (
      (type === "NACIONAL" || type === "MOVIMIENTO_INTERNO") &&
      !genericDestinationId
    ) {
      return "Selecciona el destino de la operación.";
    }
    if (
      (type === "IMPORTACION" || type === "EXPORTACION") &&
      !numeroPedido.trim()
    ) {
      return "Las importaciones y exportaciones requieren Booking, BL, DO o número de pedido.";
    }
    if (type !== "DEVOLUCION_VACIO" && !shippingLineId) {
      return "Selecciona la línea naviera requerida.";
    }
    if (
      !isEmptyOperation &&
      (!row.weight || !Number.isFinite(Number(row.weight)) || Number(row.weight) <= 0)
    ) {
      return "Indica un peso neto mayor que cero para este contenedor.";
    }
    if (
      row.weight &&
      (!Number.isFinite(Number(row.weight)) || Number(row.weight) < 0)
    ) {
      return "El peso debe ser igual o mayor que cero.";
    }
    if (!isContainerized && !row.cargoDescription.trim()) {
      return "Describe la carga suelta de esta unidad.";
    }
    if (
      row.containerNumber.trim() &&
      isContainerized &&
      !/^[A-Z]{4}\d{7}$/.test(row.containerNumber.replace(/\s+/g, "").toUpperCase())
    ) {
      return "El número de contenedor debe tener 4 letras y 7 números.";
    }
    const trailerError = getTrailerCompatibilityError(
      row.containerType,
      row.requiredTrailerType,
    );
    if (trailerError) return trailerError;
    const payloadWarning = getRowPayloadWarning(row, vehicleTypes);
    if (payloadWarning) return payloadWarning;
    const originAppointmentError = getPatioAppointmentError(row.fechaCitaOrigen);
    if (originAppointmentError) return originAppointmentError;
    const destinationAppointmentError = getPatioAppointmentError(row.fechaCitaDestino);
    if (destinationAppointmentError) return destinationAppointmentError;
    if (isAnticipada) {
      const retirementError = getPatioAppointmentError(row.fechaRetiro);
      if (retirementError) return retirementError;
    }
    if (
      row.scheduledAt &&
      Number.isNaN(new Date(row.scheduledAt).getTime())
    ) {
      return "La cita en puerto no tiene una fecha válida.";
    }
    return null;
  });

  const updateContainer = (
    key: number,
    changes: Partial<Omit<ContainerRow, "key">>,
  ) => {
    setContainers((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...changes } : row)),
    );
  };

  const buildPayload = (): CreateBulkOperationsPayload => ({
    clientId: Number(clientId),
    type: operationType,
    operationType,
    numeroPedido: numeroPedido.trim(),
    fechaLimiteDocumental: toIsoDate(fechaLimiteDocumental) ?? null,
    fechaLimiteFisico: toIsoDate(fechaLimiteFisico) ?? null,
    fechaLimiteDevolucion: toIsoDate(fechaLimiteFisico) ?? null,
    isContainerized,
    shippingLineId: shippingLineId ? Number(shippingLineId) : undefined,
    routeScope,
    portId: portId ? Number(portId) : undefined,
    clientLocationId: clientLocationId ? Number(clientLocationId) : undefined,
    yardId: yardId ? Number(yardId) : undefined,
    requiresInspection:
      operationType === "IMPORTACION" && requiresInspection,
    containers: containers.map((row) => {
      const route =
        type === "IMPORTACION"
          ? {
              origenId: Number(portId),
              destinoId: Number(clientLocationId),
              depositoDevolucionId: yardId ? Number(yardId) : undefined,
            }
          : type === "EXPORTACION"
            ? {
                origenId: Number(yardId),
                cargueId: Number(clientLocationId),
                destinoId: Number(portId),
                destinoTemporalId:
                  isAnticipada && yardId
                    ? Number(yardId)
                    : undefined,
              }
            : type === "RETIRO_VACIO"
              ? { origenId: Number(portId), destinoId: Number(yardId) }
              : type === "DEVOLUCION_VACIO"
                ? {
                    origenId: Number(clientLocationId),
                    destinoId: Number(yardId || portId),
                  }
                : {
                    origenId: Number(genericOriginId),
                    destinoId: Number(genericDestinationId),
                  };
      return {
        operationType,
        containerNumber: row.containerNumber.trim()
          ? row.containerNumber.replace(/\s+/g, "").toUpperCase()
          : null,
        containerType: isContainerized ? row.containerType : undefined,
        weight: row.weight ? Number(row.weight) : 0,
        cargoVehicleTypeCode: row.cargoVehicleTypeCode,
        requiredTrailerType: row.requiredTrailerType || null,
        cargoDescription: isContainerized
          ? undefined
          : row.cargoDescription.trim() || "Carga suelta",
        vehicleId: null,
        driverId: null,
        scheduledAt: toIsoDate(row.scheduledAt) ?? null,
        fechaCitaOrigen: toIsoDate(row.fechaCitaOrigen) ?? null,
        fechaCitaDestino: toIsoDate(row.fechaCitaDestino) ?? null,
        fechaRetiro: toIsoDate(row.fechaRetiro) ?? null,
        isAnticipada,
        requiresInspection:
          operationType === "IMPORTACION" && requiresInspection,
        ...route,
      };
    }),
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitInProgress.current) return;
    setError(null);
    setFailedRow(null);

    const normalizedNumbers = containers.map((row) =>
      row.containerNumber.replace(/\s+/g, "").toUpperCase(),
    );
    const duplicate = normalizedNumbers.find(
      (value, index) => value && normalizedNumbers.indexOf(value) !== index,
    );
    if (duplicate) {
      const duplicateRows = normalizedNumbers
        .map((value, index) => (value === duplicate ? index + 1 : null))
        .filter((index): index is number => index !== null);
      const message = `El contenedor ${duplicate} está duplicado en las filas ${duplicateRows.join(" y ")}.`;
      setError(message);
      showToast.error(message);
      return;
    }

    const firstInvalidIndex = rowErrors.findIndex(Boolean);
    if (firstInvalidIndex >= 0) {
      const message = `Fila ${firstInvalidIndex + 1}: ${rowErrors[firstInvalidIndex]}`;
      setFailedRow(firstInvalidIndex + 1);
      setError(message);
      showToast.error(message);
      return;
    }

    submitInProgress.current = true;
    setIsSaving(true);
    try {
      const created = await operationService.createBulkOperations(buildPayload());
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trafico"] }),
        queryClient.invalidateQueries({ queryKey: ["operations"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      showToast.success(
        `Se crearon ${created.length} operaciones independientes para ${numeroPedido.trim() || "el lote"}.`,
      );
      onClose();
    } catch (submitError: unknown) {
      const message = getUserFriendlyErrorMessage(
        submitError,
        "No se pudieron crear las operaciones del lote.",
      );
      setFailedRow(getFailedRowNumber(message));
      setError(message);
      showToast.error(message);
    } finally {
      submitInProgress.current = false;
      setIsSaving(false);
    }
  };

  const addContainer = () =>
    setContainers((rows) => [
      ...rows,
      createInitialRow(Math.max(0, ...rows.map((row) => row.key)) + 1),
    ]);

  const totalWeight = containers.reduce(
    (total, row) => total + (Number(row.weight) || 0),
    0,
  );

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <header className={styles.modeHeading}>
        <div>
          <strong>Creación masiva por contenedor</strong>
          <span>
            Cada fila crea una operación independiente. La asignación de flota
            queda a cargo del Jefe de Flota.
          </span>
        </div>
      </header>

      {(clientsError ||
        locationsError ||
        shippingLinesQuery.isError) && (
        <p className={styles.validationError} role="alert">
          {clientsError ||
            locationsError ||
            getUserFriendlyErrorMessage(
              shippingLinesQuery.error,
              "No se pudieron cargar los datos del formulario.",
            )}
        </p>
      )}

      <section className={styles.sharedSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h3>Bloque 1 — Datos principales del lote</h3>
            <p>Estos datos identifican el lote y definen su ruta común.</p>
          </div>
        </div>
        <div className={styles.sharedGrid}>
          <label>
            Tipo de operación
            <select
              value={operationType}
              onChange={(event) => {
                const nextType = operationTypes.find(
                  (option) => option.value === event.target.value,
                )?.value;
                if (nextType) setOperationType(nextType);
              }}
            >
              {operationTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cliente
            <select
              required
              value={clientId}
              onChange={(event) => {
                setClientId(event.target.value);
                setClientLocationId("");
              }}
              disabled={isLoadingClients}
            >
              <option value="">Selecciona un cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.razonSocial}
                </option>
              ))}
            </select>
          </label>
          {(type === "IMPORTACION" ||
            type === "EXPORTACION" ||
            type === "DEVOLUCION_VACIO") && (
            <label>
              Ubicación del cliente
              <select
                value={clientLocationId}
                onChange={(event) => setClientLocationId(event.target.value)}
                disabled={!clientId || isLoadingLocations}
              >
                <option value="">Selecciona una ubicación</option>
                {clientLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {(type === "IMPORTACION" || type === "EXPORTACION") && (
            <>
              <label>
                Booking / BL / DO / Número de pedido
                <input
                  value={numeroPedido}
                  onChange={(event) => setNumeroPedido(event.target.value)}
                  placeholder="Referencia unificada del lote"
                />
              </label>
              <label>
                Alcance de ruta
                <select
                  value={routeScope}
                  onChange={(event) =>
                    setRouteScope(
                      event.target.value === "NACIONAL" ? "NACIONAL" : "URBANO",
                    )
                  }
                >
                  <option value="URBANO">Urbano</option>
                  <option value="NACIONAL">Nacional</option>
                </select>
              </label>
            </>
          )}
          {(type === "IMPORTACION" ||
            type === "EXPORTACION" ||
            type === "RETIRO_VACIO" ||
            type === "DEVOLUCION_VACIO") && (
            <label>
              Patio de vacíos
              <select value={yardId} onChange={(event) => setYardId(event.target.value)}>
                <option value="">Selecciona un patio</option>
                {yards.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {(type === "IMPORTACION" ||
            type === "EXPORTACION" ||
            type === "RETIRO_VACIO" ||
            type === "DEVOLUCION_VACIO") && (
            <label>
              Puerto
              <select value={portId} onChange={(event) => setPortId(event.target.value)}>
                <option value="">Selecciona un puerto</option>
                {ports.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {isContainerized && type !== "DEVOLUCION_VACIO" && (
            <label>
              Línea naviera
              <select
                value={shippingLineId}
                onChange={(event) => setShippingLineId(event.target.value)}
                disabled={shippingLinesQuery.isLoading}
              >
                <option value="">Selecciona una línea naviera</option>
                {(shippingLinesQuery.data ?? []).map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={isContainerized}
              onChange={(event) => setIsContainerized(event.target.checked)}
            />
            Carga Contenerizada
          </label>
          <label>
            Cierre documental
            <input
              type="date"
              value={fechaLimiteDocumental}
              onChange={(event) =>
                setFechaLimiteDocumental(event.target.value)
              }
            />
          </label>
          <label>
            Cierre físico
            <input
              type="date"
              value={fechaLimiteFisico}
              onChange={(event) => setFechaLimiteFisico(event.target.value)}
            />
          </label>
          {(type === "NACIONAL" || type === "MOVIMIENTO_INTERNO") && (
            <>
              <label>
                Origen
                <select
                  value={genericOriginId}
                  onChange={(event) => setGenericOriginId(event.target.value)}
                >
                  <option value="">Selecciona un origen</option>
                  {locationsOptions.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Destino
                <select
                  value={genericDestinationId}
                  onChange={(event) => setGenericDestinationId(event.target.value)}
                >
                  <option value="">Selecciona un destino</option>
                  {locationsOptions.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Alcance de ruta
                <select
                  value={routeScope}
                  onChange={(event) =>
                    setRouteScope(
                      event.target.value === "NACIONAL" ? "NACIONAL" : "URBANO",
                    )
                  }
                >
                  <option value="URBANO">Urbano</option>
                  <option value="NACIONAL">Nacional</option>
                </select>
              </label>
            </>
          )}
          {operationType === "IMPORTACION" && isContainerized && (
            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={requiresInspection}
                onChange={(event) => setRequiresInspection(event.target.checked)}
              />
              La naviera exige inspección
            </label>
          )}
          {operationType === "EXPORTACION" && isContainerized && (
            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={isAnticipada}
                onChange={(event) => setIsAnticipada(event.target.checked)}
              />
              ¿Es Exportación Anticipada?
            </label>
          )}
        </div>
      </section>

      <section className={styles.summary} aria-live="polite">
        <strong>Resumen en vivo del lote</strong>
        <span>
          {isContainerized
            ? `${getContainerSizeSummary(containers)} · `
            : `${containers.length} cargas sueltas · `}
          {containers.length} unidades ·{" "}
          {totalWeight.toLocaleString("es-CO")} kg netos
        </span>
      </section>

      <section className={styles.containersSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h3>Bloque 2 — Contenedores del lote</h3>
            <p>Define el tamaño, peso, equipo requerido y citas para cada operación.</p>
          </div>
          <button
            type="button"
            className={styles.addButton}
            onClick={addContainer}
            disabled={isSaving}
          >
            <Plus size={16} aria-hidden="true" />
            Agregar contenedor
          </button>
        </div>
        <div className={styles.containerRows}>
          {containers.map((row, index) => (
            <article className={styles.containerCard} key={row.key}>
              <div className={styles.containerCardHeader}>
                <span className={styles.rowNumber}>{index + 1}</span>
                <h4>Operación {index + 1}</h4>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() =>
                    setContainers((rows) =>
                      rows.filter((item) => item.key !== row.key),
                    )
                  }
                  disabled={containers.length <= 1 || isSaving}
                  aria-label={`Eliminar fila ${index + 1}`}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
              <div className={styles.containerRow}>
                {isContainerized ? (
                <label>
                  Tamaño / tipo
                  <select
                    value={row.containerType}
                    onChange={(event) => {
                      const next = containerTypes.find(
                        (item) => item.value === event.target.value,
                      )?.value;
                      if (next) updateContainer(row.key, { containerType: next });
                    }}
                  >
                    {containerTypes.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                ) : (
                  <label>
                    Descripción de la carga suelta
                    <input
                      value={row.cargoDescription}
                      onChange={(event) =>
                        updateContainer(row.key, {
                          cargoDescription: event.target.value,
                        })
                      }
                      placeholder="Ej: Maquinaria, carga general"
                    />
                  </label>
                )}
                {isContainerized && (
                <label>
                  Número de contenedor (opcional)
                  <input
                    value={row.containerNumber}
                    onChange={(event) =>
                      updateContainer(row.key, {
                        containerNumber: event.target.value,
                      })
                    }
                    placeholder="ABCD1234567"
                  />
                </label>
                )}
                <label>
                  Peso neto (kg)
                  <input
                    type="number"
                    min="0"
                    value={row.weight}
                    onChange={(event) =>
                      updateContainer(row.key, { weight: event.target.value })
                    }
                    placeholder={isEmptyOperation ? "Opcional" : "Requerido"}
                  />
                </label>
                <label>
                  Tipología de cabezote
                  <select
                    value={row.cargoVehicleTypeCode}
                    onChange={(event) => {
                      const code = CARGO_VEHICLE_TYPE_CODES.find(
                        (candidate) => candidate === event.target.value,
                      );
                      if (code) updateContainer(row.key, { cargoVehicleTypeCode: code });
                    }}
                  >
                    {CARGO_VEHICLE_TYPE_CODES.map((code) => {
                      const configuration = vehicleTypes.find(
                        (item) => item.code === code,
                      );
                      const capacity =
                        configuration?.maxPayloadKg == null
                          ? "sin capacidad publicada"
                          : `hasta ${configuration.maxPayloadKg.toLocaleString("es-CO")} kg`;
                      return (
                        <option key={code} value={code}>
                          {code} · {capacity}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <label>
                  Tipo de tráiler requerido
                  <select
                    value={row.requiredTrailerType}
                    onChange={(event) => {
                      const trailerType = TRAILER_TYPES.find(
                        (value) => value === event.target.value,
                      );
                      updateContainer(row.key, {
                        requiredTrailerType: trailerType ?? "",
                      });
                    }}
                  >
                    <option value="">Cualquiera o sin restricción</option>
                    {TRAILER_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Programación
                  <input
                    type="datetime-local"
                    value={row.scheduledAt}
                    placeholder="Por confirmar con cliente"
                    onChange={(event) =>
                      updateContainer(row.key, { scheduledAt: event.target.value })
                    }
                  />
                </label>
                <label>
                  Cita en origen
                  <input
                    type="datetime-local"
                    value={row.fechaCitaOrigen}
                    placeholder="Por confirmar con cliente"
                    onChange={(event) =>
                      updateContainer(row.key, {
                        fechaCitaOrigen: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Cita en destino
                  <input
                    type="datetime-local"
                    value={row.fechaCitaDestino}
                    placeholder="Por confirmar con cliente"
                    onChange={(event) =>
                      updateContainer(row.key, {
                        fechaCitaDestino: event.target.value,
                      })
                    }
                  />
                </label>
                {isAnticipada && (
                  <label>
                    Fecha de retiro anticipado
                    <input
                      type="datetime-local"
                      value={row.fechaRetiro}
                      onChange={(event) =>
                        updateContainer(row.key, {
                          fechaRetiro: event.target.value,
                        })
                      }
                    />
                  </label>
                )}
              </div>
              {rowErrors[index] && (
                <p className={styles.validationWarning} role="status">
                  Fila {index + 1}: {rowErrors[index]}
                </p>
              )}
              {failedRow === index + 1 && error && (
                <p className={styles.validationError} role="alert">
                  {error}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      {error && failedRow === null && (
        <p className={styles.validationError} role="alert">
          {error}
        </p>
      )}

      <footer className={styles.actions}>
        <button type="button" onClick={onClose} disabled={isSaving}>
          Cancelar
        </button>
        <button type="submit" disabled={isSaving}>
          {isSaving ? "Creando operaciones..." : "Crear operaciones"}
        </button>
      </footer>
    </form>
  );
}

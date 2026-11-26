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

type BulkOperationChoice = BulkOperationType | "EXPORTACION_ANTICIPADA";

const operationTypes: Array<{
  value: BulkOperationChoice;
  label: string;
}> = [
  ...operationOptions,
  { value: "EXPORTACION_ANTICIPADA", label: "Exportación anticipada" },
  { value: "NACIONAL", label: "Nacional" },
];

interface OperationRow {
  key: number;
  operationType: BulkOperationChoice;
  isContainerized: boolean;
  containerNumber: string;
  containerType: BulkContainerType;
  weight: string;
  cargoVehicleTypeCode: CargoVehicleTypeCode;
  requiredTrailerType: TrailerType | "";
  scheduledAt: string;
  cargoDescription: string;
  packageType: string;
  packageCount: string;
  dimensions: string;
  volumeM3: string;
  originId: string;
  destinationId: string;
  requiresInspection: boolean;
}

interface BulkBookingOperationFormProps {
  onClose: () => void;
}

const toIsoDate = (value: string): string | undefined =>
  value ? new Date(value).toISOString() : undefined;

const getOperationType = (
  value: BulkOperationChoice,
): BulkOperationType =>
  value === "EXPORTACION_ANTICIPADA" ? "EXPORTACION" : value;

const isAdvanceExport = (row: OperationRow): boolean =>
  row.operationType === "EXPORTACION_ANTICIPADA";

const isEmptyOperation = (row: OperationRow): boolean => {
  const type = getOperationType(row.operationType);
  return type === "RETIRO_VACIO" || type === "DEVOLUCION_VACIO";
};

const createInitialRow = (key: number): OperationRow => ({
  key,
  operationType: "IMPORTACION",
  isContainerized: true,
  containerNumber: "",
  containerType: "DRY_40",
  weight: "",
  cargoVehicleTypeCode: "2S3",
  requiredTrailerType: "",
  scheduledAt: "",
  cargoDescription: "",
  packageType: "",
  packageCount: "",
  dimensions: "",
  volumeM3: "",
  originId: "",
  destinationId: "",
  requiresInspection: false,
});

const getContainerLengthFeet = (
  value: string,
): 20 | 40 | 45 | null => {
  const match = value.match(/(?:^|_)(20|40|45)(?:_|$)/);
  if (!match) return null;
  const length = Number(match[1]);
  return length === 20 || length === 40 || length === 45 ? length : null;
};

const getContainerTareKg = (value: string): number => {
  const length = getContainerLengthFeet(value);
  return length === 20 ? 2300 : length === 40 ? 3750 : length === 45 ? 4800 : 0;
};

const getContainerSizeSummary = (rows: OperationRow[]): string => {
  const counts = new Map<number, number>();
  const containerRows = rows.filter((row) => row.isContainerized);
  for (const row of containerRows) {
    const length = getContainerLengthFeet(row.containerType);
    if (length !== null) counts.set(length, (counts.get(length) ?? 0) + 1);
  }
  const breakdown = [...counts.entries()]
    .sort(([first], [second]) => second - first)
    .map(([length, count]) => `${count}×${length}'`)
    .join(" + ");
  return breakdown || "0 contenedores";
};

const getRowPayloadWarning = (
  row: OperationRow,
  vehicleTypes: ReturnType<typeof useTariffs>["vehicleTypes"],
): string | null => {
  if (!row.isContainerized) return null;
  const weight = Number(row.weight);
  if (!Number.isFinite(weight) || weight <= 0) return null;
  const configuration = vehicleTypes.find(
    (item) => item.code === row.cargoVehicleTypeCode,
  );
  if (!configuration) return "No se encontró la tipología vehicular seleccionada.";
  const containerGross = weight + getContainerTareKg(row.containerType);
  if (
    configuration.maxPayloadKg != null &&
    containerGross > configuration.maxPayloadKg
  ) {
    return `El peso bruto estimado del contenedor (${containerGross.toLocaleString("es-CO")} kg, incluida su tara) supera la capacidad de ${configuration.code} (${configuration.maxPayloadKg.toLocaleString("es-CO")} kg).`;
  }
  const equipmentTare =
    typeof configuration.approxTareKg === "number"
      ? configuration.approxTareKg
      : 0;
  const legalPbv =
    typeof configuration.maxLegalPbvKg === "number"
      ? configuration.maxLegalPbvKg
      : null;
  const tolerance =
    typeof configuration.maxTolerancePbvKg === "number"
      ? configuration.maxTolerancePbvKg
      : 0;
  if (legalPbv != null && containerGross + equipmentTare > legalPbv + tolerance) {
    return `El peso bruto estimado del equipo y el contenedor supera el PBV permitido para ${configuration.code}.`;
  }
  return null;
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

  const [clientId, setClientId] = useState("");
  const [clientLocationId, setClientLocationId] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [yardId, setYardId] = useState("");
  const [portId, setPortId] = useState("");
  const [shippingLineId, setShippingLineId] = useState("");
  const [routeScope, setRouteScope] = useState<"URBANO" | "NACIONAL">("URBANO");
  const [fechaLimiteDocumental, setFechaLimiteDocumental] = useState("");
  const [fechaLimiteFisico, setFechaLimiteFisico] = useState("");
  const [operations, setOperations] = useState<OperationRow[]>([
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
  const hasContainerizedRows = operations.some((row) => row.isContainerized);
  const rowsRequiringPort = operations.some((row) =>
    ["IMPORTACION", "EXPORTACION", "EXPORTACION_ANTICIPADA", "RETIRO_VACIO"].includes(
      row.operationType,
    ),
  );
  const requiresShippingLine = operations.some(
    (row) =>
      row.isContainerized &&
      getOperationType(row.operationType) !== "DEVOLUCION_VACIO",
  );

  const updateOperation = (
    key: number,
    changes: Partial<Omit<OperationRow, "key">>,
  ) => {
    setOperations((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...changes } : row)),
    );
  };

  const rowErrors = operations.map((row) => {
    const type = getOperationType(row.operationType);
    const isAnticipada = isAdvanceExport(row);
    if (!clientId) return "Selecciona un cliente.";
    if (!numeroPedido.trim()) return "Indica el número de pedido o Booking compartido.";
    if (!clientLocationId) return "Selecciona la ubicación del cliente.";
    if (
      ["IMPORTACION", "EXPORTACION", "RETIRO_VACIO"].includes(type) &&
      !portId
    ) {
      return "Selecciona el puerto requerido por esta operación.";
    }
    if (row.isContainerized && !yardId) {
      return "Selecciona el patio de vacíos compartido para las operaciones contenerizadas.";
    }
    if (
      row.isContainerized &&
      type !== "DEVOLUCION_VACIO" &&
      !shippingLineId
    ) {
      return "Selecciona la línea naviera requerida.";
    }
    if (
      (type === "RETIRO_VACIO" || type === "DEVOLUCION_VACIO") &&
      !row.isContainerized
    ) {
      return "El retiro y la devolución de vacío deben ser contenerizados.";
    }
    if (
      type === "NACIONAL" ||
      type === "MOVIMIENTO_INTERNO"
    ) {
      if (!row.originId) return "Selecciona el origen de la operación.";
      if (!row.destinationId) return "Selecciona el destino de la operación.";
    }
    if (
      !isEmptyOperation(row) &&
      (!row.weight ||
        !Number.isFinite(Number(row.weight)) ||
        Number(row.weight) <= 0)
    ) {
      return "Indica un peso mayor que cero para esta operación.";
    }
    if (
      row.weight &&
      (!Number.isFinite(Number(row.weight)) || Number(row.weight) < 0)
    ) {
      return "El peso debe ser igual o mayor que cero.";
    }
    if (row.isContainerized) {
      const containerNumber = row.containerNumber
        .replace(/\s+/g, "")
        .toUpperCase();
      if (containerNumber && !/^[A-Z]{4}\d{7}$/.test(containerNumber)) {
        return "El número de contenedor debe tener 4 letras y 7 números.";
      }
      const payloadWarning = getRowPayloadWarning(row, vehicleTypes);
      if (payloadWarning) return payloadWarning;
    } else {
      if (!row.cargoDescription.trim()) {
        return "Describe la mercancía de la carga suelta.";
      }
      if (!row.packageType.trim()) return "Indica el tipo de empaque.";
      if (!row.packageCount || Number(row.packageCount) < 1) {
        return "Indica la cantidad de bultos.";
      }
      if (!row.dimensions.trim()) return "Indica las dimensiones de la mercancía.";
      if (!row.volumeM3 || Number(row.volumeM3) <= 0) {
        return "Indica un volumen mayor que cero.";
      }
    }
    if (row.scheduledAt && Number.isNaN(new Date(row.scheduledAt).getTime())) {
      return "La fecha de programación no es válida.";
    }
    if (isAnticipada && !row.isContainerized) {
      return "La exportación anticipada solo aplica a operaciones contenerizadas.";
    }
    if (isAnticipada && !row.scheduledAt) {
      return "La exportación anticipada requiere fecha de programación para el retiro.";
    }
    return null;
  });

  const buildPayload = (): CreateBulkOperationsPayload => {
    const firstType = getOperationType(operations[0].operationType);
    return {
      clientId: Number(clientId),
      type: firstType,
      operationType: firstType,
      numeroPedido: numeroPedido.trim(),
      fechaLimiteDocumental: toIsoDate(fechaLimiteDocumental) ?? null,
      fechaLimiteFisico: toIsoDate(fechaLimiteFisico) ?? null,
      fechaLimiteDevolucion: toIsoDate(fechaLimiteFisico) ?? null,
      shippingLineId: requiresShippingLine ? Number(shippingLineId) : undefined,
      routeScope,
      portId: portId ? Number(portId) : undefined,
      clientLocationId: Number(clientLocationId),
      yardId: hasContainerizedRows && yardId ? Number(yardId) : undefined,
      containers: operations.map((row) => {
        const type = getOperationType(row.operationType);
        const isAnticipada = isAdvanceExport(row);
        const route =
          type === "IMPORTACION"
            ? {
                origenId: Number(portId),
                destinoId: Number(clientLocationId),
                depositoDevolucionId:
                  row.isContainerized && yardId ? Number(yardId) : undefined,
              }
            : type === "EXPORTACION"
              ? {
                  origenId: Number(
                    row.isContainerized ? yardId : clientLocationId,
                  ),
                  cargueId: row.isContainerized
                    ? Number(clientLocationId)
                    : undefined,
                  destinoId: Number(portId),
                  destinoTemporalId:
                    isAnticipada && yardId ? Number(yardId) : undefined,
                }
              : type === "RETIRO_VACIO"
                ? {
                    origenId: Number(portId),
                    destinoId: Number(yardId),
                  }
                : type === "DEVOLUCION_VACIO"
                  ? {
                      origenId: Number(clientLocationId),
                      destinoId: Number(yardId || portId),
                    }
                  : {
                      origenId: Number(row.originId),
                      destinoId: Number(row.destinationId),
                    };
        const scheduledAt = toIsoDate(row.scheduledAt) ?? null;
        return {
          operationType: type,
          isContainerized: row.isContainerized,
          containerNumber: row.isContainerized
            ? row.containerNumber.replace(/\s+/g, "").toUpperCase() || null
            : null,
          containerType: row.isContainerized ? row.containerType : undefined,
          cargoDescription: row.isContainerized
            ? undefined
            : row.cargoDescription.trim(),
          weight: row.weight ? Number(row.weight) : undefined,
          dimensions: row.isContainerized ? undefined : row.dimensions.trim(),
          packageType: row.isContainerized
            ? undefined
            : row.packageType.trim(),
          packageCount: row.isContainerized
            ? undefined
            : Number(row.packageCount),
          volumeM3: row.isContainerized ? undefined : Number(row.volumeM3),
          cargoVehicleTypeCode: row.cargoVehicleTypeCode,
          requiredTrailerType: row.isContainerized
            ? row.requiredTrailerType || null
            : null,
          vehicleId: null,
          driverId: null,
          scheduledAt,
          fechaRetiro: isAnticipada ? scheduledAt : undefined,
          isAnticipada,
          requiresInspection: row.requiresInspection,
          ...route,
        };
      }),
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitInProgress.current) return;
    setError(null);
    setFailedRow(null);

    const containerNumbers = operations.map((row) =>
      row.isContainerized
        ? row.containerNumber.replace(/\s+/g, "").toUpperCase()
        : "",
    );
    const duplicate = containerNumbers.find(
      (value, index) => value && containerNumbers.indexOf(value) !== index,
    );
    if (duplicate) {
      const duplicateRows = containerNumbers
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
        `Se crearon ${created.length} operaciones independientes para ${numeroPedido.trim()}.`,
      );
      onClose();
    } catch (submitError: unknown) {
      const message = getUserFriendlyErrorMessage(
        submitError,
        "No se pudieron crear las operaciones del consolidado.",
      );
      setFailedRow(getFailedRowNumber(message));
      setError(message);
      showToast.error(message);
    } finally {
      submitInProgress.current = false;
      setIsSaving(false);
    }
  };

  const addOperation = () =>
    setOperations((rows) => [
      ...rows,
      createInitialRow(Math.max(0, ...rows.map((row) => row.key)) + 1),
    ]);

  const totalWeight = operations.reduce(
    (total, row) => total + (Number(row.weight) || 0),
    0,
  );
  const looseCargoCount = operations.filter((row) => !row.isContainerized).length;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <header className={styles.modeHeading}>
        <div>
          <strong>Creación de operaciones en consolidado</strong>
          <span>
            El pedido y la ruta se comparten; cada sección crea una operación
            independiente y puede ser contenerizada o carga suelta.
          </span>
        </div>
      </header>

      {(clientsError ||
        locationsError ||
        (requiresShippingLine && shippingLinesQuery.isError)) && (
        <p className={styles.validationError} role="alert">
          {clientsError ||
            locationsError ||
            getUserFriendlyErrorMessage(
              shippingLinesQuery.error,
              "No se pudieron cargar las líneas navieras.",
            )}
        </p>
      )}

      <section className={styles.sharedSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h3>Datos compartidos del pedido</h3>
            <p>La referencia, el cliente y el alcance aplican a todas las unidades.</p>
          </div>
        </div>
        <div className={styles.sharedGrid}>
          <label>
            Número de pedido / Booking
            <input
              required
              value={numeroPedido}
              onChange={(event) => setNumeroPedido(event.target.value)}
              placeholder="Referencia unificada del lote"
            />
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
          <label>
            Ubicación del cliente (planta / bodega)
            <select
              required
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
          <label>
            Puerto
            <select
              required={rowsRequiringPort}
              value={portId}
              onChange={(event) => setPortId(event.target.value)}
              disabled={isLoadingLocations}
            >
              <option value="">Selecciona un puerto</option>
              {ports.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
          {hasContainerizedRows && (
            <label>
              Patio de vacíos
              <select
                required
                value={yardId}
                onChange={(event) => setYardId(event.target.value)}
                disabled={isLoadingLocations}
              >
                <option value="">Selecciona un patio</option>
                {yards.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {requiresShippingLine && (
            <label>
              Línea naviera
              <select
                required
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
        </div>
      </section>

      <section className={styles.summary} aria-live="polite">
        <strong>Resumen del pedido</strong>
        <span>
          {getContainerSizeSummary(operations)} · {looseCargoCount} cargas sueltas
          · {operations.length} operaciones · {totalWeight.toLocaleString("es-CO")} kg
          netos
        </span>
      </section>

      <section className={styles.containersSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h3>Unidades del pedido</h3>
            <p>Define el tipo, la carga y la programación de cada operación. Las citas se completan luego en Editar.</p>
          </div>
          <button
            type="button"
            className={styles.addButton}
            onClick={addOperation}
            disabled={isSaving}
          >
            <Plus size={16} aria-hidden="true" />
            Agregar contenedor / carga suelta
          </button>
        </div>
        <div className={styles.containerRows}>
          {operations.map((row, index) => {
            const type = getOperationType(row.operationType);
            const isAnticipada = isAdvanceExport(row);
            const requiresCustomRoute =
              type === "NACIONAL" || type === "MOVIMIENTO_INTERNO";
            return (
              <article className={styles.containerCard} key={row.key}>
                <div className={styles.containerCardHeader}>
                  <span className={styles.rowNumber}>{index + 1}</span>
                  <h4>{row.isContainerized ? "Contenedor" : "Carga suelta"} · {index + 1}</h4>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() =>
                      setOperations((rows) =>
                        rows.filter((item) => item.key !== row.key),
                      )
                    }
                    disabled={operations.length <= 1 || isSaving}
                    aria-label={`Eliminar unidad ${index + 1}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
                <div className={styles.containerRow}>
                  <label>
                    Tipo de operación
                    <select
                      value={row.operationType}
                      onChange={(event) => {
                        const nextType = operationTypes.find(
                          (option) => option.value === event.target.value,
                        )?.value;
                        if (!nextType) return;
                        updateOperation(row.key, {
                          operationType: nextType,
                          isContainerized:
                            nextType === "RETIRO_VACIO" ||
                            nextType === "DEVOLUCION_VACIO"
                              ? true
                              : row.isContainerized,
                        });
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
                    Tipo de carga
                    <select
                      value={String(row.isContainerized)}
                      onChange={(event) =>
                        updateOperation(row.key, {
                          isContainerized: event.target.value === "true",
                        })
                      }
                      disabled={
                        type === "RETIRO_VACIO" ||
                        type === "DEVOLUCION_VACIO"
                      }
                    >
                      <option value="true">Contenerizada</option>
                      <option value="false">Carga suelta</option>
                    </select>
                  </label>
                  {row.isContainerized ? (
                    <>
                      <label>
                        Tipo de contenedor
                        <select
                          value={row.containerType}
                          onChange={(event) => {
                            const nextType = containerTypes.find(
                              (item) => item.value === event.target.value,
                            )?.value;
                            if (nextType) {
                              updateOperation(row.key, {
                                containerType: nextType,
                              });
                            }
                          }}
                        >
                          {containerTypes.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Número de contenedor (opcional)
                        <input
                          value={row.containerNumber}
                          onChange={(event) =>
                            updateOperation(row.key, {
                              containerNumber: event.target.value,
                            })
                          }
                          placeholder="ABCD1234567"
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <label>
                        Descripción de la mercancía
                        <input
                          value={row.cargoDescription}
                          onChange={(event) =>
                            updateOperation(row.key, {
                              cargoDescription: event.target.value,
                            })
                          }
                          placeholder="Ej: Maquinaria, carga general"
                        />
                      </label>
                      <label>
                        Tipo de empaque
                        <input
                          value={row.packageType}
                          onChange={(event) =>
                            updateOperation(row.key, {
                              packageType: event.target.value,
                            })
                          }
                          placeholder="Cajas, estibas, sacos..."
                        />
                      </label>
                      <label>
                        Bultos
                        <input
                          type="number"
                          min="1"
                          value={row.packageCount}
                          onChange={(event) =>
                            updateOperation(row.key, {
                              packageCount: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        Dimensiones
                        <input
                          value={row.dimensions}
                          onChange={(event) =>
                            updateOperation(row.key, {
                              dimensions: event.target.value,
                            })
                          }
                          placeholder="2.4 x 1.8 x 1.5 m"
                        />
                      </label>
                      <label>
                        Volumen (m³)
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={row.volumeM3}
                          onChange={(event) =>
                            updateOperation(row.key, {
                              volumeM3: event.target.value,
                            })
                          }
                        />
                      </label>
                    </>
                  )}
                  <label>
                    Peso de la mercancía (kg)
                    <input
                      type="number"
                      min="0"
                      value={row.weight}
                      onChange={(event) =>
                        updateOperation(row.key, { weight: event.target.value })
                      }
                      placeholder={isEmptyOperation(row) ? "Opcional" : "Requerido"}
                    />
                  </label>
                  <label>
                    Tipología vehicular
                    <select
                      value={row.cargoVehicleTypeCode}
                      onChange={(event) => {
                        const code = CARGO_VEHICLE_TYPE_CODES.find(
                          (candidate) => candidate === event.target.value,
                        );
                        if (code) {
                          updateOperation(row.key, {
                            cargoVehicleTypeCode: code,
                          });
                        }
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
                  {row.isContainerized && (
                    <label>
                      Tipo de tráiler requerido
                      <select
                        value={row.requiredTrailerType}
                        onChange={(event) => {
                          const trailerType = TRAILER_TYPES.find(
                            (value) => value === event.target.value,
                          );
                          updateOperation(row.key, {
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
                  )}
                  {requiresCustomRoute && (
                    <>
                      <label>
                        Origen
                        <select
                          value={row.originId}
                          onChange={(event) =>
                            updateOperation(row.key, {
                              originId: event.target.value,
                            })
                          }
                          disabled={isLoadingLocations}
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
                          value={row.destinationId}
                          onChange={(event) =>
                            updateOperation(row.key, {
                              destinationId: event.target.value,
                            })
                          }
                          disabled={isLoadingLocations}
                        >
                          <option value="">Selecciona un destino</option>
                          {locationsOptions.map((location) => (
                            <option key={location.id} value={location.id}>
                              {location.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  )}
                  <label>
                    {isAnticipada
                      ? "Programación / retiro anticipado"
                      : "Fecha de programación (opcional)"}
                    <input
                      type="datetime-local"
                      required={isAnticipada}
                      value={row.scheduledAt}
                      onChange={(event) =>
                        updateOperation(row.key, {
                          scheduledAt: event.target.value,
                        })
                      }
                    />
                  </label>
                  {row.isContainerized && type === "IMPORTACION" && (
                    <label className={styles.checkboxField}>
                      <input
                        type="checkbox"
                        checked={row.requiresInspection}
                        onChange={(event) =>
                          updateOperation(row.key, {
                            requiresInspection: event.target.checked,
                          })
                        }
                      />
                      La naviera exige inspección
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
            );
          })}
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

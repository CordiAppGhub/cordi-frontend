"use client";

import {
  createElement,
  useCallback,
  useState,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FormField,
  FormFieldValue,
} from "@/components/organisms/form/types/form.types";
import { useClients } from "@/hooks/useClient";
import { useLocations } from "@/app/(panel)/locations/hooks/useLocation";
import {
  operationService,
  UpdateOperationPayload,
} from "@/services/operation.service";
import { tariffService } from "@/services/tariff.service";
import { useTariffs } from "../../tariff/hooks/useTariff";
import { Operation } from "@/types/operation-types";
import { useTrafico } from "./use-operations";
import { OperationDateTimePicker } from "../components/forms/operation-date-time-picker";
import { operationCargoSchema } from "@/schemas/operation.schema";
import { ClientQuoteParams, ContainerType } from "@/types/tariff-ypes";
import {
  DEFAULT_CONTAINER_TRAILER_TYPE,
  CARGO_VEHICLE_TYPE_CODES,
  TRAILER_TYPE_OPTIONS,
  TRAILER_TYPES,
} from "@/types/vehicles";
import { operationOptions } from "@/app/constants/operation.constants";
import { formatAppointmentLocationLabel } from "@/utils/appointment-label";

const containerSizeValues: ContainerType[] = [
  "DRY_20",
  "DRY_40",
  "HC_40",
  "REEFER_20",
  "REEFER_40_HC",
  "OPEN_TOP_20",
  "OPEN_TOP_40",
  "FLAT_RACK_20",
  "FLAT_RACK_40",
  "ISO_TANK_20",
];

const containerTypeLabels: Record<ContainerType, string> = {
  DRY_20: "20' Dry (20DV)",
  DRY_40: "40' Dry (40DV)",
  HC_40: "40' High Cube (40HC)",
  REEFER_20: "20' Refrigerado (20RF)",
  REEFER_40_HC: "40' Refrigerado HC (40RH)",
  OPEN_TOP_20: "20' Open Top (20OT)",
  OPEN_TOP_40: "40' Open Top (40OT)",
  FLAT_RACK_20: "20' Flat Rack (20FR)",
  FLAT_RACK_40: "40' Flat Rack (40FR)",
  ISO_TANK_20: "20' ISO Tanque (20TK)",
};

const getContainerSize = (value?: string | null): ContainerType | null =>
  containerSizeValues.find((containerSize) => containerSize === value) ?? null;

const INVALID_YARD_APPOINTMENT_MESSAGE =
  "Horario de patio no válido: lunes a viernes hasta las 4:00 p. m. y sábados hasta las 12:00 m. (domingos cerrado)";

const getPatioAppointmentError = (value: FormFieldValue): string | null => {
  if (typeof value !== "string" || !value) return null;
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/,
  );
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const weekday = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  ).getUTCDay();
  const minutesAfterMidnight = Number(hour) * 60 + Number(minute);
  if (
    weekday === 0 ||
    (weekday === 6 && minutesAfterMidnight > 12 * 60) ||
    (weekday > 0 &&
      weekday < 6 &&
      minutesAfterMidnight > 16 * 60)
  ) {
    return INVALID_YARD_APPOINTMENT_MESSAGE;
  }
  return null;
};

const dateTimeField = (
  name: string,
  label: FormField["label"],
  placeholder = "Selecciona fecha y hora",
): FormField => ({
  name,
  label,
  type: "custom",
  placeholder,
  render: (value, onChange) =>
    createElement(OperationDateTimePicker, {
      value: typeof value === "string" ? value : "",
      placeholderText: placeholder,
      onChange: (nextValue: string) => onChange(nextValue),
    }),
});

const formatDateForForm = (dateValue?: string | Date | null) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 16);
};

const supportsAppointmentFields = (type: string | null | undefined) =>
  Boolean(type) && type !== "NACIONAL";

const calculateDeadline = (
  fechaRetiro: FormFieldValue,
  diasLibres: FormFieldValue,
): string => {
  if (
    typeof fechaRetiro !== "string" ||
    !fechaRetiro.trim() ||
    diasLibres === "" ||
    diasLibres === null ||
    diasLibres === undefined
  ) {
    return "";
  }

  const days = Number(diasLibres);
  const deadline = new Date(fechaRetiro);
  if (!Number.isInteger(days) || days < 0 || Number.isNaN(deadline.getTime())) {
    return "";
  }

  deadline.setDate(deadline.getDate() + days);
  return formatDateForForm(deadline);
};

export const useOperationForm = (
  onClose: () => void,
  operationBase?: Operation | null,
  onCreatedForDispatch?: (operation: Operation) => void,
) => {
  const queryClient = useQueryClient();
  const { updateOperation, createOperation, isLoadingOperations } =
    useTrafico();
  const { clients } = useClients();
  const { locations, isLoadingLocations } = useLocations();
  const shippingLinesQuery = useQuery({
    queryKey: ["shipping-lines"],
    queryFn: operationService.getShippingLines,
    staleTime: 5 * 60 * 1000,
  });
  const {
    vehicleTypes,
    isLoadingVehicles: isLoadingVehicleTypes,
    vehicleTypesError,
  } = useTariffs();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [programarDesvio, setProgramarDesvio] = useState(false);
  const operationHasContainerData = operationBase?.isContainerized === true;
  const initialPhysicalDeadline =
    operationBase?.fechaLimiteDevolucion ?? operationBase?.fechaLimiteFisico;
  const initialCalculatedReturnDeadline = calculateDeadline(
    formatDateForForm(operationBase?.fechaRetiro),
    operationBase?.diasLibresDevolucion ?? "",
  );
  const initialPhysicalDeadlineWasCalculated =
    operationBase?.type === "IMPORTACION" &&
    operationHasContainerData &&
    Boolean(initialPhysicalDeadline) &&
    formatDateForForm(initialPhysicalDeadline) ===
      initialCalculatedReturnDeadline;
  const physicalDeadlineManuallyEdited = useRef(
    Boolean(initialPhysicalDeadline) && !initialPhysicalDeadlineWasCalculated,
  );
  const formValuesRef = useRef<Record<string, FormFieldValue>>({
    type: operationBase?.type ?? "",
    origenId: operationBase?.origen?.id ?? "",
    destinoId: operationBase?.destino?.id ?? "",
    fechaRetiro: operationHasContainerData
      ? formatDateForForm(operationBase?.fechaRetiro)
      : "",
    diasLibresDocumental: operationBase?.diasLibresDocumental ?? "",
    fechaLimiteDocumental: formatDateForForm(
      operationBase?.fechaLimiteDocumental,
    ),
    shippingLineId: operationHasContainerData
      ? String(operationBase?.shippingLineId ?? "")
      : "",
    requiresInspection:
      operationHasContainerData &&
      operationBase?.type === "IMPORTACION"
      ? (operationBase?.requiresInspection ?? false)
      : false,
    destinoTemporalId: "",
    depositoDevolucionId: operationHasContainerData
      ? String(operationBase?.depositoDevolucionId ?? "")
      : "",
    diasLibresDevolucion: operationHasContainerData
      ? (operationBase?.diasLibresDevolucion ?? "")
      : "",
    fechaCitaOrigen:
      supportsAppointmentFields(operationBase?.type) &&
      (operationHasContainerData || operationBase?.origen?.isPort === true)
        ? formatDateForForm(operationBase?.fechaCitaOrigen)
        : "",
    fechaCitaDestino:
      supportsAppointmentFields(operationBase?.type) &&
      (operationHasContainerData || operationBase?.destino?.isPort === true)
        ? formatDateForForm(operationBase?.fechaCitaDestino)
        : "",
    fechaLimiteDevolucion: formatDateForForm(initialPhysicalDeadline),
  });

  const isEdit = !!operationBase;

  const [currentType, setCurrentType] = useState<string>(
    operationBase?.type || "",
  );
  const [isAnticipada, setIsAnticipada] = useState<boolean>(
    operationBase?.isContainerized === true &&
      operationBase.isAnticipada === true,
  );
  const [cargoFormat, setCargoFormat] = useState<"CONTENERIZADA" | "SUELTA">(
    operationBase?.isContainerized === true ? "CONTENERIZADA" : "SUELTA",
  );
  const [cargoWeightKg, setCargoWeightKg] = useState<number | null>(
    operationBase?.weight ?? null,
  );
  const [containerSize, setContainerSize] = useState<ContainerType | null>(
    getContainerSize(operationBase?.containerType) ?? "DRY_40",
  );
  const [vehicleTypeId, setVehicleTypeId] = useState<number | null>(
    operationBase?.vehicleCapacityId ?? null,
  );
  const [selectedDescargueId, setSelectedDescargueId] = useState<number | null>(
    operationBase?.descargue?.id || operationBase?.cargue?.id || null,
  );
  const [origenId, setOrigenId] = useState<number | null>(
    operationBase?.type === "EXPORTACION" &&
      operationBase.isContainerized !== true &&
      operationBase.stops?.length === 3
      ? operationBase.stops[1]?.location?.id ??
        operationBase.stops[1]?.locationId ??
        operationBase.origen?.id ??
        null
      : operationBase?.origen?.id || null,
  );
  const [destinoId, setDestinoId] = useState<number | null>(
    operationBase?.type === "IMPORTACION"
      ? operationBase.descargue?.id || operationBase.destino?.id || null
      : operationBase?.destino?.id || null,
  );
  const [routeScope, setRouteScope] = useState<"URBANO" | "NACIONAL" | null>(
    operationBase?.routeScope ?? null,
  );
  const [clientId, setClientId] = useState<number | null>(
    operationBase?.client?.id || operationBase?.clientId || null,
  );

  const isExport =
    currentType === "EXPORTACION" || currentType.includes("Exportación");
  const isImport =
    currentType === "IMPORTACION" || currentType.includes("Importación");
  const isRetiroVacio = currentType === "RETIRO_VACIO";
  const isDevolucion =
    currentType === "DEVOLUCION_VACIO" || currentType === "DEVOLUCION";
  const relatedParentOperationsQuery = useQuery({
    queryKey: ["empty-return-parent-operations", clientId],
    queryFn: () =>
      operationService.getActiveOperationsByClient(clientId, {
        page: 1,
        limit: 50,
      }),
    enabled: isDevolucion && clientId !== null,
  });
  const relatedParentOperations = (
    relatedParentOperationsQuery.data?.data ?? []
  ).filter(
    (operation) =>
      operation.isContainerized === true &&
      (operation.type === "IMPORTACION" || operation.type === "EXPORTACION") &&
      Boolean(operation.containerNumber),
  );
  const relatedParentOperationOptions = useMemo(() => {
    const options = relatedParentOperations.map((operation) => ({
      value: operation.id,
      label: `#${operation.id} · ${operation.type === "IMPORTACION" ? "Importación" : "Exportación"} · ${operation.containerNumber}`,
    }));
    const currentRelatedOperationId = operationBase?.relatedOperationId;
    if (
      currentRelatedOperationId &&
      !options.some((option) => option.value === currentRelatedOperationId)
    ) {
      options.unshift({
        value: currentRelatedOperationId,
        label: `Operación vinculada #${currentRelatedOperationId}`,
      });
    }
    return [{ value: "", label: "Sin operación vinculada" }, ...options];
  }, [relatedParentOperations, operationBase?.relatedOperationId]);

  const quoteLocationId =
    isImport
      ? destinoId
      : isExport
      ? cargoFormat === "CONTENERIZADA"
        ? selectedDescargueId
        : origenId
      : isRetiroVacio
        ? destinoId
        : isDevolucion
          ? origenId
          : destinoId;

  const currentQuoteParams = useMemo<ClientQuoteParams | null>(() => {
    const isContainerized = cargoFormat === "CONTENERIZADA";
    const quoteRouteScope =
      routeScope ?? (currentType === "NACIONAL" ? "NACIONAL" : null);
    const originIsValid =
      origenId !== null &&
      locations.some((location) => location.id === origenId);
    const destinationIsValid =
      destinoId !== null &&
      locations.some((location) => location.id === destinoId);
    const exportCargoStopIsValid =
      !isExport ||
      !isContainerized ||
      (selectedDescargueId !== null &&
          locations.some((location) => location.id === selectedDescargueId));
    const quoteLocationIsValid =
      quoteLocationId !== null &&
      locations.some((location) => location.id === quoteLocationId);

    if (
      !clientId ||
      !currentType ||
      isDevolucion ||
      !quoteRouteScope ||
      !originIsValid ||
      !destinationIsValid ||
      !exportCargoStopIsValid ||
      !quoteLocationIsValid ||
      (isContainerized ? !containerSize : !vehicleTypeId)
    ) {
      return null;
    }

    return {
      clientId,
      operationType: currentType,
      routeScope: quoteRouteScope,
      locationId: quoteLocationId,
      isContainerized,
    };
  }, [
    cargoFormat,
    clientId,
    containerSize,
    currentType,
    destinoId,
    isDevolucion,
    isExport,
    locations,
    origenId,
    quoteLocationId,
    routeScope,
    selectedDescargueId,
    vehicleTypeId,
  ]);
  const tariffLookupIdentity = useMemo(() => {
    if (!currentQuoteParams) return null;
    return JSON.stringify({
      ...currentQuoteParams,
      origenId,
      destinoId,
      descargueId: selectedDescargueId,
      containerSize,
      vehicleCapacityId: vehicleTypeId,
    });
  }, [
    containerSize,
    currentQuoteParams,
    destinoId,
    origenId,
    selectedDescargueId,
    vehicleTypeId,
  ]);
  const initialTariffOriginId =
    operationBase?.type === "EXPORTACION" &&
    operationBase.isContainerized !== true &&
    operationBase.stops?.length === 3
      ? operationBase.stops[1]?.location?.id ??
          operationBase.stops[1]?.locationId ??
          operationBase.origen?.id ??
          null
      : operationBase?.origen?.id ?? null;
  const initialTariffDestinationId =
    operationBase?.type === "IMPORTACION"
      ? operationBase.descargue?.id || operationBase.destino?.id || null
      : operationBase?.destino?.id ?? null;
  const tariffInputsChanged =
    Boolean(operationBase) &&
    (clientId !==
      (operationBase?.clientId ?? operationBase?.client?.id ?? null) ||
      currentType !== operationBase?.type ||
      origenId !== initialTariffOriginId ||
      destinoId !== initialTariffDestinationId ||
      (isExport &&
          cargoFormat === "CONTENERIZADA" &&
          selectedDescargueId !==
            (operationBase?.descargue?.id ??
              operationBase?.cargue?.id ??
              null)) ||
      (cargoFormat === "CONTENERIZADA"
          ? containerSize !==
            (getContainerSize(operationBase?.containerType) ?? "DRY_40")
          : vehicleTypeId !== (operationBase?.vehicleCapacityId ?? null)) ||
      (cargoFormat === "CONTENERIZADA") !==
          (operationBase?.isContainerized === true) ||
      routeScope !== (operationBase?.routeScope ?? null));
  const shouldAutomaticallyLookupTariff =
    Boolean(currentQuoteParams) && (!isEdit || tariffInputsChanged);
  const [debouncedTariffLookupIdentity, setDebouncedTariffLookupIdentity] =
    useState<string | null>(null);
  const [manualTariffLookupIdentity, setManualTariffLookupIdentity] =
    useState<string | null>(null);

  useEffect(() => {
    if (!shouldAutomaticallyLookupTariff || !tariffLookupIdentity) return;
    const timeoutId = window.setTimeout(
      () => setDebouncedTariffLookupIdentity(tariffLookupIdentity),
      400,
    );
    return () => window.clearTimeout(timeoutId);
  }, [shouldAutomaticallyLookupTariff, tariffLookupIdentity]);

  const tariffLookupEnabled = Boolean(
    currentQuoteParams &&
      tariffLookupIdentity &&
      (manualTariffLookupIdentity === tariffLookupIdentity ||
          (shouldAutomaticallyLookupTariff &&
            debouncedTariffLookupIdentity === tariffLookupIdentity)),
  );
  const tariffLookupQuery = useQuery({
    queryKey: ["tariff-lookup", tariffLookupIdentity],
    queryFn: () => {
      if (!currentQuoteParams) {
          throw new Error("Completa los datos de ruta para consultar la tarifa.");
      }
      return tariffService.getQuote(currentQuoteParams);
    },
    enabled: tariffLookupEnabled,
    staleTime: 5 * 60 * 1000,
  });
  const suggestedPrice = tariffLookupEnabled
    ? (tariffLookupQuery.data?.price ?? null)
    : null;
  const isCalculatingPrice =
    Boolean(
      shouldAutomaticallyLookupTariff &&
          tariffLookupIdentity &&
          debouncedTariffLookupIdentity !== tariffLookupIdentity,
    ) || tariffLookupQuery.isFetching;
  const lookupCurrentTariff = useCallback(async () => {
    if (!tariffLookupIdentity || !currentQuoteParams) return;
    setManualTariffLookupIdentity(tariffLookupIdentity);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["tariffs"] }),
      queryClient.invalidateQueries({ queryKey: ["tariff-lookup"] }),
    ]);
  }, [currentQuoteParams, queryClient, tariffLookupIdentity]);
  const resetTariffLookupState = useCallback(() => {
    setDebouncedTariffLookupIdentity(null);
    setManualTariffLookupIdentity(null);
  }, []);

  const initialValues = useMemo(() => {
    if (!operationBase) {
      return {
        scheduledAt: "",
        cargoFormat: "SUELTA",
        isContainerized: false,
        routeScope: null,
        containerSize: "DRY_40",
        vehicleCapacityId: "",
        requiredTrailerType: "",
        programarDesvio: false,
        nuevoDestinoId: "",
        fechaCitaDesvio: "",
        shippingLineId: "",
        depositoDevolucionId: "",
        destinoTemporalTipo: "",
        destinoTemporalId: "",
        destinoCustomAddressEnabled: false,
        destinoCustomAddress: "",
        requiresInspection: false,
        relatedOperationId: "",
        containerNumber: "",
        fechaRetiro: "",
        fechaLimiteFisico: "",
        diasLibresDocumental: "",
        fechaLimiteDocumental: "",
        diasLibresDevolucion: "",
        fechaLimiteDevolucion: "",
      };
    }

    return {
      type: operationBase.type,
      routeScope: operationBase.routeScope ?? null,
      cargoFormat:
        operationBase.isContainerized === true ? "CONTENERIZADA" : "SUELTA",
      isContainerized: operationBase.isContainerized,
      vehicleCapacityId: operationBase.vehicleCapacityId ?? "",
      requiredTrailerType:
        operationBase.requiredTrailerType ??
        (operationBase.isContainerized === true
          ? DEFAULT_CONTAINER_TRAILER_TYPE
          : ""),
      shippingLineId: operationBase.isContainerized === true && operationBase.shippingLineId
        ? String(operationBase.shippingLineId)
        : "",
      depositoDevolucionId: operationBase.isContainerized === true && operationBase.depositoDevolucionId
        ? String(operationBase.depositoDevolucionId)
        : "",
      destinoCustomAddressEnabled:
        operationBase.stops?.at(-1)?.isCustomAddress ?? false,
      destinoCustomAddress: operationBase.stops?.at(-1)?.address ?? "",
      requiresInspection:
        operationBase.isContainerized === true &&
        operationBase.type === "IMPORTACION"
        ? (operationBase.requiresInspection ?? false)
        : false,
      clientId: operationBase.client?.id || operationBase.clientId,
      isAnticipada:
        operationBase.isContainerized === true
          ? operationBase.isAnticipada
          : false,
      origenId:
        operationBase.type === "EXPORTACION" &&
        operationBase.isContainerized !== true &&
        operationBase.stops?.length === 3
          ? operationBase.stops[1]?.location?.id ??
            operationBase.stops[1]?.locationId ??
            operationBase.origen?.id
          : operationBase.origen?.id,
      descargueId:
        operationBase.type === "EXPORTACION" &&
        operationBase.isContainerized === true
          ? operationBase.cargue?.id ?? ""
          : "",
      destinoId:
        operationBase.type === "IMPORTACION"
          ? operationBase.descargue?.id || operationBase.destino?.id
          : operationBase.destino?.id,

      containerNumber:
        operationBase.isContainerized === true
          ? operationBase.containerNumber || ""
          : "",
      relatedOperationId:
        operationBase.isContainerized === true
          ? (operationBase.relatedOperationId ?? "")
          : "",
      containerSize:
        operationBase.isContainerized === true
          ? getContainerSize(operationBase.containerType) || "DRY_40"
          : "",
      peso: operationBase.peso || "",
      cargoDescription: operationBase.cargoDescription || "",
      weight: operationBase.weight ?? "",
      dimensions: operationBase.dimensions || "",
      packageType: operationBase.packageType ?? "",
      packageCount: operationBase.packageCount ?? "",
      volumeM3: operationBase.volumeM3 ?? "",
      sealNumber:
        operationBase.isContainerized === true
          ? operationBase.sealNumber || ""
          : "",

      numeroPedido: operationBase.numeroPedido || "",
      documentoTransporte: operationBase.documentoTransporte || "",

      observaciones: operationBase.observaciones || "",
      fleteACobrarManual: operationBase.fleteACobrarManual ?? "",

      scheduledAt: formatDateForForm(operationBase.scheduledAt),
      fechaCitaOrigen:
        supportsAppointmentFields(operationBase.type) &&
        (operationBase.isContainerized === true ||
          operationBase.origen?.isPort === true)
        ? formatDateForForm(operationBase.fechaCitaOrigen)
        : "",
      fechaCitaDestino:
        supportsAppointmentFields(operationBase.type) &&
        (operationBase.isContainerized === true ||
          operationBase.destino?.isPort === true)
        ? formatDateForForm(operationBase.fechaCitaDestino)
        : "",
      fechaRetiro: operationBase.isContainerized === true
        ? formatDateForForm(operationBase.fechaRetiro)
        : "",
      fechaLimiteFisico: formatDateForForm(initialPhysicalDeadline),
      diasLibresDocumental: operationBase.diasLibresDocumental ?? "",
      fechaLimiteDocumental: formatDateForForm(
        operationBase.fechaLimiteDocumental,
      ),
      diasLibresDevolucion: operationBase.isContainerized === true
        ? (operationBase.diasLibresDevolucion ?? "")
        : "",
      fechaLimiteDevolucion: formatDateForForm(initialPhysicalDeadline),
      nuevoDestinoId: operationBase.nuevoDestinoId || "",
      fechaCitaDesvio:
        operationBase.isContainerized === true
          ? formatDateForForm(operationBase.fechaCitaDesvio)
          : "",
      programarDesvio: false,
    };
  }, [operationBase, initialPhysicalDeadline]);

  const clientOptions = useMemo(() => {
    const options = clients.map((client) => ({
      value: client.id,
      label: client.razonSocial,
    }));

    if (
      isEdit &&
      clientId !== null &&
      !options.some((option) => option.value === clientId)
    ) {
      const selectedClient =
        clients.find((client) => client.id === clientId) ??
        (operationBase?.client?.id === clientId
          ? operationBase.client
          : undefined);
      if (selectedClient) {
        options.push({
          value: selectedClient.id,
          label: selectedClient.razonSocial,
        });
      }
    }

    return options;
  }, [clients, isEdit, clientId, operationBase]);

  const looseCargoLocationOptions = useMemo(
    () => locations.map((location) => ({
      value: location.id,
      label: location.name,
    })),
    [locations],
  );

  const origenOptions = useMemo(() => {
    if (isDevolucion) {
      return locations
        .filter(
          (location) =>
            location.isOwnYard ||
            Boolean(
              clientId &&
              location.clients?.some(
                (relation) =>
                  relation.clientId === clientId &&
                  relation.isClient &&
                  !relation.isDepot,
              ),
            ),
        )
        .map((location) => ({ value: location.id, label: location.name }));
    }
    if (isImport)
      return locations
        .filter((loc) => loc.isPort)
        .map((l) => ({ value: l.id, label: l.name }));
    if (isRetiroVacio)
      return locations
        .filter((loc) => loc.isPort)
        .map((l) => ({ value: l.id, label: l.name }));
    if (isExport)
      return locations
        .filter((loc) => loc.isDepot || loc.isOwnYard)
        .map((l) => ({ value: l.id, label: l.name }));
    return locations.map((l) => ({ value: l.id, label: l.name }));
  }, [clientId, isDevolucion, isExport, isImport, isRetiroVacio, locations]);

  const descargueOptions = useMemo(() => {
    return locations
      .filter(
        (location) =>
          !location.isPort &&
          Boolean(
            clientId &&
              location.clients?.some(
                (relation) =>
                  relation.clientId === clientId &&
                  (relation.isClient || relation.isDepot),
              ),
          ),
      )
      .map((location) => ({
        value: location.id,
        label: location.name,
      }));
  }, [locations, clientId]);

  const destinoOptions = useMemo(() => {
    if (isDevolucion) {
      return locations
        .filter(
          (location) =>
            location.isPort ||
            location.isDepot ||
            location.clients?.some(
              (relation) => relation.clientId === clientId && relation.isDepot,
            ),
        )
        .map((location) => ({ value: location.id, label: location.name }));
    }
    if (isImport)
      return locations
        .filter(
          (location) =>
            !location.isPort &&
            Boolean(
              clientId &&
                location.clients?.some(
                  (relation) =>
                    relation.clientId === clientId &&
                    (relation.isClient || relation.isDepot),
                ),
            ),
        )
        .map((l) => ({ value: l.id, label: l.name }));
    if (isExport)
      return locations
        .filter((loc) => loc.isPort)
        .map((l) => ({ value: l.id, label: l.name }));

    if (isRetiroVacio) {
      const filteredLocations = locations.filter(
        (loc) =>
          loc.isOwnYard ||
          loc.isDepot ||
          Boolean(
            clientId &&
            loc.clients?.some(
              (relation) =>
                relation.clientId === clientId &&
                (relation.isClient || relation.isDepot),
            ),
          ),
      );
      return filteredLocations.map((l) => ({ value: l.id, label: l.name }));
    }

    return locations.map((l) => ({ value: l.id, label: l.name }));
  }, [isDevolucion, isExport, isImport, isRetiroVacio, locations, clientId]);

  const desvioDestinationOptions = useMemo(
    () =>
      locations
        .filter(
          (location) =>
            location.isPort || location.isDepot || location.isOwnYard,
        )
        .map((location) => ({ value: location.id, label: location.name })),
    [locations],
  );
  const returnDepotOptions = useMemo(
    () =>
      locations
        .filter((location) => location.isDepot || location.isOwnYard)
        .map((location) => ({ value: location.id, label: location.name })),
    [locations],
  );

  const categorizedFields = useMemo(() => {
    // Tab 1: General y Rutas
    const generalFields: FormField[] = [
      {
        name: "datosBasicos",
        label: "Datos Básicos",
        type: "text",
        sectionTitle: true,
        fullWidth: true,
      },
      {
        name: "numeroPedido",
        label: "Número de Pedido / Booking (prioritario)",
        type: "text",
        placeholder: "Ingrese el número de pedido o booking",
        fullWidth: true,
        visible: (formData) =>
          formData.type === "IMPORTACION" || formData.type === "EXPORTACION",
      },
      {
        name: "documentoTransporte",
        label: "Manifiesto / DO / BL",
        type: "text",
        placeholder: "Ej: BL-987654",
        visible: (formData) =>
          formData.type === "IMPORTACION" || formData.type === "EXPORTACION",
      },
      {
        name: "type",
        label: "Tipo de Operación *",
        type: "select",
        options: operationOptions,
        disabled: isEdit,
      },
      {
        name: "clientId",
        label: "Cliente *",
        type: "select",
        options: clientOptions,
        disabled: isEdit,
      },
      {
        name: "routeScope",
        label: "Alcance de Ruta *",
        type: "select",
        options: [
          { value: "URBANO", label: "Urbano" },
          { value: "NACIONAL", label: "Nacional" },
        ],
        visible: (formData) =>
          formData.type === "IMPORTACION" || formData.type === "EXPORTACION",
      },
      {
        name: "isContainerized",
        label: "Tipo de carga",
        placeholder: "Carga Contenerizada",
        type: "checkbox",
        layoutClass: "cargoTypeSection",
        visible: () => !isDevolucion,
      },
      {
        name: "shippingLineId",
        label: "Línea naviera *",
        type: "select",
        options: [
          ...(operationBase?.shippingLine &&
          !(shippingLinesQuery.data ?? []).some(
            (line) => line.id === operationBase.shippingLineId,
          )
            ? [
                {
                  value: operationBase.shippingLine.id,
                  label: operationBase.shippingLine.name,
                },
              ]
            : []),
          ...(shippingLinesQuery.data ?? []).map((line) => ({
            value: line.id,
            label: line.name,
          })),
        ],
        visible: (formData) =>
          !isDevolucion && formData.isContainerized === true,
        layoutClass: "cargoTypeSection",
        reserveSpaceWhenHidden: true,
      },
      {
        name: "requiresInspection",
        label: "La línea naviera exige inspección",
        type: "checkbox",
        visible: (formData) =>
          formData.type === "IMPORTACION" &&
          formData.isContainerized === true,
      },
    ];

    if (isExport) {
      generalFields.push({
        name: "isAnticipada",
        label: "¿Es Exportación Anticipada?",
        type: "checkbox",
        disabled: isEdit,
      });
    }

    if (currentType) {
      generalFields.push(
        {
          name: "ruta",
          label: "Ruta - A dónde vamos",
          type: "text",
          sectionTitle: true,
          fullWidth: true,
        },
        {
          name: "origenId",
          label: (formData) =>
            isDevolucion
              ? "Bodega del Cliente / Patio Propio *"
              : isExport
                ? formData.isContainerized === true
                  ? "Patio de Retiro (Vacío) *"
                  : "Bodega del Cliente *"
                : isImport
                  ? "Puerto de Origen *"
                  : isRetiroVacio
                    ? "Puerto de Retiro (Vacío) *"
                    : "Origen de la carga *",
          type: "select",
          options: (formData) =>
            isImport || formData.isContainerized === true
              ? origenOptions
              : isExport
                ? descargueOptions
              : looseCargoLocationOptions,
        },
        ...(isExport
          ? [
              {
                name: "destinoTemporalTipo",
                label: "Destino temporal del vacío *",
                type: "select" as const,
                options: [
                  { value: "PATIO_PROPIO", label: "Patio Propio" },
                  { value: "BODEGA_CLIENTE", label: "Bodega Cliente" },
                ],
                visible: (formData: Record<string, FormFieldValue>) =>
                  formData.isContainerized === true &&
                  formData.type === "EXPORTACION" &&
                  formData.isAnticipada === true &&
                  !isEdit,
              },
              {
                name: "destinoTemporalId",
                label: "Ubicación específica *",
                type: "select" as const,
                options: (formData: Record<string, FormFieldValue>) => {
                  const destinationType = formData.destinoTemporalTipo;
                  return locations
                    .filter((location) =>
                      destinationType === "PATIO_PROPIO"
                        ? location.isOwnYard
                        : destinationType === "BODEGA_CLIENTE"
                          ? Boolean(
                              clientId &&
                              location.clients?.some(
                                (relation) =>
                                  relation.clientId === clientId &&
                                  relation.isDepot,
                              ),
                            )
                          : false,
                    )
                    .map((location) => ({
                      value: location.id,
                      label: location.name,
                    }));
                },
                visible: (formData: Record<string, FormFieldValue>) =>
                  formData.isContainerized === true &&
                  formData.type === "EXPORTACION" &&
                  formData.isAnticipada === true &&
                  Boolean(formData.destinoTemporalTipo) &&
                  !isEdit,
              },
            ]
          : []),
        {
          name: "descargueId",
          label: "Lugar de Cargue (Cliente) *",
          type: "select",
          options: descargueOptions,
          disabled: !clientId,
          visible: (formData) =>
            formData.type === "EXPORTACION" &&
            formData.isContainerized === true,
        },
        {
          name: "destinoId",
          label: () =>
            isDevolucion
              ? "Depósito Naviera / Puerto *"
              : isExport
                ? "Puerto de Ingreso (Lleno) *"
                : isImport
                  ? "Lugar de Descargue (Cliente) *"
                  : isRetiroVacio
                    ? "Destino del contenedor vacío *"
                    : "Destino de la carga *",
          type: "select",
          options: (formData) =>
            isImport || isExport || formData.isContainerized === true
              ? destinoOptions
              : looseCargoLocationOptions,
        },
        {
          name: "depositoDevolucionId",
          label: "Patio de Vacío (Destino final / Devolución)",
          type: "select",
          options: [
            ...(operationBase?.depositoDevolucion &&
            !returnDepotOptions.some(
              (option) => option.value === operationBase.depositoDevolucionId,
            )
              ? [
                  {
                    value: operationBase.depositoDevolucion.id,
                    label: operationBase.depositoDevolucion.name,
                  },
                ]
              : []),
            ...returnDepotOptions,
          ],
          visible: (formData) =>
            formData.type === "IMPORTACION" &&
            formData.isContainerized === true,
        },
        {
          name: "destinoCustomAddressEnabled",
          label: "¿Usar dirección personalizada?",
          type: "checkbox",
          visible: (formData) =>
            !isDevolucion &&
            formData.isContainerized !== true &&
            formData.type !== "EXPORTACION" &&
            formData.type !== "IMPORTACION",
        },
        {
          name: "destinoCustomAddress",
          label: "Dirección personalizada del destino",
          type: "textarea",
          placeholder: "Ingresa la dirección del destino",
          fullWidth: true,
          visible: (formData) =>
            !isDevolucion &&
            formData.isContainerized !== true &&
            formData.type !== "EXPORTACION" &&
            formData.destinoCustomAddressEnabled === true,
        },
      );

      const getAppointmentLabel = (
        appointment: "origen" | "destino",
        formData: Record<string, FormFieldValue>,
      ) => {
        const locationField =
          appointment === "origen"
            ? "origenId"
            : "destinoId";
        const isImportReturnAppointment =
          appointment === "destino" &&
          formData.type === "IMPORTACION" &&
          formData.isContainerized === true;
        const selectedLocationId = Number(
          isImportReturnAppointment
            ? formData.depositoDevolucionId
            : formData[locationField],
        );
        const selectedLocation = locations.find(
          (location) => location.id === selectedLocationId,
        );
        const baseLabel =
          appointment === "origen"
            ? "Cita de origen"
            : isImportReturnAppointment
              ? "Cita de destino / devolución vacío"
              : "Cita de destino";
        const locationLabel = formatAppointmentLocationLabel(
          baseLabel,
          selectedLocation?.name,
        );
        return locationLabel;
      };
      const appointmentDateField = (
        appointment: "origen" | "destino",
      ): FormField => {
        const fieldName = `fechaCita${appointment === "origen" ? "Origen" : "Destino"}`;
        return {
          ...dateTimeField(
            fieldName,
            (formData) => getAppointmentLabel(appointment, formData),
            "Opcional · Por confirmar",
          ),
          helperText: (formData) => {
            const isImportReturnAppointment =
              appointment === "destino" &&
              formData.type === "IMPORTACION" &&
              formData.isContainerized === true;
            const locationId = Number(
              isImportReturnAppointment
                ? formData.depositoDevolucionId
                : formData[appointment === "origen" ? "origenId" : "destinoId"],
            );
            const selectedLocation = locations.find(
              (location) => location.id === locationId,
            );
            const patioError =
              formData.isContainerized === true &&
              selectedLocation &&
              !selectedLocation.isPort &&
              (selectedLocation.isDepot || selectedLocation.isOwnYard)
                ? getPatioAppointmentError(formData[fieldName])
                : null;
            return patioError
              ? `⚠️ ${patioError}`
              : "Opcional · Por confirmar";
          },
          visible: (formData) => {
          if (!supportsAppointmentFields(String(formData.type ?? ""))) {
            return false;
          }
          if (formData.isContainerized === true) return true;
          const locationField =
            appointment === "origen" ? "origenId" : "destinoId";
          const selectedLocation = locations.find(
            (location) =>
              location.id === Number(formData[locationField]),
          );
          return selectedLocation?.isPort === true;
          },
        };
      };

      if (isDevolucion) {
        generalFields.push(
          {
            name: "fechasDevolucion",
            label: "Fechas - Devolución de vacío",
            type: "text",
            sectionTitle: true,
            fullWidth: true,
            visible: (formData) => formData.isContainerized === true,
          },
          dateTimeField("scheduledAt", "Fecha y hora de operación (Por confirmar con cliente)"),
          appointmentDateField("destino"),
        );
      } else if (
        isExport &&
        isAnticipada &&
        cargoFormat === "CONTENERIZADA"
      ) {
        generalFields.push(
          {
            name: "tiemposRetiroVacio",
            label: "Tiempos del Retiro del Vacío",
            type: "text",
            sectionTitle: true,
            fullWidth: true,
            visible: (formData) => formData.isContainerized === true,
          },
          dateTimeField("fechaRetiro", "Fecha y hora de retiro anticipado *"),
          {
            name: "tiemposExportacion",
            label: "Tiempos de Exportación",
            type: "text",
            sectionTitle: true,
            fullWidth: true,
            visible: (formData) => formData.isContainerized === true,
          },
          dateTimeField("scheduledAt", "Fecha y hora de operación (Por confirmar con cliente)"),
          appointmentDateField("origen"),
          appointmentDateField("destino"),
        );
      } else {
        generalFields.push(
          {
            name: "fechas",
            label: "Fechas - Cuándo vamos",
            type: "text",
            sectionTitle: true,
            fullWidth: true,
          },
          dateTimeField("scheduledAt", "Fecha y hora de operación (Por confirmar con cliente)"),
          appointmentDateField("origen"),
          appointmentDateField("destino"),
        );
        if (isExport && cargoFormat === "CONTENERIZADA") {
          generalFields.push(
            dateTimeField("fechaRetiro", "Fecha de Retiro (Vacío)"),
          );
        }
      }

      generalFields.push(
        {
          name: "fechasLimite",
          label: "Fechas límite",
          type: "text",
          sectionTitle: true,
          fullWidth: true,
        },
      );
      if (
        cargoFormat === "CONTENERIZADA" &&
        (isImport || isDevolucion)
      ) {
        generalFields.push(dateTimeField("fechaRetiro", "Fecha de retiro"));
      }
      generalFields.push(
        {
          name: "diasLibresDocumental",
          label: "Días libres documentales",
          type: "number",
          placeholder: "Opcional",
        },
        dateTimeField(
          "fechaLimiteDocumental",
          "Fecha Límite Documental",
        ),
        {
          ...          dateTimeField("fechaLimiteDevolucion", (formData) =>
            formData.type === "EXPORTACION"
              ? "Fecha límite de ingreso a puerto"
              : formData.type === "IMPORTACION" &&
                  formData.isContainerized === true
                ? "Fecha límite de devolución de vacío"
                : "Fecha límite de cierre físico",
          ),
          helperText: (formData) => {
            if (
              formData.type === "EXPORTACION" &&
              formData.isAnticipada === true
            ) {
              return "Ingreso a puerto";
            }
            if (formData.type === "EXPORTACION") return "Ingreso a puerto";
            if (
              formData.type === "IMPORTACION" &&
              formData.isContainerized === true
            ) {
              return "Devolución de vacío (patio vacío, propio o cliente)";
            }
            return "Entrega física en destino";
          },
        },
      );
      if (
        cargoFormat === "CONTENERIZADA" &&
        (isImport || isDevolucion)
      ) {
        generalFields.push(
          {
            name: "diasLibresDevolucion",
            label: "Días libres de naviera para devolución de vacío",
            type: "number",
            placeholder: "Opcional",
          },
        );
      }

      if (
        isEdit &&
        cargoFormat === "CONTENERIZADA" &&
        operationBase?.containerStatus === "PENDIENTE_DEVOLUCION"
      ) {
        generalFields.push(
          {
            name: "nuevoDestinoId",
            label: "Nuevo destino confirmado por naviera *",
            type: "select",
            options: desvioDestinationOptions,
          },
          dateTimeField(
            "fechaCitaDesvio",
            "Fecha y hora de nueva cita",
            "Opcional · Por confirmar",
          ),
        );
      }
    }

    if (isImport && !isEdit) {
      generalFields.push({
        name: "programarDesvio",
        label: "Programar Desvío",
        type: "checkbox",
      });
      if (programarDesvio) {
        generalFields.push(
          {
            name: "nuevoDestinoId",
            label: "Destino del desvío *",
            type: "select",
            options: desvioDestinationOptions,
          },
          dateTimeField(
            "fechaCitaDesvio",
            "Fecha y hora de cita del desvío",
            "Opcional · Por confirmar",
          ),
        );
      }
    }

    const vehicleRequirementFields: FormField[] = [
      {
        name: "vehicleRequirementsHeading",
        label: "Requerimientos de Vehículo y Capacidad",
        type: "text",
        sectionTitle: true,
        fullWidth: true,
      },
      {
        name: "vehicleCapacityId",
        label: "Tipología vehicular requerida *",
        type: "select",
        options: (formData) => {
          const enteredWeight =
            typeof formData.weight === "number" ||
            typeof formData.weight === "string"
              ? Number(formData.weight)
              : 0;
          return [
            { value: "", label: "-- Seleccionar cabezote --" },
            ...vehicleTypes
              .map((vehicleType) => {
                const supportsWeight =
                  !enteredWeight ||
                  vehicleType.maxPayloadKg === null ||
                  enteredWeight <= vehicleType.maxPayloadKg;
                const containerRigid =
                  formData.isContainerized === true &&
                  !vehicleType.requiresTrailer;
                const payloadDescription =
                  vehicleType.maxPayloadKg === null
                    ? "sin límite configurado"
                    : `hasta ${vehicleType.maxPayloadKg.toLocaleString("es-CO")} kg`;
                return {
                  value: vehicleType.id,
                  supportsWeight,
                  containerRigid,
                  label: `${vehicleType.name} · ${payloadDescription}${containerRigid ? " · No recomendado para contenedor" : ""}${supportsWeight ? "" : " · NO SOPORTA EL PESO"}`,
                };
              })
              .sort(
                (left, right) =>
                  Number(right.supportsWeight) - Number(left.supportsWeight) ||
                  Number(left.containerRigid) - Number(right.containerRigid),
              ),
          ];
        },
        visible: () => true,
      },
      {
        name: "requiredTrailerType",
        label: "Tipo de tráiler requerido",
        type: "select",
        options: (formData) => [
          {
            value: "",
            label: "Cualquiera / Sin restricción",
          },
          ...TRAILER_TYPE_OPTIONS.map((option) => ({
            ...option,
            label:
              formData.isContainerized === true &&
              option.value === DEFAULT_CONTAINER_TRAILER_TYPE
                ? `${option.label} · Sugerido para contenedores`
                : option.label,
          })),
        ],
        visible: (formData) =>
          vehicleTypes.find(
            (vehicleType) =>
              vehicleType.id === Number(formData.vehicleCapacityId),
          )?.requiresTrailer === true,
      },
      {
        name: "weight",
        label: (formData) =>
          formData.type === "RETIRO_VACIO" ||
          formData.type === "DEVOLUCION_VACIO"
            ? "Peso de la carga (kg) · opcional"
            : "Peso de la carga (kg) *",
        type: "number",
        placeholder: "Peso en kilogramos",
        visible: () => true,
      },
      {
        name: "configurationWeightWarning",
        label: "",
        type: "custom",
        fullWidth: true,
        render: (_value, onChange) => {
          if (!cargoWeightKg || cargoWeightKg <= 0) return null;
          const selectedConfiguration = vehicleTypes.find(
            (vehicleType) => vehicleType.id === vehicleTypeId,
          );
          const maximumCatalogPayload = Math.max(
            ...vehicleTypes.map((vehicleType) => vehicleType.maxPayloadKg ?? 0),
          );
          const suggestedConfiguration = vehicleTypes
            .filter(
              (vehicleType) =>
                vehicleType.maxPayloadKg !== null &&
                cargoWeightKg <= vehicleType.maxPayloadKg &&
                (formValuesRef.current.isContainerized !== true ||
                  vehicleType.requiresTrailer),
            )
            .sort(
              (left, right) =>
                (left.maxPayloadKg ?? Infinity) -
                (right.maxPayloadKg ?? Infinity),
            )[0];
          const exceedsSelectedPayload =
            selectedConfiguration?.maxPayloadKg != null &&
            cargoWeightKg > selectedConfiguration.maxPayloadKg;
          const estimatedPbv =
            selectedConfiguration?.approxTareKg == null
              ? null
              : cargoWeightKg + selectedConfiguration.approxTareKg;
          const exceedsLegalPbv =
            estimatedPbv !== null &&
            selectedConfiguration?.maxLegalPbvKg != null &&
            estimatedPbv > selectedConfiguration.maxLegalPbvKg;
          const exceedsCatalogPayload = cargoWeightKg > maximumCatalogPayload;

          return createElement(
            "div",
            { style: { display: "grid", gap: 6 } },
            selectedConfiguration && estimatedPbv !== null
              ? createElement(
                  "span",
                  { style: { color: "#475569" } },
                  `PBV estimado: ${estimatedPbv.toLocaleString("es-CO")} kg · Legal: ${selectedConfiguration.maxLegalPbvKg.toLocaleString("es-CO")} kg · Tolerancia: ${selectedConfiguration.maxTolerancePbvKg.toLocaleString("es-CO")} kg`,
                )
              : null,
            exceedsSelectedPayload || exceedsLegalPbv || exceedsCatalogPayload
              ? createElement(
                  "span",
                  {
                    role: "alert",
                    style: {
                      color: exceedsCatalogPayload ? "#b91c1c" : "#b45309",
                      fontWeight: 600,
                    },
                  },
                  exceedsCatalogPayload
                    ? `El peso supera la capacidad útil máxima del catálogo (${maximumCatalogPayload.toLocaleString("es-CO")} kg).`
                    : exceedsSelectedPayload
                      ? `El peso supera la capacidad útil de ${selectedConfiguration?.code} (${selectedConfiguration?.maxPayloadKg?.toLocaleString("es-CO")} kg).`
                      : `El PBV estimado supera el PBV legal para ${selectedConfiguration?.code}.`,
                )
              : null,
            exceedsSelectedPayload && suggestedConfiguration
              ? createElement(
                  "button",
                  {
                    type: "button",
                    onClick: () => onChange(String(suggestedConfiguration.id)),
                  },
                  `Cambiar a ${suggestedConfiguration.code} · Hasta ${suggestedConfiguration.maxPayloadKg?.toLocaleString("es-CO")} kg`,
                )
              : null,
          );
        },
        visible: () => true,
      },
    ];

    // Tab 2: Información física de la carga
    const cargaFields: FormField[] = isDevolucion
      ? [
          {
            name: "containerNumber",
            label: "Número de contenedor *",
            type: "text",
            placeholder: "Ej: MSKU1234567",
            fullWidth: true,
          },
          {
            name: "relatedOperationId",
            label: "Operación padre (importación o exportación)",
            type: "select",
            options: relatedParentOperationOptions,
            fullWidth: true,
          },
          ...vehicleRequirementFields,
        ]
      : currentType
        ? [
            {
              name: "informacionFisica",
              label: "Información física de la mercancía",
              type: "text",
              sectionTitle: true,
              fullWidth: true,
            },
            {
              name: "containerNumber",
              label: "Número de contenedor *",
              type: "text",
              placeholder: "Ej: MSKU1234567",
              visible: (formData) => formData.isContainerized === true,
            },
            {
              name: "containerSize",
              label: "Tipo de contenedor *",
              type: "select",
              options: containerSizeValues.map((size) => ({
                value: size,
                label: containerTypeLabels[size],
              })),
              visible: (formData) => formData.isContainerized === true,
            },
            ...vehicleRequirementFields,
            {
              name: "cargoDescription",
              label: "Descripción de la carga *",
              type: "textarea",
              placeholder: "Describe la mercancía",
              fullWidth: true,
              visible: (formData) => formData.isContainerized !== true,
            },
            {
              name: "packageType",
              label: "Tipo de empaque",
              type: "text",
              placeholder: "Ej: Caja, estiba, bulto",
              collapsibleGroup: "cargoDetails",
              collapsibleGroupTitle:
                "Detalles adicionales de empaque y medidas (opcional)",
              visible: (formData) => formData.isContainerized !== true,
            },
            {
              name: "packageCount",
              label: "Cantidad de bultos/estibas",
              type: "number",
              placeholder: "Número de bultos o estibas",
              collapsibleGroup: "cargoDetails",
              visible: (formData) => formData.isContainerized !== true,
            },
            {
              name: "volumeM3",
              label: "Volumen (m³)",
              type: "number",
              placeholder: "Volumen en metros cúbicos",
              collapsibleGroup: "cargoDetails",
              visible: (formData) => formData.isContainerized !== true,
            },
            {
              name: "dimensions",
              label: "Dimensiones",
              type: "text",
              placeholder: "Ej: 2.4 x 1.8 x 1.5 m",
              collapsibleGroup: "cargoDetails",
              visible: (formData) => formData.isContainerized !== true,
            },
            {
              name: "peso",
              label: "Peso del contenedor (Kilos / Toneladas)",
              type: "number",
              visible: (formData) => formData.isContainerized === true,
            },
            {
              name: "sealNumber",
              label: "Sello / Precinto",
              type: "text",
              placeholder: "Ej: 123456",
              visible: (formData) => formData.isContainerized === true,
            },
          ]
        : [];

    // Tab 3: Liquidación
    const liquidacionFields: FormField[] =
      currentType && !isDevolucion
        ? [
            {
              name: "fleteACobrarManual",
              label: "Flete a cobrar manual (Opcional)",
              type: "number",
            },
            {
              name: "buscarTarifa",
              label: "",
              type: "custom",
              fullWidth: true,
              render: () =>
                isEdit
                  ? createElement(
                      "button",
                      {
                        type: "button",
                        disabled: !currentQuoteParams || isCalculatingPrice,
                        onClick: () => void lookupCurrentTariff(),
                        style: {
                          padding: "6px 10px",
                          border: "1px solid #93c5fd",
                          borderRadius: "6px",
                          background: "#ffffff",
                          color: "#1d4ed8",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor:
                            !currentQuoteParams || isCalculatingPrice
                              ? "not-allowed"
                              : "pointer",
                        },
                      },
                      isCalculatingPrice
                        ? "Consultando tarifa..."
                        : "Buscar / Actualizar tarifa",
                    )
                  : null,
            },
            { name: "observaciones", label: "Observaciones", type: "textarea" },
          ]
        : [];

    return { generalFields, cargaFields, liquidacionFields };
  }, [
    currentType,
    cargoFormat,
    isEdit,
    operationBase,
    clientOptions,
    shippingLinesQuery.data,
    looseCargoLocationOptions,
    vehicleTypes,
    vehicleTypeId,
    cargoWeightKg,
    origenOptions,
    descargueOptions,
    destinoOptions,
    desvioDestinationOptions,
    returnDepotOptions,
    isExport,
    isImport,
    isRetiroVacio,
    isDevolucion,
    isAnticipada,
    locations,
    clientId,
    programarDesvio,
    relatedParentOperationOptions,
    currentQuoteParams,
    isCalculatingPrice,
    lookupCurrentTariff,
  ]);
  const handleFormChange = (name: string, value: FormFieldValue) => {
    setErrors({});
    if (
      [
        "type",
        "clientId",
        "origenId",
        "destinoId",
        "descargueId",
        "routeScope",
        "isContainerized",
        "containerSize",
        "vehicleCapacityId",
      ].includes(name)
    ) {
      resetTariffLookupState();
    }
    if (name === "weight") {
      const parsedWeight =
        typeof value === "number" ||
        (typeof value === "string" && value.trim() !== "")
          ? Number(value)
          : null;
      setCargoWeightKg(
        parsedWeight !== null && Number.isFinite(parsedWeight)
          ? parsedWeight
          : null,
      );
    }

    if (name === "type") {
      setCurrentType(String(value));
      setIsAnticipada(false);
    }
    if (name === "isAnticipada") setIsAnticipada(Boolean(value));
    if (name === "cargoFormat")
      setCargoFormat(String(value) as "CONTENERIZADA" | "SUELTA");
    if (name === "isContainerized") {
      setCargoFormat(value ? "CONTENERIZADA" : "SUELTA");
      setOrigenId(null);
      setDestinoId(null);
      if (value === false) {
        setProgramarDesvio(false);
        setIsAnticipada(false);
      }
    }
    if (name === "containerSize")
      setContainerSize(getContainerSize(String(value)));
    if (name === "vehicleCapacityId") setVehicleTypeId(Number(value) || null);
    if (name === "programarDesvio") setProgramarDesvio(Boolean(value));
    if (name === "descargueId") setSelectedDescargueId(Number(value) || null);
    if (name === "origenId") setOrigenId(Number(value) || null);
    if (name === "destinoId") setDestinoId(Number(value) || null);
    if (name === "routeScope")
      setRouteScope(value === "URBANO" || value === "NACIONAL" ? value : null);

    if (name === "clientId") {
      const newClientId = Number(value) || null;
      if (newClientId !== clientId) {
        setClientId(newClientId);
        setSelectedDescargueId(null);
        setDestinoId(null);
      }
    }
  };
  const setFieldsOnChange = (name: string, value: FormFieldValue) => {
    const previousValue = formValuesRef.current[name];
    formValuesRef.current[name] = value;
    if (
      (name === "origenId" ||
        name === "destinoId" ||
        name === "depositoDevolucionId") &&
      previousValue !== undefined &&
      String(previousValue) !== String(value)
    ) {
      const appointmentField =
        name === "origenId" ? "fechaCitaOrigen" : "fechaCitaDestino";
      formValuesRef.current[appointmentField] = "";
      return { [appointmentField]: "" };
    }
    if (name === "fechaLimiteDevolucion") {
      physicalDeadlineManuallyEdited.current = true;
      formValuesRef.current.fechaLimiteFisico = value;
      return { fechaLimiteFisico: value };
    }
    if (name === "type" && value === "NACIONAL") {
      const clearedAppointmentValues = {
        fechaCitaOrigen: "",
        fechaCitaDestino: "",
        requiresInspection: false,
      };
      Object.assign(formValuesRef.current, clearedAppointmentValues);
      return clearedAppointmentValues;
    }
    if (name === "type" && value !== "IMPORTACION") {
      formValuesRef.current.requiresInspection = false;
      return { requiresInspection: false };
    }
    if (name === "isContainerized") {
      const clearedRouteValues: Record<string, FormFieldValue> = {
        origenId: "",
        destinoId: "",
        destinoCustomAddressEnabled: false,
        destinoCustomAddress: "",
      };
      if (value === true && !formValuesRef.current.requiredTrailerType) {
        formValuesRef.current.requiredTrailerType =
          DEFAULT_CONTAINER_TRAILER_TYPE;
        clearedRouteValues.requiredTrailerType =
          DEFAULT_CONTAINER_TRAILER_TYPE;
      }
      if (value === false) {
        const appointmentType = String(
          formValuesRef.current.type ?? currentType,
        );
        const originLocation = locations.find(
          (location) =>
            location.id === Number(formValuesRef.current.origenId),
        );
        const destinationLocation = locations.find(
          (location) =>
            location.id === Number(formValuesRef.current.destinoId),
        );
        Object.assign(clearedRouteValues, {
          shippingLineId: "",
          requiresInspection: false,
          destinoTemporalTipo: "",
          destinoTemporalId: "",
          fechaCitaOrigen:
            supportsAppointmentFields(appointmentType) &&
            originLocation?.isPort
              ? formValuesRef.current.fechaCitaOrigen ?? ""
              : "",
          fechaCitaDestino:
            supportsAppointmentFields(appointmentType) &&
            destinationLocation?.isPort
              ? formValuesRef.current.fechaCitaDestino ?? ""
              : "",
          fechaRetiro: "",
          fechaCitaDesvio: "",
          programarDesvio: false,
          isAnticipada: false,
          containerNumber: "",
          containerSize: "",
          sealNumber: "",
          relatedOperationId: "",
          nuevoDestinoId: "",
          diasLibresDevolucion: "",
          depositoDevolucionId: "",
        });
      }
      Object.assign(formValuesRef.current, clearedRouteValues);
      return clearedRouteValues;
    }
    if (name === "vehicleCapacityId") {
      const selectedConfiguration = vehicleTypes.find(
        (vehicleType) => vehicleType.id === Number(value),
      );
      if (selectedConfiguration && !selectedConfiguration.requiresTrailer) {
        formValuesRef.current.requiredTrailerType = "";
        return { requiredTrailerType: "" };
      }
    }
    if (name === "dimensions" && typeof value === "string") {
      const dimensions = value.match(
        /^\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*m?\s*$/i,
      );
      if (dimensions) {
        const [length, width, height] = dimensions
          .slice(1)
          .map((dimension) => Number(dimension.replace(",", ".")));
        const volumeM3 = Math.round(length * width * height * 1000) / 1000;
        formValuesRef.current.volumeM3 = String(volumeM3);
        return { volumeM3: String(volumeM3) };
      }
    }
    if (name === "relatedOperationId") {
      const selectedParentOperation = relatedParentOperations.find(
        (operation) => operation.id === Number(value),
      );
      if (!selectedParentOperation) return {};

      const parentFechaRetiro = formatDateForForm(
        selectedParentOperation.fechaRetiro,
      );
      const parentDays =
        selectedParentOperation.diasLibresDevolucion ?? "";
      const inheritedValues: Record<string, FormFieldValue> = {
        containerNumber: selectedParentOperation.containerNumber ?? "",
        fechaRetiro: parentFechaRetiro,
        diasLibresDevolucion: parentDays,
        fechaLimiteDevolucion:
          formatDateForForm(selectedParentOperation.fechaLimiteDevolucion) ||
          calculateDeadline(parentFechaRetiro, parentDays),
      };
      Object.assign(formValuesRef.current, inheritedValues);
      return inheritedValues;
    }

    const updatesDocumentaryDeadline =
      name === "fechaRetiro" || name === "diasLibresDocumental";
    const updatesEmptyReturnDeadline =
      (name === "fechaRetiro" || name === "diasLibresDevolucion") &&
      currentType === "IMPORTACION" &&
      cargoFormat === "CONTENERIZADA" &&
      !physicalDeadlineManuallyEdited.current;
    if (!updatesDocumentaryDeadline && !updatesEmptyReturnDeadline) {
      return {};
    }

    const updates: Record<string, FormFieldValue> = {};
    if (updatesDocumentaryDeadline) {
      const deadline = calculateDeadline(
        name === "fechaRetiro" ? value : formValuesRef.current.fechaRetiro,
        name === "diasLibresDocumental"
          ? value
          : formValuesRef.current.diasLibresDocumental,
      );
      formValuesRef.current.fechaLimiteDocumental = deadline;
      updates.fechaLimiteDocumental = deadline;
    }
    if (updatesEmptyReturnDeadline) {
      const deadline = calculateDeadline(
        name === "fechaRetiro" ? value : formValuesRef.current.fechaRetiro,
        name === "diasLibresDevolucion"
          ? value
          : formValuesRef.current.diasLibresDevolucion,
      );
      formValuesRef.current.fechaLimiteDevolucion = deadline;
      formValuesRef.current.fechaLimiteFisico = deadline;
      updates.fechaLimiteDevolucion = deadline;
      updates.fechaLimiteFisico = deadline;
    }
    return updates;
  };

  const handleSubmit = async (
    formData: Record<string, FormFieldValue>,
    createAndAssign = false,
  ) => {
    setErrors({});
    const isSubmittingDevolucion =
      formData.type === "DEVOLUCION_VACIO" || formData.type === "DEVOLUCION";
    const isContainerized = formData.isContainerized === true;
    const localErrors: Record<string, string> = {};
    const selectedOriginLocation = locations.find(
      (location) => location.id === Number(formData.origenId),
    );
    const selectedDestinationLocation = locations.find(
      (location) => location.id === Number(formData.destinoId),
    );
    const selectedClientCargoLocation = locations.find(
      (location) => location.id === Number(formData.descargueId),
    );
    const cargoValidation = operationCargoSchema.safeParse({
      ...formData,
      operationType: formData.type,
      isContainerized,
      ...(isImport || isExport
        ? {
            originIsPort: selectedOriginLocation?.isPort,
            originIsDepot:
              selectedOriginLocation &&
              (selectedOriginLocation.isDepot ||
                selectedOriginLocation.isOwnYard ||
                Boolean(
                  selectedOriginLocation.clients?.some(
                    (relation) =>
                      relation.clientId === Number(formData.clientId) &&
                      relation.isDepot,
                  ),
                )),
            originIsClientLocation: selectedOriginLocation
              ? Boolean(
                  selectedOriginLocation.clients?.some(
                    (relation) =>
                      relation.clientId === Number(formData.clientId) &&
                      (relation.isClient || relation.isDepot),
                  ),
                )
              : undefined,
            destinationIsPort: selectedDestinationLocation?.isPort,
            destinationIsClientLocation: selectedDestinationLocation
              ? Boolean(
                  selectedDestinationLocation.clients?.some(
                    (relation) =>
                      relation.clientId === Number(formData.clientId) &&
                      (relation.isClient || relation.isDepot),
                  ),
                )
              : undefined,
            clientStopIsClientLocation: selectedClientCargoLocation
              ? Boolean(
                  selectedClientCargoLocation.clients?.some(
                    (relation) =>
                      relation.clientId === Number(formData.clientId) &&
                      (relation.isClient || relation.isDepot),
                  ),
                )
              : undefined,
          }
        : {}),
      ...(isSubmittingDevolucion
        ? {
            originIsClientLocation: selectedOriginLocation
              ? Boolean(
                  selectedOriginLocation.clients?.some(
                    (relation) =>
                      relation.clientId === Number(formData.clientId) &&
                      relation.isClient &&
                      !relation.isDepot,
                  ),
                )
              : undefined,
            originIsOwnYard: selectedOriginLocation?.isOwnYard,
            destinationIsDepot: selectedDestinationLocation
              ? Boolean(
                  selectedDestinationLocation.isDepot ||
                  selectedDestinationLocation.clients?.some(
                    (relation) =>
                      relation.clientId === Number(formData.clientId) &&
                      relation.isDepot,
                  ),
                )
              : undefined,
            destinationIsPort: selectedDestinationLocation?.isPort,
          }
        : {}),
    });
    if (!cargoValidation.success) {
      for (const issue of cargoValidation.error.issues) {
        const fieldName = String(issue.path[0] ?? "cargoFormat");
        localErrors[fieldName] = issue.message;
      }
    }

    if (!formData.type && !isEdit) localErrors.type = "El tipo es obligatorio.";
    if (!formData.clientId && !isEdit)
      localErrors.clientId = "El cliente es obligatorio.";
    if (
      (formData.type === "RETIRO_VACIO" ||
        formData.type === "DEVOLUCION_VACIO") &&
      !isContainerized
    ) {
      localErrors.isContainerized =
        "El retiro de vacío debe ser una operación contenerizada.";
    }
    if (!formData.origenId) localErrors.origenId = "Selecciona un origen.";
    if (!formData.destinoId) localErrors.destinoId = "Selecciona un destino.";
    if (isContainerized && isExport && !formData.descargueId) {
      localErrors.descargueId = "Selecciona el lugar de cargue del cliente.";
    }
    const originAppointmentLocationId = Number(formData.origenId);
    const destinationAppointmentLocationId =
      isImport && isContainerized
        ? Number(formData.depositoDevolucionId)
        : Number(formData.destinoId);
    const originAppointmentLocation = locations.find(
      (location) => location.id === originAppointmentLocationId,
    );
    const destinationAppointmentLocation = isSubmittingDevolucion
      ? selectedDestinationLocation
      : locations.find(
          (location) => location.id === destinationAppointmentLocationId,
        );
    if (
      isContainerized &&
      originAppointmentLocation &&
      !originAppointmentLocation.isPort &&
      (originAppointmentLocation.isDepot ||
        originAppointmentLocation.isOwnYard)
    ) {
      const error = getPatioAppointmentError(formData.fechaCitaOrigen);
      if (error) localErrors.fechaCitaOrigen = error;
    }
    if (
      isContainerized &&
      destinationAppointmentLocation &&
      !destinationAppointmentLocation.isPort &&
      (destinationAppointmentLocation.isDepot ||
        destinationAppointmentLocation.isOwnYard)
    ) {
      const error = getPatioAppointmentError(formData.fechaCitaDestino);
      if (error) localErrors.fechaCitaDestino = error;
    }
    const isEmptyYardOperation =
      formData.type === "RETIRO_VACIO" ||
      formData.type === "DEVOLUCION_VACIO";
    const hasPatioRoute = [
      originAppointmentLocation,
      destinationAppointmentLocation,
    ].some(
      (location) =>
        location &&
        !location.isPort &&
        (location.isDepot || location.isOwnYard),
    );
    if (isEmptyYardOperation && hasPatioRoute) {
      const error = getPatioAppointmentError(formData.scheduledAt);
      if (error) localErrors.scheduledAt = error;
    }
    if (isContainerized && isExport && isAnticipada && formData.fechaRetiro) {
      const error = getPatioAppointmentError(formData.fechaRetiro);
      if (error) localErrors.fechaRetiro = error;
    }
    if (
      (formData.type === "IMPORTACION" || formData.type === "EXPORTACION") &&
      !formData.routeScope
    ) {
      localErrors.routeScope = "Selecciona el alcance de ruta.";
    }
    if (isContainerized && isExport && isAnticipada && !isEdit) {
      const destinationType = formData.destinoTemporalTipo;
      if (
        destinationType !== "PATIO_PROPIO" &&
        destinationType !== "BODEGA_CLIENTE"
      ) {
        localErrors.destinoTemporalTipo =
          "Selecciona Patio Propio o Bodega Cliente.";
      }
      const selectedTemporaryLocation = locations.find(
        (location) => location.id === Number(formData.destinoTemporalId),
      );
      const selectedLocationMatchesType =
        destinationType === "PATIO_PROPIO"
          ? selectedTemporaryLocation?.isOwnYard === true
          : destinationType === "BODEGA_CLIENTE"
            ? Boolean(
                selectedTemporaryLocation?.clients?.some(
                  (relation) =>
                    relation.clientId === clientId && relation.isDepot,
                ),
              )
            : false;
      if (!formData.destinoTemporalId || !selectedLocationMatchesType) {
        localErrors.destinoTemporalId =
          "Selecciona una ubicación válida para el destino temporal elegido.";
      }
      if (!formData.fechaRetiro) {
        localErrors.fechaRetiro =
          "Indica la fecha y hora del retiro anticipado.";
      }
    }
    const emptyCargoOperation =
      formData.type === "RETIRO_VACIO" ||
      formData.type === "DEVOLUCION_VACIO";
    const selectedVehicleConfiguration = vehicleTypes.find(
      (vehicleType) => vehicleType.id === Number(formData.vehicleCapacityId),
    );
    const enteredWeight = Number(formData.weight);
    if (!formData.vehicleCapacityId) {
      localErrors.vehicleCapacityId =
        "Selecciona el tipo de cabezote requerido.";
    }
    if (!isContainerized) {
      if (!String(formData.cargoDescription ?? "").trim() && !emptyCargoOperation)
        localErrors.cargoDescription = "Describe la carga.";
    }
    if (!emptyCargoOperation && (!Number.isFinite(enteredWeight) || enteredWeight <= 0)) {
      localErrors.weight = "Indica un peso de carga mayor que cero.";
    }
    if (
      Number.isFinite(enteredWeight) &&
      enteredWeight > 0 &&
      selectedVehicleConfiguration?.maxPayloadKg != null &&
      enteredWeight > selectedVehicleConfiguration.maxPayloadKg
    ) {
      localErrors.vehicleCapacityId =
        `El peso supera ${selectedVehicleConfiguration.maxPayloadKg.toLocaleString("es-CO")} kg útiles para ${selectedVehicleConfiguration.code}.`;
    }
    if (isContainerized) {
      if (isSubmittingDevolucion && !formData.containerNumber) {
        localErrors.containerNumber = "El número de contenedor es obligatorio.";
      } else if (!isSubmittingDevolucion && !formData.shippingLineId) {
        localErrors.shippingLineId = "La línea naviera es requerida.";
      }
      if (!isSubmittingDevolucion && !formData.containerNumber)
        localErrors.containerNumber = "El número de contenedor es obligatorio.";
      if (!isSubmittingDevolucion && !formData.containerSize)
        localErrors.containerSize = "Selecciona el tamaño del contenedor.";
      if (
        isSubmittingDevolucion &&
        String(formData.relatedOperationId ?? "").trim() &&
        (!Number.isInteger(Number(formData.relatedOperationId)) ||
          Number(formData.relatedOperationId) <= 0)
      ) {
        localErrors.relatedOperationId =
          "El ID de importación debe ser un entero positivo.";
      }
    }
    if (
      isContainerized &&
      isEdit &&
      operationBase?.containerStatus === "PENDIENTE_DEVOLUCION" &&
      Boolean(formData.nuevoDestinoId) !== Boolean(formData.fechaCitaDesvio)
    ) {
      localErrors.nuevoDestinoId =
        "Confirma tanto el destino como la fecha/hora de devolución.";
    }
    if (isContainerized && Boolean(formData.programarDesvio)) {
      if (!formData.nuevoDestinoId) {
        localErrors.nuevoDestinoId = "Selecciona el destino del desvío.";
      }
      const deviationLocation = locations.find(
        (location) => location.id === Number(formData.nuevoDestinoId),
      );
      if (
        deviationLocation &&
        !deviationLocation.isPort &&
        (deviationLocation.isDepot || deviationLocation.isOwnYard)
      ) {
        const error = getPatioAppointmentError(formData.fechaCitaDesvio);
        if (error) localErrors.fechaCitaDesvio = error;
      }
      if (!formData.destinoId) {
        localErrors.destinoId =
          "Define el descargue en el cliente antes de programar el desvío.";
      }
    }

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    const payload: UpdateOperationPayload & Record<string, unknown> = {};

    if (!isEdit) {
      payload.type = String(formData.type);
      payload.clientId = Number(formData.clientId);
      payload.isAnticipada = isContainerized && isAnticipada;
      payload.requiresInspection =
        isContainerized &&
        formData.type === "IMPORTACION" &&
        Boolean(formData.requiresInspection);
      if (
        isSubmittingDevolucion &&
        String(formData.relatedOperationId ?? "").trim()
      ) {
        payload.relatedOperationId = Number(formData.relatedOperationId);
      }
      if (
        isContainerized &&
        isImport &&
        Boolean(formData.programarDesvio)
      ) {
        payload.programarDesvio = true;
        payload.nuevoDestinoId = Number(formData.nuevoDestinoId);
        payload.fechaCitaDesvio = formData.fechaCitaDesvio
          ? new Date(String(formData.fechaCitaDesvio)).toISOString()
          : null;
      }
    }

    payload.isContainerized = isContainerized;
    if (formData.routeScope) {
      payload.routeScope = String(formData.routeScope) as "URBANO" | "NACIONAL";
    }
    payload.vehicleCapacityId = Number(formData.vehicleCapacityId);
    if (!isEdit) {
      payload.vehicleId = null;
      payload.driverId = null;
      payload.trailerId = null;
    }
    payload.cargoVehicleTypeCode =
      CARGO_VEHICLE_TYPE_CODES.find(
        (vehicleTypeCode) =>
          vehicleTypeCode === selectedVehicleConfiguration?.code,
      ) ?? null;
    payload.requiredTrailerType =
      TRAILER_TYPES.find(
        (trailerType) => trailerType === formData.requiredTrailerType,
      ) ?? null;
    payload.shippingLineId =
      isContainerized && !isSubmittingDevolucion && formData.shippingLineId
        ? Number(formData.shippingLineId)
        : null;
    payload.requiresInspection =
      isContainerized &&
      formData.type === "IMPORTACION" &&
      Boolean(formData.requiresInspection);
    if (!isContainerized) {
      payload.containerNumber = null;
      payload.containerSize = null;
      payload.cargoDescription = String(formData.cargoDescription).trim();
      payload.dimensions = String(formData.dimensions ?? "").trim() || null;
      payload.packageType = String(formData.packageType ?? "").trim() || null;
      payload.packageCount = formData.packageCount
        ? Number(formData.packageCount)
        : null;
      payload.volumeM3 = formData.volumeM3 ? Number(formData.volumeM3) : null;
    } else {
      payload.containerNumber = String(formData.containerNumber).toUpperCase();
      payload.containerSize = isSubmittingDevolucion
        ? null
        : String(formData.containerSize);
      payload.cargoDescription = null;
      payload.dimensions = null;
      payload.packageType = null;
      payload.packageCount = null;
      payload.volumeM3 = null;
    }
    payload.weight =
      Number.isFinite(enteredWeight) && enteredWeight > 0
        ? enteredWeight
        : null;

    if (formData.scheduledAt)
      payload.scheduledAt = new Date(
        String(formData.scheduledAt),
      ).toISOString();
    if (isContainerized && formData.peso) payload.peso = Number(formData.peso);
    if (!isContainerized) {
      payload.sealNumber = null;
    } else if (formData.sealNumber) {
      payload.sealNumber = String(formData.sealNumber).toUpperCase();
    }

    if (formData.numeroPedido)
      payload.numeroPedido = String(formData.numeroPedido);
    if (formData.documentoTransporte)
      payload.documentoTransporte = String(formData.documentoTransporte);
    if (formData.observaciones)
      payload.observaciones = String(formData.observaciones);
    if (
      formData.fleteACobrarManual !== undefined &&
      formData.fleteACobrarManual !== "" &&
      formData.fleteACobrarManual !== null
    ) {
      payload.fleteACobrarManual = Number(formData.fleteACobrarManual);
      payload.fleteACobrar = null;
    } else {
      payload.fleteACobrarManual = null;
      if (suggestedPrice !== null) {
        payload.fleteACobrar = Number(suggestedPrice);
      }
    }

    if (formData.origenId) payload.origenId = Number(formData.origenId);
    if (formData.destinoId) payload.destinoId = Number(formData.destinoId);
    if (
      isContainerized &&
      isExport &&
      isAnticipada &&
      formData.destinoTemporalId
    ) {
      payload.destinoTemporalId = Number(formData.destinoTemporalId);
    } else if (!isContainerized) {
      payload.destinoTemporalId = null;
    }
    if (!isContainerized) {
      const customDestinationAddress = String(
        formData.destinoCustomAddress ?? "",
      ).trim();
      const useCustomDestination =
        Boolean(formData.destinoCustomAddressEnabled) &&
        customDestinationAddress.length > 0;
      payload.stops = [
        {
          clientId: Number(formData.clientId),
          locationId: Number(formData.origenId),
          isCustomAddress: false,
          stopType: "CARGUE",
          stopOrder: 0,
        },
        {
          clientId: Number(formData.clientId),
          locationId: useCustomDestination ? null : Number(formData.destinoId),
          isCustomAddress: useCustomDestination,
          ...(useCustomDestination
            ? { address: customDestinationAddress }
            : {}),
          stopType: "DESCARGUE",
          stopOrder: 1,
        },
      ];
    }

    if (isContainerized && isExport && formData.descargueId) {
      payload.cargueId = Number(formData.descargueId);
      payload.descargueId = null;
    } else {
      payload.cargueId = null;
      payload.descargueId = null;
    }

    if (
      supportsAppointmentFields(String(formData.type ?? "")) &&
      (isContainerized || selectedOriginLocation?.isPort === true) &&
      formData.fechaCitaOrigen
    ) {
      payload.fechaCitaOrigen = new Date(
        String(formData.fechaCitaOrigen),
      ).toISOString();
    } else {
      payload.fechaCitaOrigen = null;
    }
    if (
      supportsAppointmentFields(String(formData.type ?? "")) &&
      (isContainerized || selectedDestinationLocation?.isPort === true) &&
      formData.fechaCitaDestino
    ) {
      payload.fechaCitaDestino = new Date(
        String(formData.fechaCitaDestino),
      ).toISOString();
    } else {
      payload.fechaCitaDestino = null;
    }
    const fechaRetiroInput = String(formData.fechaRetiro ?? "").trim();
    if (
      isContainerized &&
      fechaRetiroInput &&
      (!isEdit ||
        fechaRetiroInput !== formatDateForForm(operationBase?.fechaRetiro))
    ) {
      payload.fechaRetiro = new Date(fechaRetiroInput).toISOString();
    } else if (
      !isContainerized ||
      (isEdit && operationBase?.fechaRetiro && !fechaRetiroInput)
    ) {
      payload.fechaRetiro = null;
    }
    const fechaLimiteCierreFisicoInput = String(
      formData.fechaLimiteDevolucion ?? formData.fechaLimiteFisico ?? "",
    ).trim();
    if (fechaLimiteCierreFisicoInput) {
      const physicalDeadline = new Date(
        fechaLimiteCierreFisicoInput,
      ).toISOString();
      payload.fechaLimiteFisico = physicalDeadline;
      payload.fechaLimiteDevolucion = physicalDeadline;
    } else if (
      isEdit &&
      (operationBase?.fechaLimiteFisico ||
        operationBase?.fechaLimiteDevolucion)
    ) {
      payload.fechaLimiteFisico = null;
      payload.fechaLimiteDevolucion = null;
    }
    const diasLibresDocumentalInput = String(
      formData.diasLibresDocumental ?? "",
    ).trim();
    if (diasLibresDocumentalInput) {
      payload.diasLibresDocumental = Number(diasLibresDocumentalInput);
    } else if (isEdit && operationBase?.diasLibresDocumental != null) {
      payload.diasLibresDocumental = null;
    }
    const fechaLimiteDocumentalInput = String(
      formData.fechaLimiteDocumental ?? "",
    ).trim();
    if (fechaLimiteDocumentalInput) {
      payload.fechaLimiteDocumental = new Date(
        fechaLimiteDocumentalInput,
      ).toISOString();
    } else if (isEdit && operationBase?.fechaLimiteDocumental) {
      payload.fechaLimiteDocumental = null;
    }
    const diasLibresDevolucionInput = String(
      formData.diasLibresDevolucion ?? "",
    ).trim();
    if (isContainerized && diasLibresDevolucionInput) {
      payload.diasLibresDevolucion = Number(diasLibresDevolucionInput);
    } else if (
      !isContainerized ||
      (isEdit && operationBase?.diasLibresDevolucion != null)
    ) {
      payload.diasLibresDevolucion = null;
    }
    if (!isContainerized) {
      payload.depositoDevolucionId = null;
      payload.fechaCitaDesvio = null;
      payload.nuevoDestinoId = null;
    } else if (isImport) {
      const returnDepotId = String(formData.depositoDevolucionId ?? "").trim();
      payload.depositoDevolucionId = returnDepotId
        ? Number(returnDepotId)
        : null;
    }
    if (
      isContainerized &&
      isEdit &&
      operationBase?.containerStatus === "PENDIENTE_DEVOLUCION" &&
      formData.nuevoDestinoId
    ) {
      payload.nuevoDestinoId = Number(formData.nuevoDestinoId);
      payload.fechaCitaDesvio = formData.fechaCitaDesvio
        ? new Date(String(formData.fechaCitaDesvio)).toISOString()
        : null;
    }

    try {
      if (isEdit && operationBase) {
        const updated = await updateOperation(operationBase.id, payload);
        if (!updated) {
          setErrors({
            global: "No se pudo guardar la operación. Revisa el mensaje e inténtalo de nuevo.",
          });
          return;
        }
      } else {
        const created = await createOperation(payload);
        if (!created) {
          setErrors({
            global: "No se pudo crear la operación. Revisa el mensaje e inténtalo de nuevo.",
          });
          return;
        }
        if (createAndAssign && onCreatedForDispatch) {
          onCreatedForDispatch(created);
          return;
        }
      }
      onClose();
    } catch (error) {
      console.error("Error al guardar la operación:", error);
      setErrors({ global: "Ocurrió un error al guardar en el servidor." });
    }
  };

  return {
    categorizedFields,
    isContainerized: cargoFormat === "CONTENERIZADA",
    isDevolucion,
    initialValues,
    handleSubmit,
    handleFormChange,
    setFieldsOnChange,
    errors,
    isLoadingOperations:
      isLoadingOperations ||
      isLoadingLocations ||
      isLoadingVehicleTypes ||
      shippingLinesQuery.isLoading ||
      relatedParentOperationsQuery.isLoading,
    shippingLinesError: shippingLinesQuery.isError,
    vehicleTypesError,
    relatedOperationsError: relatedParentOperationsQuery.isError,
    suggestedPrice,
    isCalculatingPrice,
    tariffLookupError: tariffLookupEnabled && tariffLookupQuery.isError,
    tariffLookupCompleted:
      tariffLookupEnabled && tariffLookupQuery.isFetched,
    canLookupTariff: currentQuoteParams !== null,
  };
};

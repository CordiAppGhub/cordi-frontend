"use client";

import { createElement, useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { useTariffs } from "../../tariff/hooks/useTariff";
import { Operation } from "@/types/operation-types";
import { useTrafico } from "./use-operations";
import { OperationDateTimePicker } from "../components/forms/operation-date-time-picker";
import { operationCargoSchema } from "@/schemas/operation.schema";
import { ContainerType } from "@/types/tariff-ypes";
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

const dateTimeField = (name: string, label: FormField["label"]): FormField => ({
  name,
  label,
  type: "custom",
  render: (value, onChange) =>
    createElement(OperationDateTimePicker, {
      value: typeof value === "string" ? value : "",
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

export const useOperationForm = (
  onClose: () => void,
  operationBase?: Operation | null,
) => {
  const { updateOperation, createOperation, isLoadingOperations } =
    useTrafico();
  const { clients } = useClients();
  const { locations, isLoadingLocations } = useLocations();
  const shippingLinesQuery = useQuery({
    queryKey: ["shipping-lines"],
    queryFn: operationService.getShippingLines,
  });
  const {
    suggestedPrice,
    isCalculatingPrice,
    getLiveQuote,
    resetQuote,
    vehicleTypes,
  } = useTariffs();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [programarDesvio, setProgramarDesvio] = useState(false);

  const isEdit = !!operationBase;

  const [currentType, setCurrentType] = useState<string>(
    operationBase?.type || "",
  );
  const [isAnticipada, setIsAnticipada] = useState<boolean>(
    operationBase?.isAnticipada || false,
  );
  const [cargoFormat, setCargoFormat] = useState<"CONTENERIZADA" | "SUELTA">(
    operationBase?.isContainerized ? "CONTENERIZADA" : "SUELTA",
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
    operationBase?.origen?.id || null,
  );
  const [destinoId, setDestinoId] = useState<number | null>(
    operationBase?.destino?.id || null,
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

  const quoteLocationId =
    isImport || isExport
      ? selectedDescargueId
      : isRetiroVacio
        ? destinoId
        : isDevolucion
          ? origenId
          : destinoId;

  const initialValues = useMemo(() => {
    if (!operationBase) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      return {
        scheduledAt: formatDateForForm(tomorrow),
        cargoFormat: "SUELTA",
        isContainerized: false,
        routeScope: null,
        containerSize: "DRY_40",
        vehicleCapacityId: "",
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
      };
    }

    return {
      type: operationBase.type,
      routeScope: operationBase.routeScope ?? null,
      cargoFormat: operationBase.isContainerized ? "CONTENERIZADA" : "SUELTA",
      isContainerized: operationBase.isContainerized,
      vehicleCapacityId: operationBase.vehicleCapacityId ?? "",
      shippingLineId: operationBase.shippingLineId
        ? String(operationBase.shippingLineId)
        : "",
      depositoDevolucionId: operationBase.depositoDevolucionId
        ? String(operationBase.depositoDevolucionId)
        : "",
      destinoCustomAddressEnabled:
        operationBase.stops?.at(-1)?.isCustomAddress ?? false,
      destinoCustomAddress: operationBase.stops?.at(-1)?.address ?? "",
      requiresInspection: operationBase.requiresInspection ?? false,
      clientId: operationBase.client?.id || operationBase.clientId,
      isAnticipada: operationBase.isAnticipada,
      origenId: operationBase.origen?.id,
      descargueId: operationBase.descargue?.id || operationBase.cargue?.id,
      destinoId: operationBase.destino?.id,

      containerNumber: operationBase.containerNumber || "",
      relatedOperationId: operationBase.relatedOperationId ?? "",
      containerSize: getContainerSize(operationBase.containerType) || "DRY_40",
      peso: operationBase.peso || "",
      cargoDescription: operationBase.cargoDescription || "",
      weight: operationBase.weight ?? "",
      dimensions: operationBase.dimensions || "",
      packageType: operationBase.packageType ?? "",
      packageCount: operationBase.packageCount ?? "",
      volumeM3: operationBase.volumeM3 ?? "",
      sealNumber: operationBase.sealNumber || "",
      pinRetiro: operationBase.pinRetiro || "",

      numeroPedido: operationBase.numeroPedido || "",
      documentoTransporte: operationBase.documentoTransporte || "",

      observaciones: operationBase.observaciones || "",
      fleteACobrarManual: operationBase.fleteACobrarManual ?? "",

      scheduledAt: formatDateForForm(operationBase.scheduledAt),
      fechaCitaOrigen: formatDateForForm(operationBase.fechaCitaOrigen),
      fechaCitaDestino: formatDateForForm(operationBase.fechaCitaDestino),
      fechaRetiro: formatDateForForm(operationBase.fechaRetiro),
      nuevoDestinoId: operationBase.nuevoDestinoId || "",
      fechaCitaDesvio: formatDateForForm(operationBase.fechaCitaDesvio),
      programarDesvio: false,
    };
  }, [operationBase]);

  useEffect(() => {
    if (!clientId || !currentType) {
      resetQuote();
      return;
    }

    if (!quoteLocationId || !routeScope) {
      resetQuote();
      return;
    }

    getLiveQuote(
      clientId,
      currentType,
      quoteLocationId,
      routeScope,
      cargoFormat === "CONTENERIZADA",
    );
  }, [
    clientId,
    currentType,
    origenId,
    destinoId,
    selectedDescargueId,
    routeScope,
    quoteLocationId,
    isImport,
    isExport,
    isRetiroVacio,
    isDevolucion,
    cargoFormat,
    containerSize,
    vehicleTypeId,
    getLiveQuote,
    resetQuote,
  ]);

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
    let filteredLocations = locations.filter(
      (loc) => !loc.isPort && !loc.isDepot,
    );

    if (clientId) {
      filteredLocations = filteredLocations.filter((loc) =>
        loc.clients?.some((c) => c.clientId === clientId),
      );
    }

    return filteredLocations.map((l) => ({ value: l.id, label: l.name }));
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
        .filter((loc) => loc.isDepot || loc.isOwnYard)
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
        name: "pinRetiro",
        label: "PIN de Retiro",
        type: "text",
        placeholder: "Opcional",
        visible: (formData) =>
          !isDevolucion && formData.isContainerized === true,
      },
      ...(!isEdit
        ? [
            {
              name: "requiresInspection",
              label: "La línea naviera exige inspección",
              type: "checkbox" as const,
              visible: () => !isDevolucion,
            },
          ]
        : []),
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
          label: isDevolucion
            ? "Bodega del Cliente / Patio Propio *"
            : isExport
              ? "Patio de Retiro (Vacío) *"
              : isRetiroVacio
                ? "Puerto de Retiro (Vacío) *"
                : "Puerto de Retiro (Lleno) *",
          type: "select",
          options: origenOptions,
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
                  formData.type === "EXPORTACION" &&
                  formData.isAnticipada === true &&
                  Boolean(formData.destinoTemporalTipo) &&
                  !isEdit,
              },
            ]
          : []),
        {
          name: "descargueId",
          label: isExport
            ? "Lugar de Cargue (Cliente) *"
            : "Lugar de Descargue (Cliente) *",
          type: "select",
          options: descargueOptions,
          disabled: !clientId,
          visible: (formData) =>
            formData.type === "IMPORTACION" || formData.type === "EXPORTACION",
        },
        {
          name: "destinoId",
          label: isDevolucion
            ? "Depósito Naviera / Puerto *"
            : isExport
              ? "Puerto de Ingreso (Lleno) *"
              : isRetiroVacio
                ? "Destino del contenedor vacío *"
                : "Patio de Devolución (Vacío) *",
          type: "select",
          options: destinoOptions,
        },
        {
          name: "destinoCustomAddressEnabled",
          label: "¿Usar dirección personalizada?",
          type: "checkbox",
          visible: (formData) =>
            !isDevolucion &&
            formData.isContainerized !== true &&
            formData.type !== "EXPORTACION",
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
        const selectedLocationId = Number(formData[locationField]);
        const selectedLocation = locations.find(
          (location) => location.id === selectedLocationId,
        );
        const appointmentRequired = Boolean(selectedLocation?.exigeCita);
        const baseLabel =
          appointment === "origen" ? "Cita de origen" : "Cita de destino";
        const locationLabel = formatAppointmentLocationLabel(
          baseLabel,
          selectedLocation?.name,
        );
        return `${locationLabel}${appointmentRequired ? " *" : ""}`;
      };

      if (isDevolucion) {
        generalFields.push(
          {
            name: "fechasDevolucion",
            label: "Fechas - Devolución de vacío",
            type: "text",
            sectionTitle: true,
            fullWidth: true,
          },
          dateTimeField("scheduledAt", "Fecha y hora de operación *"),
          dateTimeField("fechaCitaDestino", (formData) =>
            getAppointmentLabel("destino", formData),
          ),
        );
      } else if (isExport && isAnticipada) {
        generalFields.push(
          {
            name: "tiemposRetiroVacio",
            label: "Tiempos del Retiro del Vacío",
            type: "text",
            sectionTitle: true,
            fullWidth: true,
          },
          dateTimeField("fechaRetiro", "Fecha y hora de retiro anticipado *"),
          {
            name: "tiemposExportacion",
            label: "Tiempos de Exportación",
            type: "text",
            sectionTitle: true,
            fullWidth: true,
          },
          dateTimeField("scheduledAt", "Fecha y hora de operación *"),
          dateTimeField("fechaCitaOrigen", (formData) =>
            getAppointmentLabel("origen", formData),
          ),
          dateTimeField("fechaCitaDestino", (formData) =>
            getAppointmentLabel("destino", formData),
          ),
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
          dateTimeField("scheduledAt", "Fecha y hora de operación *"),
          dateTimeField("fechaCitaOrigen", (formData) =>
            getAppointmentLabel("origen", formData),
          ),
          dateTimeField("fechaCitaDestino", (formData) =>
            getAppointmentLabel("destino", formData),
          ),
        );
        if (isExport) {
          generalFields.push(
            dateTimeField("fechaRetiro", "Fecha de Retiro (Vacío)"),
          );
        }
      }

      if (isImport) {
        generalFields.push(
          {
            name: "depositoDevolucionId",
            label: "Depósito de devolución del vacío",
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
          },
        );
      }
      if (isEdit && operationBase?.containerStatus === "PENDIENTE_DEVOLUCION") {
        generalFields.push(
          {
            name: "nuevoDestinoId",
            label: "Nuevo destino confirmado por naviera *",
            type: "select",
            options: desvioDestinationOptions,
          },
          dateTimeField("fechaCitaDesvio", "Fecha y hora de nueva cita *"),
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
          dateTimeField("fechaCitaDesvio", "Fecha y hora de cita del desvío *"),
        );
      }
    }

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
            label: "ID de importación original (opcional)",
            type: "number",
            placeholder: "Ingrese el ID de la operación de importación",
            fullWidth: true,
          },
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
            {
              name: "vehicleCapacityId",
              label: "Capacidad del vehículo *",
              type: "select",
              options: [
                { value: "", label: "-- Seleccionar capacidad --" },
                ...vehicleTypes.map((vehicleType) => ({
                  value: vehicleType.id,
                  label: vehicleType.name,
                })),
              ],
              visible: (formData) => formData.isContainerized !== true,
            },
            {
              name: "weight",
              label: "Peso (kg) *",
              type: "number",
              placeholder: "Peso en kg",
              visible: (formData) => formData.isContainerized !== true,
            },
            {
              name: "volumeM3",
              label: "Volumen (m³) *",
              type: "number",
              placeholder: "Volumen en metros cúbicos",
              visible: (formData) => formData.isContainerized !== true,
            },
            {
              name: "packageType",
              label: "Tipo de empaque *",
              type: "text",
              placeholder: "Ej: Caja, estiba, bulto",
              visible: (formData) => formData.isContainerized !== true,
            },
            {
              name: "packageCount",
              label: "Cantidad de bultos/estibas *",
              type: "number",
              placeholder: "Número de bultos o estibas",
              visible: (formData) => formData.isContainerized !== true,
            },
            {
              name: "cargoDescription",
              label: "Descripción de la carga *",
              type: "textarea",
              placeholder: "Describe la mercancía",
              fullWidth: true,
              visible: (formData) => formData.isContainerized !== true,
            },
            {
              name: "dimensions",
              label: "Dimensiones *",
              type: "text",
              placeholder: "Ej: 2.4 x 1.8 x 1.5 m",
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
            { name: "observaciones", label: "Observaciones", type: "textarea" },
          ]
        : [];

    return { generalFields, cargaFields, liquidacionFields };
  }, [
    currentType,
    isEdit,
    operationBase,
    clientOptions,
    shippingLinesQuery.data,
    vehicleTypes,
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
  ]);
  const handleFormChange = (name: string, value: FormFieldValue) => {
    setErrors({});

    if (name === "type") {
      setCurrentType(String(value));
      setIsAnticipada(false);
      resetQuote();
    }
    if (name === "isAnticipada") setIsAnticipada(Boolean(value));
    if (name === "cargoFormat")
      setCargoFormat(String(value) as "CONTENERIZADA" | "SUELTA");
    if (name === "isContainerized")
      setCargoFormat(value ? "CONTENERIZADA" : "SUELTA");
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
        resetQuote();
      }
    }
  };

  const handleSubmit = async (formData: Record<string, FormFieldValue>) => {
    setErrors({});
    const isSubmittingDevolucion =
      formData.type === "DEVOLUCION_VACIO" || formData.type === "DEVOLUCION";
    const isContainerized =
      Boolean(formData.isContainerized) || isSubmittingDevolucion;
    const localErrors: Record<string, string> = {};
    const selectedOriginLocation = locations.find(
      (location) => location.id === Number(formData.origenId),
    );
    const selectedDestinationLocation = locations.find(
      (location) => location.id === Number(formData.destinoId),
    );
    const cargoValidation = operationCargoSchema.safeParse({
      ...formData,
      operationType: formData.type,
      isContainerized,
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
    if (!formData.scheduledAt)
      localErrors.scheduledAt = "La fecha y hora son obligatorias.";
    if (!formData.origenId) localErrors.origenId = "Selecciona un origen.";
    if (!formData.destinoId) localErrors.destinoId = "Selecciona un destino.";
    if (
      (formData.type === "IMPORTACION" || formData.type === "EXPORTACION") &&
      !formData.descargueId
    ) {
      localErrors.descargueId = "Selecciona la sede del cliente.";
    }
    const originAppointmentLocationId = Number(formData.origenId);
    const destinationAppointmentLocationId = Number(formData.destinoId);
    const originAppointmentLocation = locations.find(
      (location) => location.id === originAppointmentLocationId,
    );
    const destinationAppointmentLocation = isSubmittingDevolucion
      ? selectedDestinationLocation
      : locations.find(
          (location) => location.id === destinationAppointmentLocationId,
        );
    if (
      !isSubmittingDevolucion &&
      originAppointmentLocation?.exigeCita &&
      !formData.fechaCitaOrigen
    ) {
      localErrors.fechaCitaOrigen = `Indica la cita en origen para ${originAppointmentLocation.name}.`;
    }
    if (
      destinationAppointmentLocation?.exigeCita &&
      !formData.fechaCitaDestino
    ) {
      localErrors.fechaCitaDestino = `Indica la cita en destino para ${destinationAppointmentLocation.name}.`;
    }
    if (
      (formData.type === "IMPORTACION" || formData.type === "EXPORTACION") &&
      !formData.routeScope
    ) {
      localErrors.routeScope = "Selecciona el alcance de ruta.";
    }
    if (isExport && isAnticipada && !isEdit) {
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
    if (!isContainerized && !formData.vehicleCapacityId) {
      localErrors.vehicleCapacityId = "Selecciona la capacidad del vehículo.";
    }
    if (!isContainerized) {
      if (!formData.weight) localErrors.weight = "Indica el peso en kg.";
      if (!String(formData.packageType ?? "").trim())
        localErrors.packageType = "Indica el tipo de empaque.";
      if (!formData.packageCount)
        localErrors.packageCount = "Indica la cantidad de bultos o estibas.";
      if (!formData.volumeM3)
        localErrors.volumeM3 = "Indica el volumen de la carga.";
      if (!String(formData.cargoDescription ?? "").trim())
        localErrors.cargoDescription = "Describe la carga.";
    } else {
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
      isEdit &&
      operationBase?.containerStatus === "PENDIENTE_DEVOLUCION" &&
      Boolean(formData.nuevoDestinoId) !== Boolean(formData.fechaCitaDesvio)
    ) {
      localErrors.nuevoDestinoId =
        "Confirma tanto el destino como la fecha/hora de devolución.";
    }
    if (Boolean(formData.programarDesvio)) {
      if (!formData.nuevoDestinoId) {
        localErrors.nuevoDestinoId = "Selecciona el destino del desvío.";
      }
      if (!formData.fechaCitaDesvio) {
        localErrors.fechaCitaDesvio = "Indica la fecha y hora de la cita.";
      }
      if (!formData.descargueId) {
        localErrors.descargueId =
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
      payload.isAnticipada = isAnticipada;
      payload.requiresInspection = Boolean(formData.requiresInspection);
      if (
        isSubmittingDevolucion &&
        String(formData.relatedOperationId ?? "").trim()
      ) {
        payload.relatedOperationId = Number(formData.relatedOperationId);
      }
      if (isImport && Boolean(formData.programarDesvio)) {
        payload.programarDesvio = true;
        payload.nuevoDestinoId = Number(formData.nuevoDestinoId);
        payload.fechaCitaDesvio = new Date(
          String(formData.fechaCitaDesvio),
        ).toISOString();
      }
    }

    payload.isContainerized = isContainerized;
    if (formData.routeScope) {
      payload.routeScope = String(formData.routeScope) as "URBANO" | "NACIONAL";
    }
    payload.vehicleCapacityId = !isContainerized
      ? Number(formData.vehicleCapacityId)
      : null;
    payload.shippingLineId =
      isContainerized && !isSubmittingDevolucion && formData.shippingLineId
        ? Number(formData.shippingLineId)
        : null;
    if (!isContainerized) {
      payload.containerNumber = null;
      payload.containerSize = null;
      payload.cargoDescription = String(formData.cargoDescription).trim();
      payload.weight = Number(formData.weight);
      payload.dimensions = String(formData.dimensions);
      payload.packageType = String(formData.packageType).trim();
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
      payload.weight = null;
      payload.dimensions = null;
      payload.packageType = null;
      payload.packageCount = null;
      payload.volumeM3 = null;
    }

    if (formData.scheduledAt)
      payload.scheduledAt = new Date(
        String(formData.scheduledAt),
      ).toISOString();
    if (isContainerized && formData.peso) payload.peso = Number(formData.peso);
    if (formData.sealNumber)
      payload.sealNumber = String(formData.sealNumber).toUpperCase();
    if (formData.pinRetiro) payload.pinRetiro = String(formData.pinRetiro);

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
      if (suggestedPrice) {
        payload.fleteACobrar = Number(suggestedPrice);
      }
    }

    if (formData.origenId) payload.origenId = Number(formData.origenId);
    if (formData.destinoId) payload.destinoId = Number(formData.destinoId);
    if (isExport && isAnticipada && formData.destinoTemporalId) {
      payload.destinoTemporalId = Number(formData.destinoTemporalId);
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

    if (isExport && formData.descargueId)
      payload.cargueId = Number(formData.descargueId);
    if (isImport && formData.descargueId)
      payload.descargueId = Number(formData.descargueId);

    if (formData.fechaCitaOrigen)
      payload.fechaCitaOrigen = new Date(
        String(formData.fechaCitaOrigen),
      ).toISOString();
    if (formData.fechaCitaDestino)
      payload.fechaCitaDestino = new Date(
        String(formData.fechaCitaDestino),
      ).toISOString();
    const fechaRetiroInput = String(formData.fechaRetiro ?? "").trim();
    if (
      fechaRetiroInput &&
      (!isEdit ||
        fechaRetiroInput !== formatDateForForm(operationBase?.fechaRetiro))
    ) {
      payload.fechaRetiro = new Date(fechaRetiroInput).toISOString();
    }
    if (isImport) {
      const returnDepotId = String(formData.depositoDevolucionId ?? "").trim();
      payload.depositoDevolucionId = returnDepotId
        ? Number(returnDepotId)
        : null;
    }
    if (
      isEdit &&
      operationBase?.containerStatus === "PENDIENTE_DEVOLUCION" &&
      formData.nuevoDestinoId &&
      formData.fechaCitaDesvio
    ) {
      payload.nuevoDestinoId = Number(formData.nuevoDestinoId);
      payload.fechaCitaDesvio = new Date(
        String(formData.fechaCitaDesvio),
      ).toISOString();
    }

    try {
      if (isEdit && operationBase) {
        await updateOperation(operationBase.id, payload);
      } else {
        // 2. Usa la mutación en lugar del servicio directo
        await createOperation(payload);
      }
      onClose();
    } catch (error) {
      console.error("Error al guardar la operación:", error);
      setErrors({ global: "Ocurrió un error al guardar en el servidor." });
    }
  };

  return {
    categorizedFields,
    isDevolucion,
    initialValues,
    handleSubmit,
    handleFormChange,
    errors,
    isLoadingOperations:
      isLoadingOperations || isLoadingLocations || shippingLinesQuery.isLoading,
    shippingLinesError: shippingLinesQuery.isError,
    suggestedPrice,
    isCalculatingPrice,
  };
};

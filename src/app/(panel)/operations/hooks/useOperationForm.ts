"use client";

import { createElement, useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FormField,
  FormFieldValue,
} from "@/components/organisms/form/types/form.types";
import { useClients } from "@/hooks/useClient";
import { useLocations } from "@/app/(panel)/locations/hooks/useLocation";
import { operationService, UpdateOperationPayload } from "@/services/operation.service";
import { useTariffs } from "../../tariff/hooks/useTariff";
import { Operation } from "@/types/operation-types";
import { useTrafico } from "./useOperations";
import { OperationDateTimePicker } from "../components/operation-date-time-picker";

const typeOptions = [
  { value: "IMPORTACION", label: "Importación" },
  { value: "EXPORTACION", label: "Exportación" },
  { value: "RETIRO_VACIO", label: "Retiro de Vacío" },
  { value: "DEVOLUCION", label: "Devolución de Vacío" },
  { value: "NACIONAL", label: "Nacional" },
  { value: "CARGA_SUELTA_URBANA", label: "Carga Suelta Urbana" },
  { value: "CARGA_SUELTA_NACIONAL", label: "Carga Suelta Nacional" },
  { value: "MOVIMIENTO_INTERNO", label: "Movimiento Interno" },
];

const dateTimeField = (name: string, label: string): FormField => ({
  name,
  label,
  type: "custom",
  render: (value, onChange) =>
    createElement(OperationDateTimePicker, {
      value: typeof value === "string" ? value : "",
      onChange: (nextValue: string) => onChange(nextValue),
    }),
});

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
  const { suggestedPrice, isCalculatingPrice, getLiveQuote, resetQuote } =
    useTariffs();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [programarDesvio, setProgramarDesvio] = useState(false);

  const isEdit = !!operationBase;

  const [currentType, setCurrentType] = useState<string>(
    operationBase?.type || "",
  );
  const [isAnticipada, setIsAnticipada] = useState<boolean>(
    operationBase?.isAnticipada || false,
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
  const [clientId, setClientId] = useState<number | null>(
    operationBase?.client?.id || operationBase?.clientId || null,
  );

  const isExport =
    currentType === "EXPORTACION" || currentType.includes("Exportación");
  const isImport =
    currentType === "IMPORTACION" || currentType.includes("Importación");
  const isRetiroVacio = currentType === "RETIRO_VACIO";
  const isDevolucion = currentType === "DEVOLUCION";

  const origenLocation = locations.find((loc) => loc.id === origenId);
  const destinoLocation = locations.find((loc) => loc.id === destinoId);
  const descargueLocation = locations.find(
    (loc) => loc.id === selectedDescargueId,
  );

  const exigeCitaOrigen = Boolean(origenLocation?.exigeCita);
  const exigeCitaDestino = Boolean(
    destinoLocation?.exigeCita || descargueLocation?.exigeCita,
  );

  const initialValues = useMemo(() => {
    const formatDate = (dateStr?: string | Date | null) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60_000,
      );
      return localDate.toISOString().slice(0, 16);
    };

    if (!operationBase) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      return {
        scheduledAt: formatDate(tomorrow),
        programarDesvio: false,
        nuevoDestinoId: "",
        fechaCitaDesvio: "",
        shippingLineId: "",
        requiresInspection: false,
      };
    }

    return {
      type: operationBase.type,
      shippingLineId: operationBase.shippingLineId ?? "",
      requiresInspection: operationBase.requiresInspection ?? false,
      clientId: operationBase.client?.id || operationBase.clientId,
      isAnticipada: operationBase.isAnticipada,
      origenId: operationBase.origen?.id,
      descargueId: operationBase.descargue?.id || operationBase.cargue?.id,
      destinoId: operationBase.destino?.id,

      containerNumber: operationBase.containerNumber || "",
      containerType: operationBase.containerType || "DRY_40",
      peso: operationBase.peso || "",
      sealNumber: operationBase.sealNumber || "",
      pinRetiro: operationBase.pinRetiro || "",

      numeroPedido: operationBase.numeroPedido || "",
      documentoTransporte: operationBase.documentoTransporte || "",

      observaciones: operationBase.observaciones || "",
      fleteACobrarManual: operationBase.fleteACobrarManual ?? "",

      scheduledAt: formatDate(operationBase.scheduledAt),
      fechaCitaOrigen: formatDate(operationBase.fechaCitaOrigen),
      fechaCitaDestino: formatDate(operationBase.fechaCitaDestino),
      fechaRetiro: formatDate(operationBase.fechaRetiro),
      fechaLimiteDevolucion: formatDate(operationBase.fechaLimiteDevolucion),
      nuevoDestinoId: operationBase.nuevoDestinoId || "",
      fechaCitaDesvio: formatDate(operationBase.fechaCitaDesvio),
      programarDesvio: false,
    };
  }, [operationBase]);

  useEffect(() => {
    if (!clientId || !currentType) {
      resetQuote();
      return;
    }

    const commercialLocationId =
      isImport || isExport ? selectedDescargueId : destinoId;

    if (!commercialLocationId) {
      resetQuote();
      return;
    }

    getLiveQuote(clientId, currentType, isAnticipada, commercialLocationId);
  }, [
    clientId,
    currentType,
    isAnticipada,
    selectedDescargueId,
    destinoId,
    isImport,
    isExport,
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
    if (isImport)
      return locations
        .filter((loc) => loc.isPort)
        .map((l) => ({ value: l.id, label: l.name }));
    if (isExport || isRetiroVacio)
      return locations
        .filter((loc) => loc.isDepot)
        .map((l) => ({ value: l.id, label: l.name }));
    return locations.map((l) => ({ value: l.id, label: l.name }));
  }, [isExport, isImport, isRetiroVacio, locations]);

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
    if (isImport || isDevolucion)
      return locations
        .filter((loc) => loc.isDepot)
        .map((l) => ({ value: l.id, label: l.name }));
    if (isExport)
      return locations
        .filter((loc) => loc.isPort)
        .map((l) => ({ value: l.id, label: l.name }));

    if (isRetiroVacio) {
      let filteredLocations = locations.filter(
        (loc) => !loc.isPort && !loc.isDepot,
      );
      if (clientId) {
        filteredLocations = filteredLocations.filter((loc) =>
          loc.clients?.some((c) => c.clientId === clientId),
        );
      }
      return filteredLocations.map((l) => ({ value: l.id, label: l.name }));
    }

    return locations.map((l) => ({ value: l.id, label: l.name }));
  }, [isDevolucion, isExport, isImport, isRetiroVacio, locations, clientId]);

  const desvioDestinationOptions = useMemo(
    () =>
      locations
        .filter((location) => location.isPort || location.isDepot)
        .map((location) => ({ value: location.id, label: location.name })),
    [locations],
  );

  const categorizedFields = useMemo(() => {
    // Tab 1: General y Rutas
    const generalFields: FormField[] = [
      {
        name: "numeroPedido",
        label: "Número de Pedido / Booking (prioritario)",
        type: "text",
        placeholder: "Ingrese el número de pedido o booking",
        fullWidth: true,
      },
      {
        name: "type",
        label: "Tipo de Operación *",
        type: "select",
        options: typeOptions,
        disabled: isEdit,
      },
      {
        name: "clientId",
        label: "Cliente *",
        type: "select",
        options: clientOptions,
        disabled: isEdit,
      },
      ...(!isEdit
        ? [
            {
              name: "shippingLineId",
              label: "Línea naviera",
              type: "select" as const,
              options: (shippingLinesQuery.data ?? []).map((line) => ({
                value: line.id,
                label: `${line.name} · NIT ${line.nit}`,
              })),
            },
            {
              name: "requiresInspection",
              label: "La línea naviera exige inspección",
              type: "checkbox" as const,
            },
          ]
        : []),
      dateTimeField("scheduledAt", "Fecha y hora de operación *"),
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
          name: "origenId",
          label: isExport
            ? "Patio de Retiro (Vacío) *"
            : "Puerto de Retiro (Lleno) *",
          type: "select",
          options: origenOptions,
        },
        {
          name: "descargueId",
          label: isExport
            ? "Lugar de Cargue (Cliente) *"
            : "Lugar de Descargue (Cliente) *",
          type: "select",
          options: descargueOptions,
          disabled: !clientId,
        },
        {
          name: "destinoId",
          label: isExport
            ? "Puerto de Ingreso (Lleno) *"
            : "Patio de Devolución (Vacío) *",
          type: "select",
          options: destinoOptions,
        },
        dateTimeField(
          "fechaCitaOrigen",
          exigeCitaOrigen
            ? "Cita en Origen (Obligatoria) *"
            : "Cita en Origen (Opcional)",
        ),
        dateTimeField(
          "fechaCitaDestino",
          exigeCitaDestino
            ? "Cita en Destino (Obligatoria) *"
            : "Cita en Destino (Opcional)",
        ),
      );

      if (isExport)
        generalFields.push(dateTimeField("fechaRetiro", "Fecha de Retiro (Vacío)"));
      if (isImport)
        generalFields.push(
          dateTimeField("fechaLimiteDevolucion", "Fecha Límite Devolución"),
        );
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
          dateTimeField(
            "fechaCitaDesvio",
            "Fecha y hora de cita del desvío *",
          ),
        );
      }
    }

    // Tab 2: Carga y Tráfico
    const cargaFields: FormField[] = currentType
      ? [
          {
            name: "containerNumber",
            label: isExport || isImport ? "Número de Contenedor" : "Número de Contenedor (opcional)",
            type: "text",
            placeholder: "Ej: MSKU1234567",
          },
          {
            name: "containerType",
            label: isExport || isImport ? "Tipo Contenedor *" : "Tipo Contenedor (opcional)",
            type: "select",
            options: [
              { value: "DRY_20", label: "DRY 20" },
              { value: "DRY_40", label: "DRY 40" },
              { value: "HC_40", label: "High Cube 40" },
            ],
          },
          { name: "peso", label: "Peso (Kilos / Toneladas)", type: "number" },
          {
            name: "sealNumber",
            label: "Sello / Precinto",
            type: "text",
            placeholder: "Ej: 123456",
          },
          {
            name: "pinRetiro",
            label: "PIN de Retiro",
            type: "text",
            placeholder: "Opcional",
          },
          {
            name: "documentoTransporte",
            label: "Manifiesto / DO / BL",
            type: "text",
            placeholder: "Ej: BL-987654",
          },
        ]
      : [];

    // Tab 3: Liquidación
    const liquidacionFields: FormField[] = currentType
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
    exigeCitaOrigen,
    exigeCitaDestino,
    clientOptions,
    shippingLinesQuery.data,
    origenOptions,
    descargueOptions,
    destinoOptions,
    desvioDestinationOptions,
    isExport,
    isImport,
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
    if (name === "programarDesvio") setProgramarDesvio(Boolean(value));
    if (name === "descargueId") setSelectedDescargueId(Number(value) || null);
    if (name === "origenId") setOrigenId(Number(value) || null);
    if (name === "destinoId") setDestinoId(Number(value) || null);

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
    const localErrors: Record<string, string> = {};

    if (!formData.type && !isEdit) localErrors.type = "El tipo es obligatorio.";
    if (!formData.clientId && !isEdit)
      localErrors.clientId = "El cliente es obligatorio.";
    if (!formData.scheduledAt)
      localErrors.scheduledAt = "La fecha y hora son obligatorias.";
    if ((isExport || isImport) && !formData.containerType)
      localErrors.containerType = "El tipo de contenedor es obligatorio.";
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
      payload.shippingLineId = formData.shippingLineId
        ? Number(formData.shippingLineId)
        : null;
      payload.requiresInspection = Boolean(formData.requiresInspection);
      if (isImport && Boolean(formData.programarDesvio)) {
        payload.programarDesvio = true;
        payload.nuevoDestinoId = Number(formData.nuevoDestinoId);
        payload.fechaCitaDesvio = new Date(
          String(formData.fechaCitaDesvio),
        ).toISOString();
      }
    }

    if (formData.containerType)
      payload.containerType = String(formData.containerType);
    if (formData.scheduledAt)
      payload.scheduledAt = new Date(
        String(formData.scheduledAt),
      ).toISOString();
    if (formData.containerNumber)
      payload.containerNumber = String(formData.containerNumber).toUpperCase();

    if (formData.peso) payload.peso = Number(formData.peso);
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
    if (formData.fechaRetiro)
      payload.fechaRetiro = new Date(
        String(formData.fechaRetiro),
      ).toISOString();
    if (formData.fechaLimiteDevolucion)
      payload.fechaLimiteDevolucion = new Date(
        String(formData.fechaLimiteDevolucion),
      ).toISOString();
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

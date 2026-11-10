import { z } from "zod";

const operationTypes = [
  "IMPORTACION",
  "EXPORTACION",
  "RETIRO_VACIO",
  "DEVOLUCION_VACIO",
  "NACIONAL",
  "MOVIMIENTO_INTERNO",
] as const;

const containerTypes = [
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
] as const;

const optionalPositiveNumber = z.preprocess(
  (value) =>
    (typeof value === "string" && value.trim() === "") ||
    value === null ||
    value === undefined
      ? undefined
      : Number(value),
  z.number().positive("El valor debe ser mayor a 0").optional(),
);

const optionalPositiveInteger = z.preprocess(
  (value) =>
    (typeof value === "string" && value.trim() === "") ||
    value === null ||
    value === undefined
      ? undefined
      : Number(value),
  z.number().int().positive().optional(),
);

const optionalTrimmedString = z.string().trim().optional().or(z.literal(""));

const booleanValue = z.preprocess(
  (value) => (value === "true" ? true : value === "false" ? false : value),
  z.boolean().default(true),
);

const cargoFields = z.object({
  operationType: z.enum(operationTypes).optional(),
  isContainerized: booleanValue,
  routeScope: z.enum(["URBANO", "NACIONAL"]).nullable().optional(),
  clientId: optionalPositiveInteger,
  origenId: optionalPositiveInteger,
  originLocationId: optionalPositiveInteger,
  descargueId: optionalPositiveInteger,
  destinoId: optionalPositiveInteger,
  destinationLocationId: optionalPositiveInteger,
  numeroPedido: z.string().trim().optional(),
  containerNumber: z.string().trim().optional(),
  containerSize: z.string().optional(),
  shippingLineId: z.string().nullable().optional(),
  destinoCustomAddressEnabled: z.boolean().optional(),
  stops: z
    .array(
      z.object({
        clientId: optionalPositiveInteger,
        clientLocationId: optionalPositiveInteger,
        locationId: optionalPositiveInteger,
        isCustomAddress: z.preprocess(
          (value) =>
            value === "true" ? true : value === "false" ? false : value,
          z.boolean().default(false),
        ),
        address: optionalTrimmedString,
        contactName: optionalTrimmedString,
        contactPhone: optionalTrimmedString,
        observations: optionalTrimmedString,
        stopType: z.enum(["CARGUE", "DESCARGUE"]).optional(),
        stopOrder: z.number().int().nonnegative(),
      }),
    )
    .optional(),
  destinoCustomAddress: z.string().optional(),
  vehicleCapacityId: optionalPositiveInteger,
  cargoDescription: z.string().trim().optional(),
  weight: optionalPositiveNumber,
  dimensions: z.string().trim().optional(),
  packageType: z.string().trim().optional(),
  packageCount: optionalPositiveInteger,
  volumeM3: optionalPositiveNumber,
  programarDesvio: z.preprocess(
    (value) => (value === "true" ? true : value === "false" ? false : value),
    z.boolean().default(false),
  ),
  nuevoDestinoId: optionalPositiveInteger,
  fechaCitaDesvio: z.string().optional(),
  originIsPort: z.boolean().optional(),
  originIsDepot: z.boolean().optional(),
  originIsClientLocation: z.boolean().optional(),
  originIsOwnYard: z.boolean().optional(),
  clientStopIsClientLocation: z.boolean().optional(),
  destinationIsPort: z.boolean().optional(),
  destinationIsDepot: z.boolean().optional(),
  destinationIsClientLocation: z.boolean().optional(),
  newDestinationIsPortOrDepot: z.boolean().optional(),
});

const validateCargoFields = (
  data: z.infer<typeof cargoFields>,
  context: z.RefinementCtx,
) => {
  const isEmptyContainerOperation =
    data.operationType === "RETIRO_VACIO" ||
    data.operationType === "DEVOLUCION_VACIO";

  if (isEmptyContainerOperation && !data.isContainerized) {
    context.addIssue({
      code: "custom",
      path: ["isContainerized"],
      message: "El retiro y la devolución de vacío deben ser contenerizados.",
    });
  }

  const originId = data.origenId ?? data.originLocationId;
  const destinationId = data.destinoId ?? data.destinationLocationId;
  if (!originId && data.isContainerized) {
    context.addIssue({
      code: "custom",
      path: ["origenId"],
      message: "Seleccione el origen",
    });
  }
  if (!destinationId && data.isContainerized) {
    context.addIssue({
      code: "custom",
      path: ["destinoId"],
      message: "Seleccione el destino",
    });
  }
  if (originId && destinationId && originId === destinationId) {
    context.addIssue({
      code: "custom",
      path: ["destinoId"],
      message: "El origen y el destino deben ser diferentes",
    });
  }
  if (
    data.isContainerized &&
    (data.operationType === "IMPORTACION" ||
      data.operationType === "EXPORTACION") &&
    !data.descargueId
  ) {
    context.addIssue({
      code: "custom",
      path: ["descargueId"],
      message: "Seleccione la ubicación del cliente",
    });
  }
  if (data.isContainerized && data.operationType === "IMPORTACION") {
    if (data.originIsPort === false) {
      context.addIssue({
        code: "custom",
        path: ["origenId"],
        message: "La importación contenerizada debe iniciar en un puerto",
      });
    }
    if (data.clientStopIsClientLocation === false) {
      context.addIssue({
        code: "custom",
        path: ["descargueId"],
        message: "Seleccione una ubicación del cliente",
      });
    }
    if (data.destinationIsDepot === false) {
      context.addIssue({
        code: "custom",
        path: ["destinoId"],
        message: "La importación debe terminar en un patio",
      });
    }
  }
  if (data.isContainerized && data.operationType === "EXPORTACION") {
    if (data.originIsDepot === false) {
      context.addIssue({
        code: "custom",
        path: ["origenId"],
        message: "La exportación contenerizada debe iniciar en un patio",
      });
    }
    if (data.clientStopIsClientLocation === false) {
      context.addIssue({
        code: "custom",
        path: ["descargueId"],
        message: "Seleccione una ubicación del cliente",
      });
    }
    if (data.destinationIsPort === false) {
      context.addIssue({
        code: "custom",
        path: ["destinoId"],
        message: "La exportación debe terminar en un puerto",
      });
    }
  }
  if (data.isContainerized && data.operationType === "RETIRO_VACIO") {
    if (data.originIsDepot === false) {
      context.addIssue({
        code: "custom",
        path: ["origenId"],
        message: "El retiro de vacío debe iniciar en un patio",
      });
    }
    if (data.destinationIsClientLocation === false) {
      context.addIssue({
        code: "custom",
        path: ["destinoId"],
        message:
          "El retiro de vacío debe terminar en una ubicación del cliente",
      });
    }
  }
  if (data.isContainerized && data.operationType === "DEVOLUCION_VACIO") {
    if (
      data.originIsClientLocation === false &&
      data.originIsOwnYard === false
    ) {
      context.addIssue({
        code: "custom",
        path: ["origenId"],
        message: "El origen debe ser una bodega del cliente o patio propio",
      });
    }
    if (data.destinationIsDepot === false && data.destinationIsPort === false) {
      context.addIssue({
        code: "custom",
        path: ["destinoId"],
        message: "El destino debe ser un depósito de naviera o puerto",
      });
    }
  }
  if (
    data.isContainerized &&
    data.operationType === "IMPORTACION" &&
    data.programarDesvio &&
    !data.nuevoDestinoId
  ) {
    context.addIssue({
      code: "custom",
      path: ["nuevoDestinoId"],
      message: "Seleccione la ubicación del desvío",
    });
  }
  if (
    data.isContainerized &&
    data.operationType === "IMPORTACION" &&
    data.programarDesvio &&
    !data.fechaCitaDesvio
  ) {
    context.addIssue({
      code: "custom",
      path: ["fechaCitaDesvio"],
      message: "Indique la fecha y hora de la cita del desvío",
    });
  }
  if (
    data.isContainerized &&
    data.operationType === "IMPORTACION" &&
    data.programarDesvio &&
    data.newDestinationIsPortOrDepot === false
  ) {
    context.addIssue({
      code: "custom",
      path: ["nuevoDestinoId"],
      message: "El destino del desvío debe ser un puerto o patio",
    });
  }

  const isForeignTrade =
    data.operationType === "IMPORTACION" ||
    data.operationType === "EXPORTACION";
  if (!data.numeroPedido?.trim()) {
    context.addIssue({
      code: "custom",
      path: ["numeroPedido"],
      message: "El número de pedido/Booking es obligatorio",
    });
  }
  if (isForeignTrade) {
    if (!data.routeScope) {
      context.addIssue({
        code: "custom",
        path: ["routeScope"],
        message: "Seleccione el alcance de ruta",
      });
    }
  }

  if (data.isContainerized) {
    if (!data.containerNumber) {
      context.addIssue({
        code: "custom",
        path: ["containerNumber"],
        message: "El número de contenedor es obligatorio",
      });
    } else if (!/^[A-Z]{4}\d{7}$/.test(data.containerNumber.toUpperCase())) {
      context.addIssue({
        code: "custom",
        path: ["containerNumber"],
        message:
          "El contenedor debe tener 4 letras y 7 números (Ej: MSKU1234567)",
      });
    }

    if (!data.containerSize) {
      context.addIssue({
        code: "custom",
        path: ["containerSize"],
        message: "El tipo de contenedor es obligatorio",
      });
    } else if (!containerTypes.some((type) => type === data.containerSize)) {
      context.addIssue({
        code: "custom",
        path: ["containerSize"],
        message: "Seleccione un tipo de contenedor válido",
      });
    }

    return;
  }

  const stops = data.stops ?? [];
  const isNationalRoute =
    data.operationType === "NACIONAL" || data.routeScope === "NACIONAL";
  if (
    stops.length < 2 ||
    (isNationalRoute ? stops.length > 3 : stops.length !== 2)
  ) {
    context.addIssue({
      code: "custom",
      path: ["stops"],
      message: isNationalRoute
        ? "La carga suelta nacional permite un origen y hasta dos paradas de entrega"
        : "La carga suelta fuera del alcance nacional requiere exactamente dos paradas",
    });
  }
  if (
    isNationalRoute &&
    data.clientId &&
    stops.some((stop) => stop.clientId && stop.clientId !== data.clientId)
  ) {
    context.addIssue({
      code: "custom",
      path: ["stops"],
      message: "Todas las paradas deben pertenecer al cliente de la operación",
    });
  }
  const registeredLocationIds = stops
    .map((stop) => stop.locationId)
    .filter((locationId): locationId is number => Boolean(locationId));
  if (
    isNationalRoute &&
    new Set(registeredLocationIds).size !== registeredLocationIds.length
  ) {
    context.addIssue({
      code: "custom",
      path: ["stops"],
      message:
        "El origen y las paradas de entrega deben ser ubicaciones diferentes",
    });
  }
  stops.forEach((stop, index) => {
    if (!stop.clientId) {
      context.addIssue({
        code: "custom",
        path: ["stops", index, "clientId"],
        message: "Seleccione el cliente de esta parada",
      });
    }
    const requiresPort =
      (data.operationType === "IMPORTACION" && stop.stopOrder === 0) ||
      (data.operationType === "EXPORTACION" && stop.stopOrder > 0);
    if (stop.isCustomAddress && (requiresPort || stop.stopOrder !== 1)) {
      context.addIssue({
        code: "custom",
        path: ["stops", index, "isCustomAddress"],
        message:
          "Solo el destino puede usar una dirección personalizada y las paradas portuarias deben usar un puerto registrado",
      });
    } else if (
      stop.isCustomAddress &&
      (stop.locationId || stop.clientLocationId)
    ) {
      context.addIssue({
        code: "custom",
        path: ["stops", index, "clientLocationId"],
        message: "Quite la sede registrada para ingresar una dirección nueva",
      });
    } else if (stop.isCustomAddress && !stop.address?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["stops", index, "address"],
        message: "Debes ingresar la dirección manual",
      });
    } else if (
      !stop.isCustomAddress &&
      !(requiresPort
        ? stop.locationId
        : stop.clientLocationId || stop.locationId)
    ) {
      context.addIssue({
        code: "custom",
        path: ["stops", index, "clientLocationId"],
        message: requiresPort
          ? "Seleccione el puerto de esta parada"
          : "Seleccione una sede del cliente para esta parada",
      });
    }
  });
  if (!data.vehicleCapacityId) {
    context.addIssue({
      code: "custom",
      path: ["vehicleCapacityId"],
      message: "La capacidad del vehículo es obligatoria",
    });
  }
  if (!data.cargoDescription?.trim()) {
    context.addIssue({
      code: "custom",
      path: ["cargoDescription"],
      message: "La descripción de la carga es obligatoria",
    });
  }
  if (!data.weight) {
    context.addIssue({
      code: "custom",
      path: ["weight"],
      message: "El peso es obligatorio",
    });
  }
  if (!data.packageType?.trim()) {
    context.addIssue({
      code: "custom",
      path: ["packageType"],
      message: "El tipo de empaque es obligatorio",
    });
  }
  if (!data.packageCount) {
    context.addIssue({
      code: "custom",
      path: ["packageCount"],
      message: "El número de bultos o estibas es obligatorio",
    });
  }
  if (!data.volumeM3) {
    context.addIssue({
      code: "custom",
      path: ["volumeM3"],
      message: "El volumen es obligatorio",
    });
  }
};

const validateShippingLine = (
  data: z.infer<typeof cargoFields>,
  context: z.RefinementCtx,
) => {
  if (
    data.isContainerized &&
    (!data.shippingLineId || data.shippingLineId.trim() === "")
  ) {
    context.addIssue({
      code: "custom",
      message: "La línea naviera es requerida",
      path: ["shippingLineId"],
    });
  }
};

export const operationCargoSchema = cargoFields;

export const operationSchema = z
  .object({
    ...cargoFields.shape,
    operationType: z.enum(operationTypes),
    clientId: z.coerce.number().min(1, "El cliente es obligatorio"),
    originLocationId: optionalPositiveInteger,
    cargueId: optionalPositiveInteger,
    descargueId: optionalPositiveInteger,
    destinationLocationId: optionalPositiveInteger,
    scheduledAt: z.string().min(1, "La fecha y hora son obligatorias"),
    containerWeight: optionalPositiveNumber,
    fechaCitaOrigen: z.string().optional(),
    fechaCitaDestino: z.string().optional(),
    fechaRetiro: z.string().optional(),
    documentoTransporte: z.string().optional(),
    observaciones: z.string().optional(),
    isAnticipada: z.boolean().optional(),
    fleteACobrarManual: optionalPositiveNumber,
  })
  .superRefine(validateCargoFields)
  .superRefine(validateShippingLine);

export const createOperationSchema = operationSchema;
export type OperationSchemaInput = z.input<typeof operationSchema>;
export type OperationSchemaOutput = z.output<typeof operationSchema>;

export const assignOperationSchema = z.object({
  driverId: z.coerce.number().min(1, "El conductor es obligatorio"),
  vehicleId: z.coerce.number().min(1, "El vehículo es obligatorio"),
  fleteAPagarManual: z.coerce
    .number()
    .positive("El flete a pagar debe ser positivo")
    .optional(),
});

export type CreateOperationFormData = z.infer<typeof createOperationSchema>;
export type OperationCargoFormData = z.infer<typeof operationCargoSchema>;
export type AssignOperationFormData = z.infer<typeof assignOperationSchema>;

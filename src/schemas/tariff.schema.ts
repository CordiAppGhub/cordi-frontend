import { z } from "zod";

const operationTypes = [
  "IMPORTACION",
  "EXPORTACION",
  "RETIRO_VACIO",
  "DEVOLUCION_VACIO",
  "NACIONAL",
  "MOVIMIENTO_INTERNO",
] as const;

const requiredPositiveInteger = (message: string) =>
  z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? undefined
        : Number(value),
    z.number({ error: message }).int(message).positive(message),
  );

const booleanValue = z.preprocess(
  (value) =>
    value === "true" ? true : value === "false" ? false : value,
  z.boolean().default(true),
);

const positivePrice = z.preprocess(
  (value) => (value === "" ? undefined : Number(value)),
  z.number({ error: "Ingrese un precio válido" }).positive("Ingrese un precio válido"),
);

export const clientTariffSchema = z.object({
  clientId: requiredPositiveInteger("Seleccione el cliente"),
  operationType: z.enum(operationTypes),
  routeScope: z.enum(["URBANO", "NACIONAL"]),
  isContainerized: booleanValue,
  locationId: requiredPositiveInteger("Seleccione una ubicación del cliente"),
  price: positivePrice,
});

export type ClientTariffFormValues = z.infer<typeof clientTariffSchema>;

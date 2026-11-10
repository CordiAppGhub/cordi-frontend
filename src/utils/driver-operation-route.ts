import type { Operation } from "@/types/driver-portal.types";

function getLocationName(
  location: { name: string; address?: string | null } | null | undefined,
  fallback: string,
): string {
  return location?.name || fallback;
}

export function generateDriverOperationRoute(operation: Operation): string {
  const origin =
    operation.originLocation ||
    operation.origen ||
    (operation.origenName ? { name: operation.origenName } : null);
  const destination =
    operation.destinationLocation ||
    operation.destino ||
    (operation.destinoName ? { name: operation.destinoName } : null);
  const customerName =
    operation.customer?.name || operation.clientName || "Cliente";

  if (
    operation.isContainerized === false &&
    operation.stops?.length
  ) {
    return [...operation.stops]
      .sort((left, right) => left.stopOrder - right.stopOrder)
      .map((stop) =>
        stop.location?.name ||
        stop.address ||
        "Dirección pendiente",
      )
      .join(" ➡️ ");
  }

  if (operation.isContainerized === false) {
    return `${getLocationName(origin, "Origen")} ➡️ ${getLocationName(destination, "Destino")}`;
  }

  if (operation.containerStatus === "PENDIENTE_DEVOLUCION") {
    return `${getLocationName(destination, "Patio")} ➡️ ${
      operation.nuevoDestino?.name ||
      "Pendiente de confirmación del analista"
    }`;
  }

  if (operation.type === "RETIRO_VACIO") {
    return `${getLocationName(origin, "Patio")} ➡️ ${customerName}`;
  }

  return `${getLocationName(origin, "Origen")} ➡️ ${customerName} ➡️ ${getLocationName(destination, "Patio")}`;
}

import type { Operation } from '@/types/operation-types';

const getStopName = (
  stop: NonNullable<Operation['stops']>[number] | undefined,
) => stop?.location?.name || stop?.clientLocation?.name || stop?.address || null;

export function getOperationRouteNames(operation: Operation | null | undefined) {
  const stops = [...(operation?.stops ?? [])].sort(
    (left, right) => left.stopOrder - right.stopOrder,
  );
  const originStop =
    stops.find((stop) => stop.stopType === 'CARGUE') ?? stops[0];
  const destinationStop =
    [...stops].reverse().find((stop) => stop.stopType === 'DESCARGUE') ??
    stops.at(-1);

  return {
    originName:
      operation?.origen?.name ||
      operation?.cargue?.name ||
      getStopName(originStop) ||
      'Origen sin definir',
    destinationName:
      operation?.destino?.name ||
      operation?.nuevoDestino?.name ||
      operation?.descargue?.name ||
      getStopName(destinationStop) ||
      'Destino sin definir',
  };
}

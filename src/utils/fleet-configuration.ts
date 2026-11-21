import type { VehicleType } from '@/types/vehicles';

type FleetTypologyCode =
  | 'C2'
  | 'C3'
  | '2S1'
  | '2S2'
  | '2S3'
  | '3S1'
  | '3S2'
  | '3S3';

interface FleetUnitTrailer {
  plate?: string | null;
  axles: number | null;
  trailerType?: string | null;
  capacity?: number | null;
  maxPayloadKg?: number | null;
}

export interface FleetUnitVehicle {
  type: VehicleType;
  axles: number | null;
  cargoCapacity?: number | null;
  maxPayloadKg?: number | null;
  currentTrailer?: FleetUnitTrailer | null;
}

export interface FleetUnitConfiguration {
  typologyCode: FleetTypologyCode | null;
  typologyLabel: string;
  isRigid: boolean;
  hasTrailer: boolean;
  tractorAxles: number;
  trailerAxles: number | null;
  totalAxles: number;
  baseTractorPayloadKg: number;
  trailerPayloadKg: number | null;
  effectivePayloadKg: number;
  maxLegalPbvKg: number | null;
  limitingFactorLabel: string;
}

const VEHICLE_REFERENCE_PAYLOAD_KG: Record<VehicleType, number> = {
  PATINETA: 26500,
  MULA: 35500,
  C2: 9500,
  C3: 16500,
};

const TYPOLOGY_DETAILS: Record<
  FleetTypologyCode,
  { label: string; maxPayloadKg: number; maxLegalPbvKg: number }
> = {
  C2: {
    label: 'C2 · Camión rígido 2 ejes',
    maxPayloadKg: 9500,
    maxLegalPbvKg: 17000,
  },
  C3: {
    label: 'C3 · Camión rígido 3 ejes',
    maxPayloadKg: 16500,
    maxLegalPbvKg: 28000,
  },
  '2S1': {
    label: '2S1 · Patineta + Tráiler 1 eje',
    maxPayloadKg: 16000,
    maxLegalPbvKg: 27000,
  },
  '2S2': {
    label: '2S2 · Patineta + Tráiler 2 ejes',
    maxPayloadKg: 19500,
    maxLegalPbvKg: 32000,
  },
  '2S3': {
    label: '2S3 · Patineta + Tráiler 3 ejes',
    maxPayloadKg: 26500,
    maxLegalPbvKg: 40500,
  },
  '3S1': {
    label: '3S1 · Mula + Tráiler 1 eje',
    maxPayloadKg: 16500,
    maxLegalPbvKg: 29000,
  },
  '3S2': {
    label: '3S2 · Mula + Tráiler 2 ejes',
    maxPayloadKg: 33000,
    maxLegalPbvKg: 48000,
  },
  '3S3': {
    label: '3S3 · Mula + Tráiler 3 ejes',
    maxPayloadKg: 35500,
    maxLegalPbvKg: 52000,
  },
};

const isValidTractorAxles = (axles: number | null): axles is 2 | 3 =>
  axles === 2 || axles === 3;

const isValidTrailerAxles = (axles: number | null): axles is 1 | 2 | 3 =>
  axles === 1 || axles === 2 || axles === 3;

const isFleetTypologyCode = (code: string): code is FleetTypologyCode =>
  Object.prototype.hasOwnProperty.call(TYPOLOGY_DETAILS, code);

const getPositiveCapacity = (value: number | null | undefined): number | null =>
  value != null && Number.isFinite(value) && value > 0 ? value : null;

function getLimitingFactor(
  candidates: Array<{ value: number; label: string }>,
): { value: number; label: string } {
  return candidates.reduce((limiting, candidate) =>
    candidate.value < limiting.value ? candidate : limiting,
  );
}

export function resolveFleetUnitConfiguration(
  vehicle: FleetUnitVehicle,
): FleetUnitConfiguration {
  const isRigid = vehicle.type === 'C2' || vehicle.type === 'C3';
  const expectedTractorAxles = vehicle.type === 'MULA' || vehicle.type === 'C3' ? 3 : 2;
  const tractorAxles = isValidTractorAxles(vehicle.axles)
    ? vehicle.axles
    : expectedTractorAxles;
  const trailer = vehicle.currentTrailer ?? null;
  const hasTrailer = trailer !== null;
  const trailerAxles =
    trailer && isValidTrailerAxles(trailer.axles) ? trailer.axles : null;
  const baseTractorPayloadKg =
    getPositiveCapacity(vehicle.maxPayloadKg ?? vehicle.cargoCapacity) ??
    VEHICLE_REFERENCE_PAYLOAD_KG[vehicle.type];
  const trailerPayloadKg = trailer
    ? getPositiveCapacity(trailer.maxPayloadKg ?? trailer.capacity)
    : null;
  const candidateCode =
    isRigid && tractorAxles === expectedTractorAxles
      ? vehicle.type
      : !isRigid &&
          hasTrailer &&
          trailerAxles !== null &&
          tractorAxles === expectedTractorAxles
        ? `${tractorAxles}S${trailerAxles}`
        : null;
  const typologyCode =
    candidateCode && isFleetTypologyCode(candidateCode) ? candidateCode : null;
  const typology = typologyCode ? TYPOLOGY_DETAILS[typologyCode] : null;

  if (!typology) {
    const effectivePayloadKg =
      trailerPayloadKg === null
        ? baseTractorPayloadKg
        : Math.min(baseTractorPayloadKg, trailerPayloadKg);
    const limitingFactorLabel = hasTrailer
      ? trailerPayloadKg !== null &&
        trailerPayloadKg < baseTractorPayloadKg
        ? 'Capacidad del chasis'
        : 'Capacidad del cabezote'
      : 'Pendiente de acoplar chasis';

    return {
      typologyCode: null,
        typologyLabel: hasTrailer || isRigid
        ? 'Configuración de ejes no válida'
        : 'Sin chasis acoplado',
      isRigid,
      hasTrailer,
      tractorAxles,
      trailerAxles,
      totalAxles: tractorAxles + (trailerAxles ?? 0),
      baseTractorPayloadKg,
      trailerPayloadKg,
      effectivePayloadKg,
      maxLegalPbvKg: null,
      limitingFactorLabel,
    };
  }

  const limitingFactor = getLimitingFactor([
    {
      value: typology.maxPayloadKg,
      label: `Tope legal báscula ${typologyCode}`,
    },
    { value: baseTractorPayloadKg, label: 'Capacidad del cabezote' },
    ...(isRigid || trailerPayloadKg === null
      ? []
      : [{ value: trailerPayloadKg, label: 'Capacidad del chasis' }]),
  ]);

  return {
    typologyCode,
    typologyLabel: typology.label,
    isRigid,
    hasTrailer,
    tractorAxles,
    trailerAxles,
    totalAxles: tractorAxles + (trailerAxles ?? 0),
    baseTractorPayloadKg,
    trailerPayloadKg,
    effectivePayloadKg: limitingFactor.value,
    maxLegalPbvKg: typology.maxLegalPbvKg,
    limitingFactorLabel: limitingFactor.label,
  };
}

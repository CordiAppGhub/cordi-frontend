const evidenceTypeLabels: Record<string, string> = {
  INGRESO_PUERTO: 'ARIN de ingreso a puerto',
  ARIN_INGRESO: 'ARIN de ingreso a puerto',
  SALIDA_PUERTO: 'ARIN de salida del puerto',
  ARIN_SALIDA: 'ARIN de salida del puerto',
  SELLOS_CONTENEDOR: 'Fotos de los sellos',
  TIRILLA_EIR: 'Tirilla de devolución (EIR)',
  COMODATO: 'Documento de comodato',
  FOTO_CARGUE: 'Foto del cargue del contenedor',
  EVIDENCIA_CARGA_SUELTA: 'Fotos de la carga: frente, atrás y laterales',
  FOTOS_LLEGADA_CARGA_SUELTA: 'Fotos de la carga al llegar al cliente',
  FOTOS_DESCARGUE_CARGA_SUELTA: 'Fotos del descargue de la carga',
  DELIVERY_DOC: 'Soporte de entrega / descargue',
  VERIFICACION_PLACA_CABEZOTE: 'Verificación de placa del cabezote',
  VERIFICACION_PLACA_TRAILER: 'Verificación de placa del tráiler',
  ANOMALY_PHOTO: 'Fotos de anomalías en la mercancía',
  'NÚMERO DE CONTENEDOR': 'Número de contenedor',
  'SOPORTE DE CIERRE': 'Soporte de cierre',
};

const operationStateLabels: Record<string, string> = {
  EN_PISO: 'Bajado a piso',
  PENDIENTE: 'Pendiente',
  PENDIENTE_CARGUE: 'Pendiente de cargue',
  EN_CARGUE: 'En cargue',
  CARGADO: 'Cargado',
  EN_DESCARGUE: 'En descargue',
  DESCARGADO: 'Descargado',
  EN_PUERTO: 'En puerto',
  LLEGADA_ORIGEN: 'Llegada al origen',
  LLEGADA_DESTINO: 'Llegada al destino',
  EN_RUTA_ORIGEN: 'En ruta al origen',
  EN_RUTA_DESTINO: 'En ruta al destino',
  RUMBO_AL_CLIENTE: 'En ruta al cliente',
  RUMBO_AL_PUERTO: 'En ruta al puerto',
  DESENGANCHADO: 'Tráiler desenganchado',
  DESVIO_PATIO_PENDIENTE: 'Desvío de patio pendiente',
  PENDIENTE_LLENO: 'Pendiente de llenado en cliente',
};

const extraChargeTypeLabels: Record<string, string> = {
  EN_PISO: 'Contenedor bajado a piso',
  STAND_BY: 'Tiempo de espera',
  STAND_BY_CARGUE: 'Tiempo de espera durante el cargue',
  STAND_BY_DESCARGUE: 'Tiempo de espera durante el descargue',
  DESVIO: 'Desvío operativo',
  MANIOBRA_EXTRA: 'Maniobra extra',
  DEMORA_PUERTO: 'Demora en puerto',
  DEMORA_PORTUARIA: 'Demora en puerto',
  SOBREPESO: 'Sobrepeso',
  PATIO: 'Cargo de patio',
  CARGUE: 'Cargue',
  DESCARGUE: 'Descargue',
  CONTENEDOR_EN_PISO: 'Contenedor bajado a piso',
  STAND_BY_ESPERA: 'Tiempo de espera',
  STAND_BY_CARGUE_DESCARGUE: 'Tiempo de espera durante cargue o descargue',
};

const evidenceStageLabels: Record<string, string> = {
  EN_PUERTO: 'En puerto',
  EN_PUERTO_CARGADO: 'Fuera de puerto (cargado)',
  PRE_INGRESO_PUERTO: 'Previo ingreso a puerto',
  RUMBO_AL_PUERTO: 'Rumbo al puerto',
  RUMBO_AL_CLIENTE: 'Rumbo al cliente',
  EN_CLIENTE: 'En cliente',
  LLEGADA_ORIGEN: 'Llegada al origen',
  LLEGADA_DESTINO: 'Llegada al destino',
  CIERRE_FISICO: 'Cierre físico',
  CIERRE_DOCUMENTAL: 'Cierre documental',
  DESVIO: 'Desvío',
};

function formatFallback(value: string): string {
  const words = value
    .trim()
    .replace(/[_-]+/g, ' ')
    .toLocaleLowerCase('es-CO');
  return words ? words.charAt(0).toLocaleUpperCase('es-CO') + words.slice(1) : '';
}

function lookupLabel(value: string, labels: Record<string, string>): string {
  const trimmed = value.trim();
  return labels[trimmed.toLocaleUpperCase('es-CO')] ?? formatFallback(trimmed);
}

export function formatEvidenceTypeLabel(type: string): string {
  return lookupLabel(type, evidenceTypeLabels);
}

export function formatOperationStateLabel(state?: string | null): string {
  return state ? lookupLabel(state, operationStateLabels) : '';
}

export function formatExtraChargeTypeLabel(type: string): string {
  return lookupLabel(type, extraChargeTypeLabels);
}

export function formatEvidenceStageLabel(stage?: string | null): string {
  return stage ? lookupLabel(stage, evidenceStageLabels) : '';
}

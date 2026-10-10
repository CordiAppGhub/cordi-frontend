import axios from 'axios';

interface ApiErrorResponse {
  message?: string | string[];
}

const DEFAULT_ERROR = 'No pudimos completar la solicitud. Inténtalo de nuevo.';

function readableMessage(message: unknown): string | null {
  if (Array.isArray(message)) {
    const readableItems = message
      .map((item) => readableMessage(item))
      .filter((item): item is string => Boolean(item));
    return readableItems.length ? readableItems.join(' ') : null;
  }

  if (typeof message !== 'string') return null;

  const normalized = message.trim();
  if (
    !normalized ||
    /^(internal server error|bad request|forbidden resource|not found|unauthorized|conflict|unprocessable entity|request timeout|payload too large|too many requests)$/i.test(normalized) ||
    /^cannot (get|post|put|patch|delete)\s/i.test(normalized) ||
    /^(unexpected token|syntaxerror:|network error|request failed with status code|econn(?:refused|reset|aborted))/i.test(
      normalized,
    )
  ) {
    return null;
  }

  return normalized;
}

export function getUserFriendlyErrorMessage(
  error: unknown,
  fallback = DEFAULT_ERROR,
): string {
  if (typeof error === 'string') {
    return readableMessage(error) ?? fallback;
  }

  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallback;
  }

  const status = error.response?.status;
  if (status && status >= 500) {
    return 'El servicio no está disponible en este momento. Inténtalo más tarde.';
  }

  if (status === 403) {
    return 'No tienes permiso para realizar esta acción.';
  }

  if (status === 404) {
    return readableMessage(error.response?.data?.message) ?? 'No encontramos la información solicitada.';
  }

  if (status === 401) {
    return readableMessage(error.response?.data?.message) ?? 'Tu sesión venció. Inicia sesión nuevamente.';
  }

  const serverMessage = readableMessage(error.response?.data?.message);
  if (serverMessage) return serverMessage;

  if (
    status === 408 ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT'
  ) {
    return 'La solicitud tardó demasiado. Revisa tu conexión e inténtalo de nuevo.';
  }

  if (!error.response) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
  }

  if (status === 400 || status === 422) {
    return 'Revisa la información ingresada e inténtalo de nuevo.';
  }

  if (status === 409) {
    return 'No se pudo guardar porque el registro ya existe o cambió. Actualiza la página e inténtalo de nuevo.';
  }

  if (status === 413) {
    return 'El archivo es demasiado grande. Selecciona uno más pequeño e inténtalo de nuevo.';
  }

  if (status === 429) {
    return 'Hay muchas solicitudes en curso. Espera un momento e inténtalo de nuevo.';
  }

  return fallback;
}

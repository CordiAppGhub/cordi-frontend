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
    /^revisa la información ingresada e inténtalo de nuevo\.?$/i.test(normalized) ||
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

  if (
    status === 408 ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT'
  ) {
    return 'La solicitud tardó demasiado. Comprueba tu conexión y vuelve a intentarlo. Si estabas guardando cambios, verifica primero si se registraron.';
  }

  if (status && status >= 500) {
    return 'Tuvimos un problema en el servidor y no pudimos completar la solicitud. Inténtalo de nuevo en unos minutos; si el problema continúa, contacta a soporte.';
  }

  if (status === 403) {
    return 'Tu cuenta no tiene permisos para realizar esta acción. Si necesitas acceso, contacta a un administrador.';
  }

  if (status === 404) {
    return readableMessage(error.response?.data?.message) ?? 'No encontramos el registro solicitado. Puede que haya sido eliminado o que la dirección ya no sea válida.';
  }

  if (status === 401) {
    return readableMessage(error.response?.data?.message) ?? 'Tu sesión venció. Inicia sesión nuevamente.';
  }

  const serverMessage = readableMessage(error.response?.data?.message);

  if (!error.response) {
    return 'No pudimos conectar con el servidor. Comprueba tu conexión a internet y vuelve a intentarlo.';
  }

  if (status === 400 || status === 422) {
    return serverMessage ?? 'Revisa los campos del formulario y corrige la información marcada antes de volver a intentarlo.';
  }

  if (status === 409) {
    return serverMessage ?? 'El registro ya existe o fue modificado por otra persona. Actualiza la información y vuelve a intentarlo.';
  }

  if (status === 413) {
    return 'El archivo es demasiado grande. Selecciona uno más pequeño e inténtalo de nuevo.';
  }

  if (status === 429) {
    return 'Recibimos demasiadas solicitudes seguidas. Espera un momento y vuelve a intentarlo.';
  }

  return serverMessage ?? fallback;
}

export function shouldRetryApiRequest(error: unknown): boolean {
  if (
    !axios.isAxiosError(error) ||
    axios.isCancel(error) ||
    error.code === 'ERR_CANCELED'
  ) {
    return false;
  }

  const status = error.response?.status;
  return status === undefined || status === 408 || status >= 500;
}

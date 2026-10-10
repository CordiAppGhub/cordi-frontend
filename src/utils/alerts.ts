import Swal from 'sweetalert2';
import { getUserFriendlyErrorMessage } from './api-error';

let lastErrorNotification: { message: string; time: number } | null = null;

export const showToast = {
  success: (message: string) => {
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: message,
      timer: 2000,
      showConfirmButton: false,
    });
  },

  error: (error: unknown, fallback?: string) => {
    const message = getUserFriendlyErrorMessage(error, fallback);
    const now = Date.now();
    if (
      lastErrorNotification?.message === message &&
      now - lastErrorNotification.time < 1500
    ) {
      return;
    }

    lastErrorNotification = { message, time: now };
    Swal.fire({
      icon: 'error',
      title: 'No pudimos completar la acción',
      text: message,
      confirmButtonColor: '#dc2626',
    });
  },
};
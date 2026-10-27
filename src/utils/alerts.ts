import axios from 'axios';
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
    if (
      axios.isCancel(error) ||
      (axios.isAxiosError(error) && error.code === 'ERR_CANCELED')
    ) {
      return;
    }

    const message = getUserFriendlyErrorMessage(error, fallback);
    const now = Date.now();
    if (
      lastErrorNotification?.message === message &&
      now - lastErrorNotification.time < 2500
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

  warning: (message: string) => {
    Swal.fire({
      icon: 'warning',
      title: 'Revisa la información',
      text: message,
      timer: 3000,
      showConfirmButton: false,
    });
  },
};

interface ConfirmOptions {
  title: string;
  text: string;
  confirmButtonText: string;
  cancelButtonText?: string;
  destructive?: boolean;
}

export async function showConfirm({
  title,
  text,
  confirmButtonText,
  cancelButtonText = 'Cancelar',
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: destructive ? '#dc2626' : '#1d4ed8',
    cancelButtonColor: '#64748b',
    confirmButtonText,
    cancelButtonText,
  });

  return result.isConfirmed;
}
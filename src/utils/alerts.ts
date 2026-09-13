import Swal from 'sweetalert2';

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

  error: (errorMessage: string) => {
    Swal.fire({
      icon: 'error',
      title: 'Acción rechazada',
      text: errorMessage,
      confirmButtonColor: '#dc2626',
    });
  },
};
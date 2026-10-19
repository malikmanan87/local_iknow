/**
 * SweetAlert2 helper for iKNOW React frontend components
 */

const getSwal = () => {
  if (typeof window !== 'undefined') {
    const s = window.Swal || window.Sweetalert2 || window.SweetAlert || window.swal ||
              (typeof globalThis !== 'undefined' ? (globalThis.Swal || globalThis.Sweetalert2) : null);
    if (s) {
      window.Swal = s;
      window.Sweetalert2 = s;
      return s;
    }
  }
  return null;
};

export const showAlert = (message, title = 'Makluman', icon = 'info') => {
  const swal = getSwal();
  if (!swal) {
    window.alert(message);
    return Promise.resolve();
  }
  return swal.fire({
    title,
    html: typeof message === 'string' ? message.replace(/\n/g, '<br>') : message,
    icon,
    confirmButtonText: 'Tutup',
    confirmButtonColor: '#6366f1',
    customClass: { popup: 'iknow-swal-popup' }
  });
};

export const showError = (message, title = 'Ralat') => {
  const swal = getSwal();
  if (!swal) {
    window.alert(message);
    return Promise.resolve();
  }
  return swal.fire({
    title,
    html: typeof message === 'string' ? message.replace(/\n/g, '<br>') : message,
    icon: 'error',
    confirmButtonText: 'Tutup',
    confirmButtonColor: '#f43f5e',
    customClass: { popup: 'iknow-swal-popup', confirmButton: 'btn-danger-confirm' }
  });
};

export const showSuccess = (message, title = 'Berjaya', timer = 2000) => {
  const swal = getSwal();
  if (!swal) {
    window.alert(message);
    return Promise.resolve();
  }
  return swal.fire({
    title,
    html: typeof message === 'string' ? message.replace(/\n/g, '<br>') : message,
    icon: 'success',
    timer,
    showConfirmButton: false,
    customClass: { popup: 'iknow-swal-popup' }
  });
};

export const showConfirm = async (message, title = 'Pengesahan', confirmText = 'Ya, Teruskan', isDanger = true) => {
  const swal = getSwal();
  if (!swal) {
    return window.confirm(message);
  }
  const res = await swal.fire({
    title,
    html: typeof message === 'string' ? message.replace(/\n/g, '<br>') : message,
    icon: isDanger ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Batal',
    customClass: {
      popup: 'iknow-swal-popup',
      confirmButton: isDanger ? 'btn-danger-confirm' : ''
    },
    reverseButtons: true,
    focusCancel: true
  });
  return res.isConfirmed;
};

export default {
  showAlert,
  showError,
  showSuccess,
  showConfirm,
  getSwal
};

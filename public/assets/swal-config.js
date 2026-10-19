/**
 * iKNOW SweetAlert2 Global Configuration & Native Dialog Replacement
 * Replaces all native alert() and provides elegant dark-themed glassmorphism modals.
 */
(function() {
  'use strict';

  const originalAlert = typeof window !== 'undefined' ? window.alert.bind(window) : function(){};

  // Helper to resolve Swal from various global attachments
  function getGlobalSwal() {
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
  }

  // Inject Custom CSS for SweetAlert2 Dark Glassmorphism Theme
  function injectSwalStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('iknow-swal-custom-css')) return;
    const style = document.createElement('style');
    style.id = 'iknow-swal-custom-css';
    style.innerHTML = `
      .swal2-container {
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
        background: rgba(4, 7, 15, 0.75) !important;
        z-index: 999999 !important;
      }
      .swal2-popup.iknow-swal-popup {
        background: rgba(15, 23, 42, 0.95) !important;
        background-image: radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 60%),
                          radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.1) 0px, transparent 60%) !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.15) !important;
        border-radius: 18px !important;
        padding: 1.75rem 1.5rem !important;
        color: #f8fafc !important;
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
      }
      .swal2-title {
        color: #ffffff !important;
        font-size: 1.25rem !important;
        font-weight: 800 !important;
        letter-spacing: -0.3px !important;
        margin-bottom: 0.5rem !important;
      }
      .swal2-html-container {
        color: #94a3b8 !important;
        font-size: 0.9rem !important;
        line-height: 1.55 !important;
        margin: 0.5rem 0 1rem 0 !important;
      }
      .swal2-icon {
        transform: scale(0.85) !important;
        margin: 0.75rem auto 0.75rem auto !important;
        border-width: 3px !important;
      }
      .swal2-actions {
        gap: 0.65rem !important;
        margin-top: 1.25rem !important;
        width: 100% !important;
        justify-content: center !important;
      }
      .swal2-styled.swal2-confirm {
        background: linear-gradient(135deg, #6366f1, #4f46e5) !important;
        color: #ffffff !important;
        font-weight: 700 !important;
        font-size: 0.85rem !important;
        padding: 0.6rem 1.4rem !important;
        border-radius: 10px !important;
        border: none !important;
        box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4) !important;
        transition: all 0.2s ease !important;
      }
      .swal2-styled.swal2-confirm:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 6px 18px rgba(99, 102, 241, 0.55) !important;
      }
      .swal2-styled.swal2-confirm.btn-danger-confirm {
        background: linear-gradient(135deg, #f43f5e, #e11d48) !important;
        box-shadow: 0 4px 14px rgba(244, 63, 94, 0.4) !important;
      }
      .swal2-styled.swal2-cancel {
        background: rgba(255, 255, 255, 0.08) !important;
        color: #cbd5e1 !important;
        font-weight: 600 !important;
        font-size: 0.85rem !important;
        padding: 0.6rem 1.25rem !important;
        border-radius: 10px !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        transition: all 0.2s ease !important;
      }
      .swal2-styled.swal2-cancel:hover {
        background: rgba(255, 255, 255, 0.15) !important;
        color: #ffffff !important;
      }
      .swal2-close {
        color: #94a3b8 !important;
        transition: all 0.2s ease !important;
      }
      .swal2-close:hover {
        color: #ffffff !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    } else {
      document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
    }
  }

  // Helper function to detect alert type
  function detectAlertType(msg) {
    const text = typeof msg === 'string' ? msg : JSON.stringify(msg);
    if (/gagal|ralat|error|failed|tidak berjaya|tidak ditemui/i.test(text)) {
      return { icon: 'error', title: 'Ralat Sistem', confirmColor: '#f43f5e', btnClass: 'btn-danger-confirm' };
    }
    if (/amaran|warning|kunci|lock|pasti|perhatian/i.test(text)) {
      return { icon: 'warning', title: 'Peringatan', confirmColor: '#f59e0b', btnClass: '' };
    }
    if (/berjaya|success|selesai|tersimpan/i.test(text)) {
      return { icon: 'success', title: 'Berjaya', confirmColor: '#10b981', btnClass: '' };
    }
    return { icon: 'info', title: 'Makluman', confirmColor: '#6366f1', btnClass: '' };
  }

  // Global override for window.alert and custom confirmation dialog
  function installAlertInterceptor() {
    // Reusable custom confirm dialog for SweetAlert2
    window.iknowConfirm = async function(title, text, confirmBtnText = 'Ya, Teruskan', isDanger = true) {
      const activeSwal = getGlobalSwal();
      if (!activeSwal) {
        console.warn('SweetAlert2 not ready, falling back to window.confirm');
        return window.confirm((title ? title + '\n\n' : '') + (text || ''));
      }
      const res = await activeSwal.fire({
        title: title || 'Pengesahan',
        html: typeof text === 'string' ? text.replace(/\n/g, '<br>') : text,
        icon: isDanger ? 'warning' : 'question',
        showCancelButton: true,
        confirmButtonText: confirmBtnText || 'Ya, Teruskan',
        cancelButtonText: 'Batal',
        confirmButtonColor: isDanger ? '#f43f5e' : '#6366f1',
        cancelButtonColor: 'rgba(255, 255, 255, 0.15)',
        customClass: {
          popup: 'iknow-swal-popup',
          confirmButton: isDanger ? 'btn-danger-confirm' : ''
        },
        buttonsStyling: true,
        reverseButtons: true,
        focusCancel: true
      });
      return res.isConfirmed;
    };

    // Global override for window.alert
    window.alert = function(message) {
      const activeSwal = getGlobalSwal();
      if (!activeSwal) {
        console.warn('SweetAlert2 not ready, falling back to native alert:', message);
        return originalAlert(message);
      }
      const typeInfo = detectAlertType(message);
      const htmlContent = typeof message === 'string' 
        ? message.replace(/\n/g, '<br>') 
        : (message ? String(message) : '');

      return activeSwal.fire({
        title: typeInfo.title,
        html: htmlContent,
        icon: typeInfo.icon,
        confirmButtonText: 'Tutup',
        confirmButtonColor: typeInfo.confirmColor,
        customClass: {
          popup: 'iknow-swal-popup',
          confirmButton: typeInfo.btnClass
        },
        buttonsStyling: true,
        backdrop: true,
        showClass: {
          popup: 'swal2-show swal2-animate-show'
        }
      });
    };

    // Quick Toast notification
    window.iknowToast = function(title, icon = 'success', timer = 2500) {
      const activeSwal = getGlobalSwal();
      if (!activeSwal) return;
      return activeSwal.fire({
        toast: true,
        position: 'top-end',
        icon: icon,
        title: title,
        showConfirmButton: false,
        timer: timer,
        timerProgressBar: true,
        customClass: {
          popup: 'iknow-swal-popup'
        }
      });
    };
  }

  // Initialize immediately AND on DOMContentLoaded
  injectSwalStyles();
  installAlertInterceptor();

  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectSwalStyles();
      installAlertInterceptor();
    });
  }
})();

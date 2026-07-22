/* ============================================
   CI4 STARTER TEMPLATE — app.js
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

    // ---- Sidebar Toggle (Desktop collapse) ----
    const body = document.body;
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const topbarToggle     = document.getElementById('topbarToggle');
    const sidebar          = document.getElementById('sidebar');
    const sidebarOverlay   = document.getElementById('sidebarOverlay');
    const mainWrapper      = document.getElementById('mainWrapper');

    const COLLAPSED_KEY = 'sidebar_collapsed';

    // Restore state
    if (localStorage.getItem(COLLAPSED_KEY) === '1') {
        body.classList.add('sidebar-collapsed');
    }

    // Desktop toggle (collapse)
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', function () {
            if (window.innerWidth >= 992) {
                body.classList.toggle('sidebar-collapsed');
                localStorage.setItem(COLLAPSED_KEY, body.classList.contains('sidebar-collapsed') ? '1' : '0');
            }
        });
    }

    // Mobile toggle (slide in/out)
    if (topbarToggle) {
        topbarToggle.addEventListener('click', function () {
            if (window.innerWidth < 992) {
                sidebar.classList.toggle('mobile-open');
                sidebarOverlay.classList.toggle('show');
            } else {
                body.classList.toggle('sidebar-collapsed');
                localStorage.setItem(COLLAPSED_KEY, body.classList.contains('sidebar-collapsed') ? '1' : '0');
            }
        });
    }

    // Close on overlay click
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function () {
            sidebar.classList.remove('mobile-open');
            sidebarOverlay.classList.remove('show');
        });
    }

    // Auto-dismiss alerts
    setTimeout(function () {
        document.querySelectorAll('.alert.alert-dismissible').forEach(function (el) {
            const bsAlert = bootstrap.Alert.getOrCreateInstance(el);
            bsAlert.close();
        });
    }, 5000);

});

/* ============================================
   SWEETALERT2 HELPERS
   ============================================ */

/**
 * Confirm delete with SweetAlert2
 * @param {string} url  - delete action URL
 * @param {string} name - record name to display
 */
function confirmDelete(url, name) {
    Swal.fire({
        title: 'Padam Rekod?',
        html: `Anda pasti ingin memadam <strong>${name}</strong>?<br>
               <small class="text-muted">Tindakan ini tidak boleh dibatalkan.</small>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-trash me-1"></i> Ya, Padam',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        reverseButtons: true,
        focusCancel: true,
    }).then(function (result) {
        if (result.isConfirmed) {
            // Show loading
            Swal.fire({
                title: 'Memproses...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });
            window.location.href = url;
        }
    });
}

/**
 * Confirm logout
 * @param {Event}       e   - click event
 * @param {HTMLElement} el  - anchor element
 */
function confirmLogout(e, el) {
    e.preventDefault();
    Swal.fire({
        title: 'Log Keluar?',
        text: 'Anda pasti ingin log keluar daripada sistem?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-box-arrow-left me-1"></i> Ya, Log Keluar',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        reverseButtons: true,
    }).then(function (result) {
        if (result.isConfirmed) {
            window.location.href = el.getAttribute('href');
        }
    });
}

/**
 * Show SweetAlert toast (top-right)
 * @param {string} icon    - success | error | warning | info
 * @param {string} message - message text
 */
function showToast(icon, message) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true,
        didOpen: function (toast) {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
    Toast.fire({ icon: icon, title: message });
}

/**
 * Confirm action (generic)
 * @param {Object} options - { title, text, icon, url, method }
 */
function confirmAction(options) {
    Swal.fire({
        title:             options.title   || 'Sahkan Tindakan',
        text:              options.text    || 'Adakah anda pasti?',
        icon:              options.icon    || 'question',
        showCancelButton: true,
        confirmButtonText: options.confirmText || 'Ya, Teruskan',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#64748b',
        reverseButtons: true,
    }).then(function (result) {
        if (result.isConfirmed && options.url) {
            window.location.href = options.url;
        }
        if (result.isConfirmed && typeof options.callback === 'function') {
            options.callback();
        }
    });
}

/* ============================================
   AJAX CSRF SETUP (jQuery)
   ============================================ */
if (typeof $ !== 'undefined') {
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (['POST','PUT','DELETE','PATCH'].indexOf(settings.type) !== -1) {
                if (typeof CSRF_TOKEN_NAME !== 'undefined') {
                    xhr.setRequestHeader('X-CSRF-TOKEN', CSRF_HASH);
                    const data = {};
                    data[CSRF_TOKEN_NAME] = CSRF_HASH;
                    settings.data = $.param(data) + (settings.data ? '&' + settings.data : '');
                }
            }
        }
    });
}

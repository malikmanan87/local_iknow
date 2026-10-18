/**
 * iKNOW Database Daily Backup Widget (Every 24 Hours Starting 8:00 AM)
 * Paparan ringkas dan minimalist untuk sandaran pangkalan data harian.
 */
(function() {
  'use strict';

  let backupData = null;
  let isBackingUp = false;
  let isUpdatingDom = false;
  let renderDebounceTimer = null;

  function getApiBase() {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const cleanPath = pathname.endsWith('/') ? pathname : pathname.substring(0, pathname.lastIndexOf('/') + 1);
    return origin + cleanPath + 'api/backup';
  }

  const dbSmallIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path></svg>`;
  const refreshIconSvg = `<svg class="spin-icon iknow-spin" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>`;

  // Inject CSS styles
  if (!document.getElementById('iknow-backup-style')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'iknow-backup-style';
    styleEl.innerHTML = `
      .iknow-simple-backup-strip {
        margin-top: 1.15rem;
        padding: 0.35rem 0.85rem;
        background: rgba(15, 23, 42, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.09);
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 0.78rem;
        color: var(--text-muted, #94a3b8);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease;
        user-select: none;
      }
      .iknow-simple-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .iknow-simple-dot.healthy {
        background: #10b981;
        box-shadow: 0 0 6px #10b981;
      }
      .iknow-simple-dot.warning {
        background: #f59e0b;
        box-shadow: 0 0 6px #f59e0b;
      }
      .iknow-simple-text strong {
        color: #e2e8f0;
        font-weight: 600;
      }
      .iknow-simple-muted {
        opacity: 0.8;
        margin-left: 0.25rem;
      }
      .iknow-simple-divider {
        opacity: 0.35;
      }
      .iknow-simple-btn {
        background: none;
        border: none;
        color: #38bdf8;
        cursor: pointer;
        font-size: 0.78rem;
        font-weight: 600;
        padding: 0.15rem 0.4rem;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        border-radius: 6px;
        transition: all 0.2s ease;
      }
      .iknow-simple-btn:hover:not(:disabled) {
        color: #7dd3fc;
        background: rgba(56, 189, 248, 0.12);
      }
      .iknow-simple-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .iknow-nav-backup-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.35rem 0.85rem;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 500;
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease;
        margin-left: 0.75rem;
      }
      .iknow-nav-backup-badge.healthy {
        background: rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.3);
        color: #34d399;
      }
      .iknow-nav-backup-badge.warning {
        background: rgba(245, 158, 11, 0.12);
        border: 1px solid rgba(245, 158, 11, 0.3);
        color: #fbbf24;
      }
      @keyframes iknow-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .iknow-spin {
        animation: iknow-spin 1s linear infinite;
      }
    `;
    document.head.appendChild(styleEl);
  }

  async function fetchBackupStatus(auto = true) {
    try {
      const url = `${getApiBase()}/status?auto=${auto ? 1 : 0}`;
      const res = await fetch(url);
      if (res.ok) {
        backupData = await res.json();
        renderAll();
      }
    } catch (err) {
      console.error('iKNOW Backup Widget: Error fetching status', err);
    }
  }

  async function runManualBackup() {
    if (isBackingUp) return;
    isBackingUp = true;
    renderAll();
    try {
      const url = `${getApiBase()}/run`;
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (data && data.info) {
        backupData = data.info;
      } else {
        await fetchBackupStatus(false);
      }
    } catch (err) {
      alert('Gagal menghasilkan sandaran pangkalan data: ' + err.message);
    } finally {
      isBackingUp = false;
      renderAll();
    }
  }

  function renderNavbarBadge() {
    if (!backupData) return;
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let badge = document.getElementById('iknow-nav-backup-badge');
    const stateKey = `${backupData.last_backup_timestamp}_${backupData.file_size}_${isBackingUp}`;

    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'iknow-nav-backup-badge';
      badge.addEventListener('click', runManualBackup);
      
      const logoContainer = navbar.querySelector('.logo-container');
      if (logoContainer && logoContainer.parentNode) {
        logoContainer.insertAdjacentElement('afterend', badge);
      }
    }

    if (badge.dataset.stateKey === stateKey) {
      return;
    }
    badge.dataset.stateKey = stateKey;

    const isHealthy = backupData.status === 'healthy';
    badge.className = `iknow-nav-backup-badge ${isHealthy ? 'healthy' : 'warning'}`;
    badge.title = `Sandaran Pangkalan Data Harian:\n` +
      `Kitaran: Setiap 24 Jam (8:00 AM)\n` +
      `Waktu: ${backupData.last_backup_formatted || '-'}\n` +
      `Seterusnya: ${backupData.next_cycle_formatted || '-'}\n` +
      `Fail: iknow_db_backup/${backupData.file_name || '-'}\n` +
      `Saiz: ${backupData.file_size || '-'}\n\n` +
      `Klik untuk buat sandaran baru serta-merta.`;

    badge.innerHTML = `
      <span class="${isBackingUp ? 'iknow-spin' : ''}" style="display:inline-flex; align-items:center;">
        ${dbSmallIconSvg}
      </span>
      <span>${isBackingUp ? 'Menyandar...' : 'Backup 8AM: ' + (backupData.last_backup_relative || 'Aktif')}</span>
      <span style="font-size:0.7rem; opacity:0.85;">(${backupData.file_size || '0 B'})</span>
    `;
  }

  function renderDashboardCard() {
    if (!backupData) return;
    
    const glassPanel = document.querySelector('.glass-panel');
    if (!glassPanel) {
      const existing = document.getElementById('iknow-dashboard-backup-card');
      if (existing) existing.remove();
      return;
    }

    let card = document.getElementById('iknow-dashboard-backup-card');
    const stateKey = `${backupData.last_backup_timestamp}_${backupData.file_size}_${isBackingUp}`;

    if (!card) {
      card = document.createElement('div');
      card.id = 'iknow-dashboard-backup-card';
      glassPanel.appendChild(card);
    }

    if (card.dataset.stateKey === stateKey) {
      return;
    }
    card.dataset.stateKey = stateKey;

    const isHealthy = backupData.status === 'healthy';
    card.className = 'iknow-simple-backup-strip';
    card.title = `Sandaran Pangkalan Data Harian (iknow_db_backup):\n` +
      `Kitaran: Setiap 24 Jam (8:00 AM)\n` +
      `Fail: iknow_db_backup/${backupData.file_name || '-'}\n` +
      `Seterusnya: ${backupData.next_cycle_formatted || '-'}`;

    card.innerHTML = `
      <span class="iknow-simple-dot ${isHealthy ? 'healthy' : 'warning'}"></span>
      <span class="iknow-simple-text">
        Backup DB (8 AM): <strong>${backupData.last_backup_formatted || '-'}</strong>
        <span class="iknow-simple-muted">(${backupData.file_size || '0 B'})</span>
      </span>
      <span class="iknow-simple-divider">•</span>
      <button id="iknow-btn-manual-backup" class="iknow-simple-btn" ${isBackingUp ? 'disabled' : ''} title="Klik untuk sandar sekarang">
        <span class="${isBackingUp ? 'iknow-spin' : ''}" style="display:inline-flex;">
          ${refreshIconSvg}
        </span>
        <span>${isBackingUp ? 'Menyandar...' : 'Sandar Sekarang'}</span>
      </button>
    `;

    const btn = card.querySelector('#iknow-btn-manual-backup');
    if (btn) {
      btn.addEventListener('click', runManualBackup);
    }
  }

  function renderAll() {
    if (isUpdatingDom) return;
    isUpdatingDom = true;
    try {
      renderNavbarBadge();
      renderDashboardCard();
    } finally {
      isUpdatingDom = false;
    }
  }

  const observer = new MutationObserver(function(mutations) {
    if (isUpdatingDom) return;

    let shouldUpdate = false;
    for (let i = 0; i < mutations.length; i++) {
      const target = mutations[i].target;
      if (target && target.closest) {
        if (target.closest('#iknow-dashboard-backup-card') || target.closest('#iknow-nav-backup-badge')) {
          continue;
        }
      }
      shouldUpdate = true;
      break;
    }

    if (!shouldUpdate) return;

    if (renderDebounceTimer) {
      clearTimeout(renderDebounceTimer);
    }
    renderDebounceTimer = setTimeout(renderAll, 150);
  });

  function init() {
    fetchBackupStatus(true);
    
    setInterval(() => {
      fetchBackupStatus(true);
    }, 60000);

    const target = document.getElementById('root');
    if (target) {
      observer.observe(target, { childList: true, subtree: true });
    }
    
    setTimeout(renderAll, 200);
    setTimeout(renderAll, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

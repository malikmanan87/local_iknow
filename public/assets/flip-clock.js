/**
 * iKNOW Live Flipping DateTime Widget (Format: OCT | 09 | 09)
 * Memaparkan Singkatan Bulan, Jam & Minit dengan Animasi Kad Selak 3D
 * Eksklusif pada bucu kanan atas glass-panel iknow-home-search-panel.
 */
(function() {
  'use strict';

  if (window.__IKNOW_FLIP_CLOCK_INITIALIZED__) return;
  window.__IKNOW_FLIP_CLOCK_INITIALIZED__ = true;

  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  let clockInterval = null;
  let prevValues = {};
  let isUpdatingDom = false;
  let renderDebounceTimer = null;

  // Injek Gaya CSS untuk Flip Clock (Format: OCT | 09 | 09)
  function injectStyles() {
    if (document.getElementById('iknow-flip-clock-style')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'iknow-flip-clock-style';
    styleEl.textContent = `
      /* Container Widget pada Bucu Kanan Atas */
      .iknow-flip-datetime-widget {
        position: absolute;
        top: 1.25rem;
        right: 1.5rem;
        display: inline-flex;
        align-items: center;
        user-select: none;
        z-index: 15;
        transition: all 0.3s ease;
      }

      /* Panel Jam Selak (Flip Clock Body) */
      .iknow-flip-clock {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        background: rgba(10, 15, 29, 0.85);
        padding: 0.32rem 0.65rem;
        border-radius: 12px;
        border: 1px solid rgba(99, 102, 241, 0.35);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }

      /* Kad Digit / Teks */
      .iknow-flip-card {
        position: relative;
        height: 33px;
        perspective: 320px;
        font-family: 'JetBrains Mono', 'Plus Jakarta Sans', monospace, sans-serif;
        font-weight: 800;
        line-height: 33px;
        text-align: center;
      }

      /* Kad Singkatan Bulan (contoh: OCT) */
      .iknow-flip-card.month-card {
        width: 44px;
        font-size: 0.92rem;
        letter-spacing: 0.06em;
      }

      .iknow-flip-card.month-card .iknow-card-face {
        color: #38bdf8;
        background: linear-gradient(180deg, #1e293b 0%, #0c1427 100%);
        border-color: rgba(56, 189, 248, 0.3);
        text-shadow: 0 0 8px rgba(56, 189, 248, 0.45);
      }

      /* Kad Nombor Jam & Minit (contoh: 09) */
      .iknow-flip-card.num-card {
        width: 36px;
        font-size: 1.18rem;
        letter-spacing: -0.02em;
      }

      .iknow-card-face {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, #1e293b 0%, #090e1a 100%);
        color: #f8fafc;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.13);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.16);
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        backface-visibility: hidden;
        text-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
      }

      /* Garisan Pemisah Split-Flap Mendatar */
      .iknow-flip-card::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: rgba(0, 0, 0, 0.7);
        box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08);
        z-index: 5;
        pointer-events: none;
      }

      /* Animasi Selak 3D Flip */
      .iknow-flip-card.flip .iknow-card-face {
        animation: iknowFlipDown 0.45s cubic-bezier(0.4, 0, 0.2, 1);
      }

      @keyframes iknowFlipDown {
        0% {
          transform: rotateX(0deg);
          filter: brightness(1);
        }
        50% {
          transform: rotateX(-90deg);
          filter: brightness(0.5);
        }
        51% {
          transform: rotateX(90deg);
          filter: brightness(0.7);
        }
        100% {
          transform: rotateX(0deg);
          filter: brightness(1);
        }
      }

      /* Pembahagi Palang Tegak ('|') */
      .iknow-flip-pipe {
        font-size: 1.15rem;
        font-weight: 300;
        color: #818cf8;
        padding: 0 0.15rem;
        user-select: none;
        animation: iknowPipePulse 2s infinite ease-in-out;
      }

      @keyframes iknowPipePulse {
        0%, 100% {
          opacity: 0.85;
          color: #818cf8;
          text-shadow: 0 0 8px rgba(129, 140, 248, 0.5);
        }
        50% {
          opacity: 0.35;
          color: #6366f1;
          text-shadow: none;
        }
      }

      /* Responsif: Skrin Tablet / Telefon */
      @media (max-width: 880px) {
        .iknow-flip-datetime-widget {
          position: static !important;
          margin: 0 auto 1.25rem auto !important;
          display: inline-flex !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
  }

  function updateCard(id, newVal) {
    const card = document.getElementById(id);
    if (!card) return;
    const face = card.querySelector('.iknow-card-face');
    if (!face) return;

    if (prevValues[id] !== newVal) {
      if (prevValues[id] !== undefined) {
        card.classList.remove('flip');
        void card.offsetWidth; // Trigger DOM reflow
        card.classList.add('flip');

        setTimeout(() => {
          face.textContent = newVal;
        }, 220); // Tukar teks pada pertengahan pusingan selak 3D
      } else {
        face.textContent = newVal;
      }
      prevValues[id] = newVal;
    }
  }

  function tick() {
    const widget = document.getElementById('iknow-home-flip-clock');
    if (!widget) return;

    const now = new Date();

    // 1. Singkatan Bulan (contoh: OCT)
    const monthStr = MONTHS[now.getMonth()];

    // 2. Jam & Minit (contoh: 09 & 15)
    const hourStr = String(now.getHours()).padStart(2, '0');
    const minStr = String(now.getMinutes()).padStart(2, '0');

    updateCard('iknow-card-month', monthStr);
    updateCard('iknow-card-hour', hourStr);
    updateCard('iknow-card-min', minStr);
  }

  function renderWidget() {
    const homePanel = document.getElementById('iknow-home-search-panel') || document.querySelector('.iknow-home-search-panel');
    let widget = document.getElementById('iknow-home-flip-clock');

    // Jika pengguna berpindah keluar dari Laman Utama, padamkan widget
    if (!homePanel) {
      if (widget) {
        widget.remove();
      }
      if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
      }
      prevValues = {};
      return;
    }

    // Pastikan panel induk mempunyai position: relative
    if (getComputedStyle(homePanel).position === 'static') {
      homePanel.style.position = 'relative';
    }

    // Cipta struktur widget jika belum wujud (Format: OCT | 09 | 09)
    if (!widget) {
      widget = document.createElement('div');
      widget.id = 'iknow-home-flip-clock';
      widget.className = 'iknow-flip-datetime-widget';

      widget.innerHTML = `
        <div class="iknow-flip-clock" title="Bulan & Waktu Semasa">
          <!-- Singkatan Bulan: OCT -->
          <div class="iknow-flip-card month-card" id="iknow-card-month">
            <div class="iknow-card-face">--</div>
          </div>

          <span class="iknow-flip-pipe">|</span>

          <!-- Jam: 09 -->
          <div class="iknow-flip-card num-card" id="iknow-card-hour">
            <div class="iknow-card-face">--</div>
          </div>

          <span class="iknow-flip-pipe">|</span>

          <!-- Minit: 09 -->
          <div class="iknow-flip-card num-card" id="iknow-card-min">
            <div class="iknow-card-face">--</div>
          </div>
        </div>
      `;

      homePanel.prepend(widget);
      prevValues = {};
    }

    // Mulakan jam jika belum aktif
    tick();
    if (!clockInterval) {
      clockInterval = setInterval(tick, 1000);
    }
  }

  function renderAll() {
    if (isUpdatingDom) return;
    isUpdatingDom = true;
    try {
      renderWidget();
    } finally {
      isUpdatingDom = false;
    }
  }

  // Pantau perubahan DOM (apabila pengguna menavigasi dalam SPA)
  const observer = new MutationObserver(function(mutations) {
    if (isUpdatingDom) return;

    let shouldUpdate = false;
    for (let i = 0; i < mutations.length; i++) {
      const target = mutations[i].target;
      if (target && target.closest) {
        if (target.closest('#iknow-home-flip-clock') || target.closest('#iknow-dashboard-backup-card')) {
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
    renderDebounceTimer = setTimeout(renderAll, 120);
  });

  function init() {
    injectStyles();
    renderAll();

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

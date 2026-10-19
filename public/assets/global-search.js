/**
 * iKNOW Global Omnibar / Command Palette (Ctrl + K)
 * Sistem Carian Berpusat Merentas Modul, Isu, Papan Nota, Kewangan & SOP
 */
(function() {
  'use strict';

  // Elak multiple injection
  if (window.__IKNOW_GLOBAL_SEARCH_INITIALIZED__) return;
  window.__IKNOW_GLOBAL_SEARCH_INITIALIZED__ = true;

  let isOpen = false;
  let activeIndex = -1;
  let currentResults = [];
  let debounceTimer = null;
  let currentCategory = 'all';

  // Dapatkan base API URL
  function getApiBase() {
    const origin = window.location.origin;
    const path = window.location.pathname;
    const cleanPath = path.substring(0, path.lastIndexOf('/') + 1);
    return origin + cleanPath + 'api/search';
  }

  // Inject CSS Styles
  const style = document.createElement('style');
  style.id = 'iknow-global-search-style';
  style.textContent = `
    .iknow-omnibar-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(8, 12, 22, 0.75);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      z-index: 10000;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 5rem 1rem 2rem 1rem;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.2s;
    }
    .iknow-omnibar-backdrop.active {
      opacity: 1;
      visibility: visible;
    }
    .iknow-omnibar-modal {
      width: 100%;
      max-width: 680px;
      background: rgba(17, 24, 39, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05);
      overflow: hidden;
      transform: translateY(-16px) scale(0.98);
      transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      max-height: 82vh;
    }
    .iknow-omnibar-backdrop.active .iknow-omnibar-modal {
      transform: translateY(0) scale(1);
    }
    .iknow-omnibar-header {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.02);
    }
    .iknow-omnibar-icon {
      color: #6366f1;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .iknow-omnibar-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font-size: 1.05rem;
      color: #f8fafc;
      font-family: inherit;
    }
    .iknow-omnibar-input::placeholder {
      color: #64748b;
    }
    .iknow-omnibar-esc {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
    }
    .iknow-omnibar-categories {
      display: flex;
      gap: 0.4rem;
      padding: 0.65rem 1.25rem;
      background: rgba(10, 15, 26, 0.5);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      overflow-x: auto;
      scrollbar-width: none;
    }
    .iknow-omnibar-categories::-webkit-scrollbar { display: none; }
    .iknow-omnibar-cat-pill {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .iknow-omnibar-cat-pill:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #f1f5f9;
    }
    .iknow-omnibar-cat-pill.active {
      background: rgba(99, 102, 241, 0.2);
      border-color: rgba(99, 102, 241, 0.45);
      color: #a5b4fc;
    }
    .iknow-omnibar-body {
      overflow-y: auto;
      padding: 0.75rem;
      flex: 1;
      max-height: 480px;
    }
    .iknow-omnibar-group-title {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      padding: 0.45rem 0.75rem 0.25rem 0.75rem;
    }
    .iknow-omnibar-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.12s ease, transform 0.12s ease;
      color: #e2e8f0;
    }
    .iknow-omnibar-item:hover, .iknow-omnibar-item.selected {
      background: rgba(99, 102, 241, 0.15);
      color: #ffffff;
    }
    .iknow-omnibar-item-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
      flex: 1;
    }
    .iknow-omnibar-item-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 1rem;
    }
    .iknow-omnibar-item-text {
      min-width: 0;
      flex: 1;
    }
    .iknow-omnibar-item-title {
      font-size: 0.92rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .iknow-omnibar-item-sub {
      font-size: 0.78rem;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 0.1rem;
    }
    .iknow-omnibar-item-badge {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      flex-shrink: 0;
    }
    .iknow-omnibar-empty {
      text-align: center;
      padding: 3rem 1.5rem;
      color: #64748b;
    }
    .iknow-omnibar-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.65rem 1.25rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(10, 15, 26, 0.4);
      font-size: 0.75rem;
      color: #64748b;
    }
    .iknow-omnibar-shortcuts {
      display: flex;
      gap: 0.85rem;
      align-items: center;
    }
    .iknow-omnibar-key {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      background: rgba(255, 255, 255, 0.06);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-weight: 600;
      color: #94a3b8;
    }

    /* Navbar search trigger button styling */
    .iknow-nav-search-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #94a3b8;
      padding: 0.4rem 0.9rem;
      border-radius: 10px;
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .iknow-nav-search-btn:hover {
      background: rgba(99, 102, 241, 0.12);
      border-color: rgba(99, 102, 241, 0.35);
      color: #cbd5e1;
    }
    .iknow-nav-search-btn kbd {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      color: #cbd5e1;
    }
  `;
  document.head.appendChild(style);

  // Template Modal HTML
  const modalHTML = `
    <div id="iknow-omnibar-backdrop" class="iknow-omnibar-backdrop" role="dialog" aria-modal="true">
      <div class="iknow-omnibar-modal">
        <div class="iknow-omnibar-header">
          <div class="iknow-omnibar-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          </div>
          <input id="iknow-omnibar-input" class="iknow-omnibar-input" type="text" placeholder="Cari modul, isu ralat, skrip SQL, SOP kewangan, staf... (Ctrl+K)" autocomplete="off" spellcheck="false" />
          <button id="iknow-omnibar-close" class="iknow-omnibar-esc" title="Tutup (Esc)">ESC</button>
        </div>

        <div class="iknow-omnibar-categories">
          <button class="iknow-omnibar-cat-pill active" data-cat="all">Semua</button>
          <button class="iknow-omnibar-cat-pill" data-cat="modules">Modul Sistem</button>
          <button class="iknow-omnibar-cat-pill" data-cat="issues">Isu & Kod Ralat</button>
          <button class="iknow-omnibar-cat-pill" data-cat="notes">Papan Nota & SQL</button>
          <button class="iknow-omnibar-cat-pill" data-cat="procurement">Kewangan & SOP</button>
          <button class="iknow-omnibar-cat-pill" data-cat="shortcuts">Pintasan Pantas</button>
        </div>

        <div id="iknow-omnibar-body" class="iknow-omnibar-body">
          <!-- Item list dinikmati secara dinamik -->
        </div>

        <div class="iknow-omnibar-footer">
          <div class="iknow-omnibar-shortcuts">
            <span><span class="iknow-omnibar-key">↑</span> <span class="iknow-omnibar-key">↓</span> Gerak</span>
            <span><span class="iknow-omnibar-key">↵</span> Buka</span>
            <span><span class="iknow-omnibar-key">ESC</span> Tutup</span>
          </div>
          <div>iKNOW Universal Omnibar</div>
        </div>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = modalHTML;
  document.body.appendChild(container.firstElementChild);

  const backdrop = document.getElementById('iknow-omnibar-backdrop');
  const inputEl = document.getElementById('iknow-omnibar-input');
  const bodyEl = document.getElementById('iknow-omnibar-body');
  const closeBtn = document.getElementById('iknow-omnibar-close');
  const catPills = document.querySelectorAll('.iknow-omnibar-cat-pill');

  // Senarai Pintasan Utama
  const DEFAULT_SHORTCUTS = [
    {
      type: 'action',
      category: 'shortcuts',
      title: 'Papan Pemuka Modul Sistem',
      sub: 'Kembali ke senarai penuh dokumentasi modul & SOP',
      badge: 'Navigasi',
      badgeBg: 'rgba(99, 102, 241, 0.15)',
      badgeColor: '#a5b4fc',
      icon: '📚',
      action: () => navigateToTab('dashboard')
    },
    {
      type: 'action',
      category: 'shortcuts',
      title: 'Direktori Staf UniSZA',
      sub: 'Carian pegawai PIC sistem, emel, dan nombor sambungan',
      badge: 'Navigasi',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeColor: '#34d399',
      icon: '👥',
      action: () => navigateToTab('staff')
    },
    {
      type: 'action',
      category: 'shortcuts',
      title: 'Papan Nota & Tampalan (Notes)',
      sub: 'Simpanan catatan kerja, arahan skrip, dan query SQL',
      badge: 'Navigasi',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeColor: '#fbbf24',
      icon: '📝',
      action: () => navigateToTab('notes')
    },
    {
      type: 'action',
      category: 'shortcuts',
      title: 'Modul Kewangan & Perolehan',
      sub: 'Rujukan tatacara penilaian tender, SOP perolehan ICT & templat',
      badge: 'Navigasi',
      badgeBg: 'rgba(168, 85, 247, 0.15)',
      badgeColor: '#c084fc',
      icon: '🏛️',
      action: () => navigateToTab('procurement')
    },
    {
      type: 'action',
      category: 'shortcuts',
      title: 'Pemantau Mirth Connect HL7',
      sub: 'Status integrasi saluran, statistik mesej, dan sambungan',
      badge: 'Navigasi',
      badgeBg: 'rgba(6, 182, 212, 0.15)',
      badgeColor: '#22d3ee',
      icon: '📡',
      action: () => navigateToTab('mirth')
    },
    {
      type: 'action',
      category: 'shortcuts',
      title: 'Sandar Pangkalan Data Sekarang',
      sub: 'Jalankan sandaran manual segera ke folder iknow_db_backup',
      badge: 'Tindakan',
      badgeBg: 'rgba(16, 185, 129, 0.2)',
      badgeColor: '#34d399',
      icon: '💾',
      action: () => triggerManualBackup()
    }
  ];

  // Helper untuk tukar tab dalam React App
  function navigateToTab(tabName) {
    closeOmnibar();
    // Cari butang navbar yang sepadan dan klik
    const navButtons = document.querySelectorAll('.navbar button, nav button');
    for (const btn of navButtons) {
      const text = btn.textContent.toLowerCase();
      if (tabName === 'dashboard' && (text.includes('modul') || text.includes('dashboard'))) {
        btn.click();
        return;
      }
      if (tabName === 'staff' && text.includes('staf')) {
        btn.click();
        return;
      }
      if (tabName === 'notes' && text.includes('nota')) {
        btn.click();
        return;
      }
      if (tabName === 'procurement' && (text.includes('kewangan') || text.includes('perolehan'))) {
        btn.click();
        return;
      }
      if (tabName === 'mirth' && text.includes('mirth')) {
        btn.click();
        return;
      }
    }
  }

  // Trigger manual backup
  function triggerManualBackup() {
    closeOmnibar();
    const backupBtn = document.getElementById('iknow-btn-manual-backup');
    if (backupBtn) {
      backupBtn.click();
    } else {
      fetch(window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'api/backup/run', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (window.Swal) {
            Swal.fire({
              icon: 'success',
              title: 'Sandaran Berjaya!',
              text: data.message || 'Pangkalan data berjaya disandarkan.'
            });
          }
        });
    }
  }

  // Buka Omnibar
  function openOmnibar() {
    isOpen = true;
    backdrop.classList.add('active');
    inputEl.value = '';
    currentCategory = 'all';
    updateCategoryPills();
    renderDefaultView();
    setTimeout(() => inputEl.focus(), 50);
  }

  // Tutup Omnibar
  function closeOmnibar() {
    isOpen = false;
    backdrop.classList.remove('active');
    inputEl.blur();
    activeIndex = -1;
  }

  function updateCategoryPills() {
    catPills.forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-cat') === currentCategory);
    });
  }

  // Papar pandangan asal (Pintasan & Sejarah)
  function renderDefaultView() {
    let items = DEFAULT_SHORTCUTS;
    if (currentCategory !== 'all') {
      items = items.filter(it => it.category === currentCategory);
    }
    currentResults = items;
    activeIndex = items.length > 0 ? 0 : -1;
    renderResults(items, 'Pintasan Pantas Sistem');
  }

  // Jalankan carian ke API
  async function performSearch(query) {
    if (!query || query.length < 2) {
      renderDefaultView();
      return;
    }

    bodyEl.innerHTML = `
      <div style="text-align: center; padding: 2.5rem; color: #94a3b8;">
        <div style="display: inline-block; animation: spin 1s linear infinite; margin-bottom: 0.5rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
        </div>
        <div>Mencari maklumat di seluruh sistem...</div>
      </div>
    `;

    try {
      const res = await fetch(`${getApiBase()}?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      const combined = [];

      // Modul
      if (data.modules && data.modules.length > 0) {
        data.modules.forEach(m => {
          combined.push({
            type: 'module',
            category: 'modules',
            title: m.title,
            sub: `${m.code ? '[' + m.code + '] ' : ''}${m.category || 'Modul Sistem'} — ${m.description || ''}`,
            badge: 'Modul',
            badgeBg: 'rgba(99, 102, 241, 0.15)',
            badgeColor: '#a5b4fc',
            icon: '📦',
            action: () => {
              navigateToTab('dashboard');
              // Cuba klik modul card selepas navigasi
              setTimeout(() => {
                const cards = document.querySelectorAll('.glass-card, .module-card');
                for (const c of cards) {
                  if (c.textContent.includes(m.title)) {
                    c.click();
                    break;
                  }
                }
              }, 200);
            }
          });
        });
      }

      // Isu & Ralat
      if (data.issues && data.issues.length > 0) {
        data.issues.forEach(i => {
          combined.push({
            type: 'issue',
            category: 'issues',
            title: i.title,
            sub: `${i.issue_code ? '[' + i.issue_code + '] ' : ''}${i.symptoms || i.module_title || ''}`,
            badge: 'Troubleshooting',
            badgeBg: 'rgba(239, 68, 68, 0.15)',
            badgeColor: '#f87171',
            icon: '⚠️',
            action: () => {
              navigateToTab('dashboard');
            }
          });
        });
      }

      // Papan Nota
      if (data.notes && data.notes.length > 0) {
        data.notes.forEach(n => {
          combined.push({
            type: 'note',
            category: 'notes',
            title: n.title,
            sub: `${n.category ? '[' + n.category + '] ' : ''}${n.content.substring(0, 100).replace(/\n/g, ' ')}...`,
            badge: 'Nota',
            badgeBg: 'rgba(245, 158, 11, 0.15)',
            badgeColor: '#fbbf24',
            icon: '📝',
            action: () => {
              navigateToTab('notes');
              // Cuba salin atau papar
              if (navigator.clipboard) {
                navigator.clipboard.writeText(n.content);
                if (window.Swal) {
                  Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Kandungan nota telah disalin!',
                    showConfirmButton: false,
                    timer: 2000
                  });
                }
              }
            }
          });
        });
      }

      // Kewangan & Perolehan
      if (data.procurement && data.procurement.length > 0) {
        data.procurement.forEach(p => {
          combined.push({
            type: 'procurement',
            category: 'procurement',
            title: p.title,
            sub: `${p.reference_no ? '[' + p.reference_no + '] ' : ''}${p.category} — ${p.description || ''}`,
            badge: 'Kewangan',
            badgeBg: 'rgba(168, 85, 247, 0.15)',
            badgeColor: '#c084fc',
            icon: '📄',
            action: () => {
              navigateToTab('procurement');
            }
          });
        });
      }

      // PIC Contacts
      if (data.contacts && data.contacts.length > 0) {
        data.contacts.forEach(c => {
          combined.push({
            type: 'contact',
            category: 'shortcuts',
            title: c.name,
            sub: `${c.role || 'PIC'} — ${c.email || ''} ${c.phone_no ? '(' + c.phone_no + ')' : ''}`,
            badge: 'Pegawai',
            badgeBg: 'rgba(16, 185, 129, 0.15)',
            badgeColor: '#34d399',
            icon: '👤',
            action: () => {
              navigateToTab('staff');
            }
          });
        });
      }

      // Tapis mengikut kategori terpilih jika ada
      let filtered = combined;
      if (currentCategory !== 'all') {
        filtered = combined.filter(it => it.category === currentCategory);
      }

      currentResults = filtered;
      activeIndex = filtered.length > 0 ? 0 : -1;

      if (filtered.length === 0) {
        bodyEl.innerHTML = `
          <div class="iknow-omnibar-empty">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 0.75rem auto; opacity: 0.4;"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
            <div style="font-size: 0.95rem; font-weight: 600; color: #94a3b8; margin-bottom: 0.25rem;">Tiada rekod ditemui untuk "${query}"</div>
            <div style="font-size: 0.8rem;">Cuba gunakan kata kunci modul, no. rujukan PK, atau kod ralat lain.</div>
          </div>
        `;
      } else {
        renderResults(filtered, `Hasil Carian: ${filtered.length} rekod dijumpai`);
      }

    } catch (err) {
      console.error('Omnibar search error:', err);
      bodyEl.innerHTML = `
        <div class="iknow-omnibar-empty" style="color: #f87171;">
          <div>Ralat menghubungi pangkalan data carian. Sila cuba sebentar lagi.</div>
        </div>
      `;
    }
  }

  // Render hasil carian ke DOM
  function renderResults(items, title) {
    let html = `<div class="iknow-omnibar-group-title">${title}</div>`;

    items.forEach((item, idx) => {
      const isSelected = idx === activeIndex ? 'selected' : '';
      html += `
        <div class="iknow-omnibar-item ${isSelected}" data-index="${idx}">
          <div class="iknow-omnibar-item-left">
            <div class="iknow-omnibar-item-icon" style="background: ${item.badgeBg};">
              ${item.icon}
            </div>
            <div class="iknow-omnibar-item-text">
              <div class="iknow-omnibar-item-title">${escapeHTML(item.title)}</div>
              <div class="iknow-omnibar-item-sub">${escapeHTML(item.sub)}</div>
            </div>
          </div>
          <div class="iknow-omnibar-item-badge" style="background: ${item.badgeBg}; color: ${item.badgeColor};">
            ${escapeHTML(item.badge)}
          </div>
        </div>
      `;
    });

    bodyEl.innerHTML = html;

    // Klik pada item
    bodyEl.querySelectorAll('.iknow-omnibar-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        if (currentResults[idx] && typeof currentResults[idx].action === 'function') {
          currentResults[idx].action();
        }
      });
    });
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Update visual selection
  function updateSelection() {
    const items = bodyEl.querySelectorAll('.iknow-omnibar-item');
    items.forEach((el, idx) => {
      el.classList.toggle('selected', idx === activeIndex);
      if (idx === activeIndex) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  // Keyboard Shortcuts: Ctrl+K, Escape, Arrows
  window.addEventListener('keydown', (e) => {
    // Ctrl+K atau Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (isOpen) {
        closeOmnibar();
      } else {
        openOmnibar();
      }
      return;
    }

    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeOmnibar();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentResults.length > 0) {
        activeIndex = (activeIndex + 1) % currentResults.length;
        updateSelection();
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentResults.length > 0) {
        activeIndex = (activeIndex - 1 + currentResults.length) % currentResults.length;
        updateSelection();
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && currentResults[activeIndex]) {
        if (typeof currentResults[activeIndex].action === 'function') {
          currentResults[activeIndex].action();
        }
      }
      return;
    }
  });

  // Event Input Typing dengan Debounce
  inputEl.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      performSearch(query);
    }, 200);
  });

  // Klik luar untuk tutup
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closeOmnibar();
    }
  });

  closeBtn.addEventListener('click', closeOmnibar);

  // Kategori Pill Clicks
  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      currentCategory = pill.getAttribute('data-cat');
      updateCategoryPills();
      const q = inputEl.value.trim();
      if (q.length >= 2) {
        performSearch(q);
      } else {
        renderDefaultView();
      }
    });
  });

  // Suntikkan Butang Search Trigger ke Navbar jika wujud
  function injectNavbarButton() {
    if (document.getElementById('iknow-nav-search-trigger')) return;
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      const btn = document.createElement('button');
      btn.id = 'iknow-nav-search-trigger';
      btn.className = 'iknow-nav-search-btn';
      btn.title = 'Buka Carian Berpusat (Ctrl + K)';
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
        <span>Carian Pintar...</span>
        <kbd>Ctrl K</kbd>
      `;
      btn.addEventListener('click', openOmnibar);

      // Letakkan bersebelahan butang tambah atau logo
      const lastBtnGroup = navbar.querySelector('div[style*="display: flex"]');
      if (lastBtnGroup) {
        lastBtnGroup.insertBefore(btn, lastBtnGroup.firstChild);
      } else {
        navbar.appendChild(btn);
      }
    }
  }

  // Cuba suntik serta-merta dan semak berkala
  injectNavbarButton();
  const obs = new MutationObserver(() => injectNavbarButton());
  obs.observe(document.body, { childList: true, subtree: true });

  // Dedahkan fungsi global
  window.iKnowOpenSearch = openOmnibar;
})();

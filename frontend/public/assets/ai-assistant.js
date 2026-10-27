/**
 * IKNOW AI Assistant (Copilot) - 3D Character Avatar Widget
 * Integrasi pembantu maya berasaskan AI untuk Dashboard & Homepage IKNOW
 */
(function() {
  'use strict';

  // Elakkan inisialisasi berganda
  if (window.__iknowAiAssistantLoaded) {
    console.log('[IKNOW AI Assistant] Sudah dimuatkan sebelumnya.');
    return;
  }
  window.__iknowAiAssistantLoaded = true;

  console.log('[IKNOW AI Assistant] Memulakan 3D Avatar AI Assistant widget...');

  function getApiBase() {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    let cleanPath = pathname.endsWith('/') ? pathname : pathname.substring(0, pathname.lastIndexOf('/') + 1);
    // Pastikan path ke API tepat sama ada dari /iknow/ atau /iknow/public/
    if (cleanPath.endsWith('/public/')) {
      return origin + cleanPath + 'api/ai/';
    } else if (cleanPath.includes('/iknow/')) {
      return origin + '/iknow/public/api/ai/';
    }
    return origin + cleanPath + 'api/ai/';
  }

  function getAssetPath(filename) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    let cleanPath = pathname.endsWith('/') ? pathname : pathname.substring(0, pathname.lastIndexOf('/') + 1);
    if (cleanPath.includes('/public/')) {
      return origin + cleanPath + 'assets/' + filename;
    }
    return origin + '/iknow/public/assets/' + filename;
  }

  const avatarUrl = getAssetPath('ai-avatar.jpg?v=20261027_153000');

  // Inject Styles apabila HEAD tersedia
  function injectStyles() {
    if (document.getElementById('iknow-ai-assistant-style')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'iknow-ai-assistant-style';
    styleEl.innerHTML = `
      /* Floating Trigger Container */
      .iknow-ai-fab-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999 !important;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      .iknow-ai-speech-bubble {
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(99, 102, 241, 0.45);
        color: #f8fafc;
        padding: 8px 16px;
        border-radius: 16px;
        font-size: 0.82rem;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(99, 102, 241, 0.25);
        display: flex;
        align-items: center;
        gap: 8px;
        animation: iknowFadeSlideIn 0.4s ease-out;
        cursor: pointer;
        user-select: none;
        transition: all 0.25s ease;
      }
      .iknow-ai-speech-bubble:hover {
        transform: translateY(-2px);
        border-color: rgba(99, 102, 241, 0.8);
        box-shadow: 0 12px 35px rgba(99, 102, 241, 0.45);
      }

      .iknow-ai-fab-btn {
        position: relative;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        cursor: pointer;
        background: linear-gradient(135deg, #6366f1, #06b6d4, #a855f7);
        padding: 3px;
        box-shadow: 0 8px 30px rgba(99, 102, 241, 0.6), 0 0 25px rgba(6, 182, 212, 0.45);
        border: none;
        outline: none;
        transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: iknowFabBounce 3s ease-in-out infinite;
      }
      .iknow-ai-fab-btn:hover {
        transform: scale(1.12) rotate(3deg);
        box-shadow: 0 14px 40px rgba(99, 102, 241, 0.8), 0 0 35px rgba(6, 182, 212, 0.6);
        animation-play-state: paused;
      }
      .iknow-ai-fab-btn:active {
        transform: scale(0.95);
      }

      .iknow-ai-fab-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        background: #0f172a;
        display: block;
        border: 2px solid rgba(255, 255, 255, 0.2);
      }

      .iknow-ai-status-dot {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 16px;
        height: 16px;
        background: #10b981;
        border: 3px solid #0f172a;
        border-radius: 50%;
        box-shadow: 0 0 10px #10b981;
      }
      .iknow-ai-status-dot::after {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: #10b981;
        animation: iknowPulseDot 2s infinite;
      }

      /* Chat Drawer / Modal */
      .iknow-ai-chat-window {
        position: fixed;
        bottom: 100px;
        right: 24px;
        width: 400px;
        max-width: calc(100vw - 36px);
        height: 580px;
        max-height: calc(100vh - 120px);
        background: rgba(15, 23, 42, 0.96);
        backdrop-filter: blur(28px);
        -webkit-backdrop-filter: blur(28px);
        border: 1px solid rgba(99, 102, 241, 0.4);
        border-radius: 24px;
        box-shadow: 0 30px 70px rgba(0, 0, 0, 0.75), 0 0 50px rgba(99, 102, 241, 0.2);
        z-index: 999999 !important;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        animation: iknowChatPopup 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        transition: all 0.3s ease;
      }

      .iknow-ai-header {
        padding: 14px 18px;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.28), rgba(6, 182, 212, 0.18), rgba(15, 23, 42, 0.85));
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .iknow-ai-header-profile {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .iknow-ai-header-avatar {
        position: relative;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366f1, #06b6d4);
        padding: 2.5px;
        flex-shrink: 0;
        box-shadow: 0 0 15px rgba(99, 102, 241, 0.5);
      }
      .iknow-ai-header-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        display: block;
      }

      .iknow-ai-header-title {
        font-size: 0.98rem;
        font-weight: 700;
        color: #f8fafc;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .iknow-ai-header-subtitle {
        font-size: 0.74rem;
        color: #a5b4fc;
        margin: 2px 0 0 0;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .iknow-ai-live-badge {
        display: inline-block;
        width: 7px;
        height: 7px;
        background: #10b981;
        border-radius: 50%;
        box-shadow: 0 0 8px #10b981;
      }

      .iknow-ai-close-btn {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #94a3b8;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1rem;
        transition: all 0.2s ease;
      }
      .iknow-ai-close-btn:hover {
        background: rgba(239, 68, 68, 0.25);
        color: #fca5a5;
        border-color: rgba(239, 68, 68, 0.5);
      }

      /* Messages Body */
      .iknow-ai-body {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 14px;
        scrollbar-width: thin;
        scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
      }
      .iknow-ai-body::-webkit-scrollbar {
        width: 5px;
      }
      .iknow-ai-body::-webkit-scrollbar-thumb {
        background: rgba(99, 102, 241, 0.3);
        border-radius: 10px;
      }

      .iknow-ai-welcome-card {
        text-align: center;
        background: rgba(99, 102, 241, 0.1);
        border: 1px solid rgba(99, 102, 241, 0.25);
        border-radius: 18px;
        padding: 20px 14px;
        margin-bottom: 6px;
      }
      .iknow-ai-welcome-avatar {
        width: 74px;
        height: 74px;
        border-radius: 50%;
        margin: 0 auto 12px auto;
        background: linear-gradient(135deg, #6366f1, #06b6d4, #a855f7);
        padding: 3px;
        box-shadow: 0 0 25px rgba(99, 102, 241, 0.5);
      }
      .iknow-ai-welcome-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        display: block;
      }
      .iknow-ai-welcome-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: #f8fafc;
        margin: 0 0 6px 0;
      }
      .iknow-ai-welcome-desc {
        font-size: 0.82rem;
        color: #94a3b8;
        line-height: 1.5;
        margin: 0;
      }

      /* Quick Suggestion Chips */
      .iknow-ai-chips-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 14px;
        justify-content: center;
      }
      .iknow-ai-chip {
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(99, 102, 241, 0.32);
        color: #cbd5e1;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.76rem;
        font-weight: 500;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
        user-select: none;
      }
      .iknow-ai-chip:hover {
        background: rgba(99, 102, 241, 0.3);
        color: #ffffff;
        border-color: rgba(99, 102, 241, 0.65);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      }

      /* Message Bubbles */
      .iknow-ai-msg-row {
        display: flex;
        gap: 10px;
        max-width: 92%;
        animation: iknowFadeSlideIn 0.25s ease-out;
      }
      .iknow-ai-msg-row.user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }
      .iknow-ai-msg-row.bot {
        align-self: flex-start;
      }

      .iknow-ai-msg-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        flex-shrink: 0;
        background: #6366f1;
        overflow: hidden;
        margin-top: 3px;
        box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
      }
      .iknow-ai-msg-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .iknow-ai-msg-bubble {
        padding: 11px 15px;
        border-radius: 16px;
        font-size: 0.84rem;
        line-height: 1.55;
        color: #e2e8f0;
        word-break: break-word;
      }
      .iknow-ai-msg-row.user .iknow-ai-msg-bubble {
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        color: #ffffff;
        border-bottom-right-radius: 4px;
        box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);
      }
      .iknow-ai-msg-row.bot .iknow-ai-msg-bubble {
        background: rgba(30, 41, 59, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.09);
        border-bottom-left-radius: 4px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      }

      .iknow-ai-msg-bubble p {
        margin: 0 0 8px 0;
      }
      .iknow-ai-msg-bubble p:last-child {
        margin-bottom: 0;
      }
      .iknow-ai-msg-bubble strong {
        color: #f8fafc;
      }
      .iknow-ai-msg-bubble code {
        background: rgba(0, 0, 0, 0.45);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: Consolas, monospace;
        font-size: 0.79rem;
        color: #38bdf8;
      }
      .iknow-ai-msg-bubble pre {
        background: #090d16;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        padding: 10px 12px;
        overflow-x: auto;
        font-size: 0.77rem;
        margin: 8px 0;
        color: #a5f3fc;
      }

      .iknow-ai-action-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 10px;
        padding: 6px 12px;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(6, 182, 212, 0.35));
        border: 1px solid rgba(99, 102, 241, 0.5);
        color: #ffffff;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .iknow-ai-action-btn:hover {
        background: linear-gradient(135deg, #6366f1, #06b6d4);
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(99, 102, 241, 0.45);
      }

      /* Typing Dots Animation */
      .iknow-ai-typing {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 12px 16px;
      }
      .iknow-ai-typing-dot {
        width: 7px;
        height: 7px;
        background: #818cf8;
        border-radius: 50%;
        animation: iknowBlink 1.4s infinite both;
      }
      .iknow-ai-typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .iknow-ai-typing-dot:nth-child(3) { animation-delay: 0.4s; }

      /* Footer Input */
      .iknow-ai-footer {
        padding: 12px 14px;
        background: rgba(10, 15, 29, 0.95);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .iknow-ai-input {
        flex: 1;
        background: rgba(30, 41, 59, 0.8);
        border: 1px solid rgba(99, 102, 241, 0.32);
        color: #f8fafc;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 0.85rem;
        outline: none;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      .iknow-ai-input:focus {
        border-color: #818cf8;
        box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
      }
      .iknow-ai-input::placeholder {
        color: #64748b;
      }

      .iknow-ai-send-btn {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, #6366f1, #06b6d4);
        border: none;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      .iknow-ai-send-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 14px rgba(99, 102, 241, 0.5);
      }
      .iknow-ai-send-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        transform: none;
      }

      /* Keyframes */
      @keyframes iknowFabBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      @keyframes iknowChatPopup {
        from { opacity: 0; transform: translateY(24px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes iknowFadeSlideIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes iknowPulseDot {
        0% { transform: scale(1); opacity: 0.8; }
        100% { transform: scale(2.4); opacity: 0; }
      }
      @keyframes iknowBlink {
        0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1.2); }
      }

      /* Responsive */
      @media (max-width: 480px) {
        .iknow-ai-chat-window {
          bottom: 85px;
          right: 12px;
          width: calc(100vw - 24px);
          height: calc(100vh - 110px);
        }
        .iknow-ai-speech-bubble {
          display: none;
        }
      }
    `;
    (document.head || document.documentElement).appendChild(styleEl);
  }

  // State
  let isOpen = false;
  let isSending = false;

  // Helper formatting markdown text to safe HTML
  function formatMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks ```code```
    html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic *text*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br/>');

    return `<p>${html}</p>`;
  }

  // Render FAB and Drawer
  function renderFab() {
    injectStyles();

    if (!document.body) {
      console.warn('[IKNOW AI Assistant] document.body belum bersedia, cuba lagi...');
      setTimeout(renderFab, 50);
      return;
    }

    let container = document.getElementById('iknow-ai-assistant-root');
    if (!container) {
      container = document.createElement('div');
      container.id = 'iknow-ai-assistant-root';
      document.body.appendChild(container);
    }

    if (document.getElementById('iknow-ai-fab-toggle')) {
      return;
    }

    container.innerHTML = `
      <div class="iknow-ai-fab-container">
        <div class="iknow-ai-speech-bubble" id="iknow-ai-bubble-trigger">
          <span>👋</span>
          <span>Tanya Pembantu Maya IKNOW</span>
        </div>
        <button class="iknow-ai-fab-btn" id="iknow-ai-fab-toggle" title="Buka Pembantu Maya IKNOW">
          <img class="iknow-ai-fab-img" src="${avatarUrl}" alt="IKNOW AI 3D Avatar" />
          <span class="iknow-ai-status-dot"></span>
        </button>
      </div>

      <div class="iknow-ai-chat-window" id="iknow-ai-chat-window" style="display: none;">
        <div class="iknow-ai-header">
          <div class="iknow-ai-header-profile">
            <div class="iknow-ai-header-avatar">
              <img src="${avatarUrl}" alt="Avatar" />
            </div>
            <div>
              <h3 class="iknow-ai-header-title">IKNOW Copilot ✨</h3>
              <p class="iknow-ai-header-subtitle">
                <span class="iknow-ai-live-badge"></span>
                Pembantu Maya 3D • Sentiasa Aktif
              </p>
            </div>
          </div>
          <button class="iknow-ai-close-btn" id="iknow-ai-close-btn" title="Tutup">✕</button>
        </div>

        <div class="iknow-ai-body" id="iknow-ai-msg-body">
          <div class="iknow-ai-welcome-card">
            <div class="iknow-ai-welcome-avatar">
              <img src="${avatarUrl}" alt="IKNOW Avatar 3D" />
            </div>
            <h4 class="iknow-ai-welcome-title">Hai! Saya Pembantu Maya IKNOW 👋</h4>
            <p class="iknow-ai-welcome-desc">
              Saya boleh membantu anda menyemak status pelayan, menyelesaikan ralat modul, mencari skrip SQL, atau menyemak peringatan tugasan.
            </p>
            <div class="iknow-ai-chips-wrap">
              <div class="iknow-ai-chip" data-prompt="Apakah status semua pelayan masa kini?">
                <span>⚡</span> Status Pelayan
              </div>
              <div class="iknow-ai-chip" data-prompt="Ada apa-apa peringatan tugasan yang belum selesai?">
                <span>🔔</span> Peringatan Tugas
              </div>
              <div class="iknow-ai-chip" data-prompt="Bagaimana cara atasi isu ralat Mirth Channel terhenti?">
                <span>🛠️</span> Ralat Mirth
              </div>
              <div class="iknow-ai-chip" data-prompt="Beri senarai skrip SQL yang disimpan dalam nota">
                <span>📝</span> Skrip SQL
              </div>
            </div>
          </div>

          <div id="iknow-ai-dynamic-msgs"></div>
        </div>

        <div class="iknow-ai-footer">
          <input 
            type="text" 
            class="iknow-ai-input" 
            id="iknow-ai-text-input" 
            placeholder="Tanya soalan tentang sistem IKNOW..." 
            autocomplete="off"
          />
          <button class="iknow-ai-send-btn" id="iknow-ai-send-btn" title="Hantar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `;

    bindEvents();
    console.log('[IKNOW AI Assistant] 3D Avatar widget berjaya dipaparkan di DOM.');
  }

  function bindEvents() {
    const toggleBtn = document.getElementById('iknow-ai-fab-toggle');
    const bubbleBtn = document.getElementById('iknow-ai-bubble-trigger');
    const closeBtn = document.getElementById('iknow-ai-close-btn');
    const chatWindow = document.getElementById('iknow-ai-chat-window');
    const inputEl = document.getElementById('iknow-ai-text-input');
    const sendBtn = document.getElementById('iknow-ai-send-btn');

    if (!toggleBtn || !chatWindow) return;

    const toggleOpen = () => {
      isOpen = !isOpen;
      chatWindow.style.display = isOpen ? 'flex' : 'none';
      if (bubbleBtn) {
        bubbleBtn.style.display = isOpen ? 'none' : 'flex';
      }
      if (isOpen) {
        setTimeout(() => inputEl && inputEl.focus(), 150);
        scrollToBottom();
      }
    };

    toggleBtn.addEventListener('click', toggleOpen);
    if (bubbleBtn) bubbleBtn.addEventListener('click', toggleOpen);
    if (closeBtn) closeBtn.addEventListener('click', toggleOpen);

    // Quick chips
    document.querySelectorAll('.iknow-ai-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (prompt) {
          sendMessage(prompt);
        }
      });
    });

    // Send action
    const handleSend = () => {
      if (!inputEl) return;
      const val = inputEl.value.trim();
      if (!val || isSending) return;
      inputEl.value = '';
      sendMessage(val);
    };

    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (inputEl) {
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSend();
        }
      });
    }
  }

  function scrollToBottom() {
    const bodyEl = document.getElementById('iknow-ai-msg-body');
    if (bodyEl) {
      bodyEl.scrollTop = bodyEl.scrollHeight;
    }
  }

  function appendUserMessage(text) {
    const container = document.getElementById('iknow-ai-dynamic-msgs');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'iknow-ai-msg-row user';
    row.innerHTML = `
      <div class="iknow-ai-msg-bubble">
        ${formatMarkdown(text)}
      </div>
    `;
    container.appendChild(row);
    scrollToBottom();
  }

  function showTypingIndicator() {
    const container = document.getElementById('iknow-ai-dynamic-msgs');
    if (!container) return null;

    const row = document.createElement('div');
    row.id = 'iknow-ai-typing-row';
    row.className = 'iknow-ai-msg-row bot';
    row.innerHTML = `
      <div class="iknow-ai-msg-avatar">
        <img src="${avatarUrl}" alt="Avatar" />
      </div>
      <div class="iknow-ai-msg-bubble iknow-ai-typing">
        <span class="iknow-ai-typing-dot"></span>
        <span class="iknow-ai-typing-dot"></span>
        <span class="iknow-ai-typing-dot"></span>
      </div>
    `;
    container.appendChild(row);
    scrollToBottom();
    return row;
  }

  function removeTypingIndicator() {
    const el = document.getElementById('iknow-ai-typing-row');
    if (el) el.remove();
  }

  function appendBotMessage(replyData) {
    const container = document.getElementById('iknow-ai-dynamic-msgs');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'iknow-ai-msg-row bot';

    let actionBtnHtml = '';
    if (replyData.actions && replyData.actions.length > 0) {
      replyData.actions.forEach(act => {
        actionBtnHtml += `
          <div>
            <button class="iknow-ai-action-btn" data-action="${act.action}" data-target="${act.target}">
              <span>🚀</span> ${act.label}
            </button>
          </div>
        `;
      });
    }

    let suggestionsHtml = '';
    if (replyData.suggestions && replyData.suggestions.length > 0) {
      suggestionsHtml = '<div class="iknow-ai-chips-wrap" style="justify-content: flex-start; margin-top: 8px;">';
      replyData.suggestions.forEach(s => {
        suggestionsHtml += `<div class="iknow-ai-chip dynamic-chip" data-prompt="${s}">${s}</div>`;
      });
      suggestionsHtml += '</div>';
    }

    row.innerHTML = `
      <div class="iknow-ai-msg-avatar">
        <img src="${avatarUrl}" alt="Avatar" />
      </div>
      <div class="iknow-ai-msg-bubble">
        ${formatMarkdown(replyData.reply || '')}
        ${actionBtnHtml}
        ${suggestionsHtml}
      </div>
    `;

    // Bind action button clicks
    row.querySelectorAll('.iknow-ai-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const actionType = btn.getAttribute('data-action');
        const target = btn.getAttribute('data-target');
        if (actionType === 'open_url' || (target && target.startsWith('http'))) {
          window.open(target, '_blank');
        } else {
          handleNavigate(target);
        }
      });
    });

    // Bind suggestion chip clicks
    row.querySelectorAll('.dynamic-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (prompt) sendMessage(prompt);
      });
    });

    container.appendChild(row);
    scrollToBottom();
  }

  // Navigation dispatcher
  function handleNavigate(target) {
    if (!target) return;

    const navTextMap = {
      'home': ['Laman Utama', 'Home'],
      'dashboard': ['Modul Sistem', 'Dashboard'],
      'server-manager': ['Pelayan', 'Server'],
      'servers': ['Pelayan', 'Server'],
      'reminder': ['Peringatan', 'Reminder'],
      'mirth-viewer': ['Mirth Viewer', 'Mirth'],
      'mirth': ['Mirth Viewer', 'Mirth'],
      'notes-manager': ['Papan Nota', 'Notes'],
      'notes': ['Papan Nota', 'Notes'],
      'finance-procurement': ['Perolehan', 'Kewangan', 'Procurement'],
      'procurement': ['Perolehan', 'Kewangan', 'Procurement'],
      'staff': ['Direktori Staf', 'Staf', 'Staff']
    };

    const searchKeywords = navTextMap[target] || [target];
    const navButtons = document.querySelectorAll('nav button, .navbar button, header button');
    let clicked = false;

    for (const btn of navButtons) {
      const text = btn.innerText || btn.textContent || '';
      for (const kw of searchKeywords) {
        if (text.toLowerCase().includes(kw.toLowerCase())) {
          btn.click();
          clicked = true;
          break;
        }
      }
      if (clicked) break;
    }

    if (clicked && target === 'reminder') {
      setTimeout(() => {
        const allButtons = Array.from(document.querySelectorAll('button'));
        const addBtn = allButtons.find(b => {
          const t = (b.innerText || b.textContent || '').trim();
          return t.includes('Tambah Peringatan') || t.includes('Peringatan Baharu') || t.includes('+ Peringatan');
        });
        if (addBtn) addBtn.click();
      }, 350);
    }

    if (window.innerWidth < 640) {
      const chatWindow = document.getElementById('iknow-ai-chat-window');
      if (chatWindow) chatWindow.style.display = 'none';
      isOpen = false;
    }
  }

  async function sendMessage(text) {
    if (!text) return;
    isSending = true;
    appendUserMessage(text);
    showTypingIndicator();

    const sendBtn = document.getElementById('iknow-ai-send-btn');
    if (sendBtn) sendBtn.disabled = true;

    try {
      const response = await fetch(getApiBase() + 'chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ message: text })
      });

      const resData = await response.json();
      removeTypingIndicator();

      if (resData && resData.data) {
        appendBotMessage(resData.data);
      } else {
        appendBotMessage({
          reply: 'Maaf, saya tidak dapat memproses maklumat tersebut pada masa ini.'
        });
      }
    } catch (err) {
      console.error('[IKNOW AI Assistant] Ralat:', err);
      removeTypingIndicator();
      appendBotMessage({
        reply: '⚠️ Ralat rangkaian: Tidak dapat menghubungi pelayan AI. Sila pastikan pelayan aktif.'
      });
    } finally {
      isSending = false;
      if (sendBtn) sendBtn.disabled = false;
      const inputEl = document.getElementById('iknow-ai-text-input');
      if (inputEl) inputEl.focus();
    }
  }

  // Mulakan widget secara selamat pada pelbagai fasa DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderFab);
  } else {
    renderFab();
  }

  window.addEventListener('load', renderFab);
  setTimeout(renderFab, 300);
  setTimeout(renderFab, 1000);
})();

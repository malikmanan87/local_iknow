/**
 * iKNOW Smart Code Syntax Highlighter & Formatter
 * Menyokong format SQL, Shell / PowerShell, JSON, dan Log Ralat untuk Papan Nota
 */
(function() {
  'use strict';

  if (window.__IKNOW_SYNTAX_HIGHLIGHT_INITIALIZED__) return;
  window.__IKNOW_SYNTAX_HIGHLIGHT_INITIALIZED__ = true;

  // Inject Styles for Token Highlighting & Code Header
  const style = document.createElement('style');
  style.id = 'iknow-code-highlight-style';
  style.textContent = `
    .iknow-code-wrapper {
      position: relative;
      margin-bottom: 0.85rem;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: #090d16;
    }
    .iknow-code-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.35rem 0.75rem;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 0.72rem;
      user-select: none;
    }
    .iknow-code-lang-tag {
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.68rem;
    }
    .lang-sql { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.3); }
    .lang-bash { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .lang-json { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .lang-log { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .lang-text { background: rgba(255, 255, 255, 0.08); color: #94a3b8; }

    .iknow-code-copy-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 600;
      transition: all 0.15s ease;
    }
    .iknow-code-copy-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #f1f5f9;
    }
    .iknow-code-copy-btn.copied {
      color: #34d399;
    }

    .iknow-code-pre {
      margin: 0;
      padding: 0.85rem;
      font-family: Consolas, "Fira Code", "Courier New", monospace;
      font-size: 0.86rem;
      line-height: 1.55;
      color: #f1f5f9;
      white-space: pre-wrap;
      word-break: break-word;
      overflow-x: auto;
    }

    /* Syntax Tokens */
    .token-kw { color: #818cf8; font-weight: 700; }            /* Keyword (SQL / Bash) */
    .token-str { color: #34d399; }                             /* Strings */
    .token-num { color: #fbbf24; }                             /* Numbers */
    .token-comment { color: #64748b; font-style: italic; }     /* Comments */
    .token-fn { color: #38bdf8; font-weight: 600; }           /* Functions */
    .token-var { color: #fb923c; }                             /* Variables */
    .token-prop { color: #93c5fd; }                            /* JSON property keys */
    
    /* Log Badges */
    .token-log-err { background: rgba(239, 68, 68, 0.25); color: #f87171; padding: 0.1rem 0.35rem; border-radius: 4px; font-weight: 700; border: 1px solid rgba(239, 68, 68, 0.4); }
    .token-log-warn { background: rgba(245, 158, 11, 0.25); color: #fbbf24; padding: 0.1rem 0.35rem; border-radius: 4px; font-weight: 700; border: 1px solid rgba(245, 158, 11, 0.4); }
    .token-log-info { background: rgba(59, 130, 246, 0.25); color: #60a5fa; padding: 0.1rem 0.35rem; border-radius: 4px; font-weight: 700; border: 1px solid rgba(59, 130, 246, 0.4); }
    .token-timestamp { color: #94a3b8; font-size: 0.8em; }
  `;
  document.head.appendChild(style);

  // Helper untuk escape HTML
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Pengesan Bahasa Automatik
  function detectLanguage(code, category) {
    if (!code) return 'text';
    const trimmed = code.trim();
    const cat = (category || '').toLowerCase();

    if (cat.includes('sql') || cat.includes('query')) return 'sql';

    // JSON check
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch (e) {
        // Bukan JSON sah tapi mungkin serpihan
        if (/"[a-zA-Z0-9_-]+"\s*:/.test(trimmed)) return 'json';
      }
    }

    // SQL check
    const sqlKeywordsRegex = /\b(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|DROP\s+TABLE|ALTER\s+TABLE|JOIN|LEFT\s+JOIN|INNER\s+JOIN|WHERE|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT)\b/i;
    if (sqlKeywordsRegex.test(trimmed)) return 'sql';

    // Log check
    if (/\[?(ERROR|FATAL|SEVERE|WARN|WARNING|INFO|DEBUG)\]?|Exception:|Traceback|ORA-\d{5}/i.test(trimmed)) {
      return 'log';
    }

    // Bash / PowerShell check
    if (/^(#!\/bin\/(bash|sh)|Get-Service|Restart-Service|sudo |systemctl |curl |docker |git |npm |pip )/m.test(trimmed) || /\$[a-zA-Z_][a-zA-Z0-9_]*/.test(trimmed)) {
      return 'bash';
    }

    return 'text';
  }

  // SQL Syntax Highlighter
  function highlightSQL(code) {
    let escaped = escapeHTML(code);

    // Comments (-- comment)
    escaped = escaped.replace(/(--.*$)/gm, '<span class="token-comment">$1</span>');
    // Multi-line comments (/* ... */)
    escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token-comment">$1</span>');

    // Strings ('string' or "string")
    escaped = escaped.replace(/('(?:''|[^'\\]|\\.)*')/g, '<span class="token-str">$1</span>');

    // SQL Keywords
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
      'IS NULL', 'IS NOT NULL', 'AS', 'DISTINCT', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
      'INNER JOIN', 'OUTER JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT',
      'OFFSET', 'UNION', 'ALL', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
      'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE', 'ADD', 'MODIFY', 'PRIMARY KEY',
      'FOREIGN KEY', 'REFERENCES', 'AUTO_INCREMENT', 'DEFAULT', 'CASCADE', 'LOCK TABLES',
      'UNLOCK TABLES', 'WRITE', 'READ', 'SHOW', 'DESCRIBE', 'USE', 'DATABASE', 'TABLE'
    ];
    const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
    escaped = escaped.replace(kwRegex, (match) => `<span class="token-kw">${match.toUpperCase()}</span>`);

    // Functions
    const funcs = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'CONCAT', 'NOW', 'DATE', 'YEAR', 'MONTH', 'DAY', 'IFNULL', 'SUBSTRING'];
    const fnRegex = new RegExp(`\\b(${funcs.join('|')})(?=\\s*\\()`, 'gi');
    escaped = escaped.replace(fnRegex, (match) => `<span class="token-fn">${match.toUpperCase()}</span>`);

    // Numbers
    escaped = escaped.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="token-num">$1</span>');

    return escaped;
  }

  // JSON Syntax Highlighter
  function highlightJSON(code) {
    let escaped = escapeHTML(code);
    // Keys ("key":)
    escaped = escaped.replace(/(&quot;[a-zA-Z0-9_$-]+&quot;)(\s*:)/g, '<span class="token-prop">$1</span>$2');
    // Strings
    escaped = escaped.replace(/:\s*(&quot;.*?&quot;)/g, ': <span class="token-str">$1</span>');
    // Booleans and null
    escaped = escaped.replace(/\b(true|false|null)\b/g, '<span class="token-kw">$1</span>');
    // Numbers
    escaped = escaped.replace(/:\s*(-?\d+(\.\d+)?([eE][+-]?\d+)?)/g, ': <span class="token-num">$1</span>');
    return escaped;
  }

  // Shell / Bash / PowerShell Syntax Highlighter
  function highlightBash(code) {
    let escaped = escapeHTML(code);
    // Comments
    escaped = escaped.replace(/(#.*$)/gm, '<span class="token-comment">$1</span>');
    // Double-quoted strings
    escaped = escaped.replace(/(&quot;.*?&quot;)/g, '<span class="token-str">$1</span>');
    // Single-quoted strings
    escaped = escaped.replace(/('(?:''|[^'\\]|\\.)*')/g, '<span class="token-str">$1</span>');
    // Variables ($var, $1)
    escaped = escaped.replace(/(\$[a-zA-Z0-9_?]+|\$\{[a-zA-Z0-9_]+\})/g, '<span class="token-var">$1</span>');
    // Commands
    const commands = ['curl', 'sudo', 'systemctl', 'docker', 'docker-compose', 'git', 'npm', 'php', 'chmod', 'chown', 'rm', 'mkdir', 'cd', 'ls', 'cat', 'grep', 'Get-Service', 'Restart-Service', 'Start-Service', 'Stop-Service'];
    const cmdRegex = new RegExp(`\\b(${commands.join('|')})\\b`, 'g');
    escaped = escaped.replace(cmdRegex, '<span class="token-kw">$1</span>');
    // Flags (-f, --force)
    escaped = escaped.replace(/\s(--?[a-zA-Z0-9_-]+)/g, ' <span class="token-fn">$1</span>');
    return escaped;
  }

  // Log Ralat Highlighter
  function highlightLog(code) {
    let escaped = escapeHTML(code);
    // Error levels
    escaped = escaped.replace(/\[?(ERROR|FATAL|SEVERE)\]?/gi, '<span class="token-log-err">[$1]</span>');
    escaped = escaped.replace(/\[?(WARN|WARNING)\]?/gi, '<span class="token-log-warn">[$1]</span>');
    escaped = escaped.replace(/\[?(INFO|NOTICE)\]?/gi, '<span class="token-log-info">[$1]</span>');
    // Exceptions
    escaped = escaped.replace(/([a-zA-Z0-9_.]+Exception:)/g, '<span class="token-log-err" style="background:none; border:none; padding:0;">$1</span>');
    // Timestamps
    escaped = escaped.replace(/(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?)/g, '<span class="token-timestamp">$1</span>');
    return escaped;
  }

  // Utama: Formatkan kod mengikut bahasa
  function formatCode(rawCode, category) {
    const lang = detectLanguage(rawCode, category);
    let html = '';

    switch(lang) {
      case 'sql':
        html = highlightSQL(rawCode);
        break;
      case 'json':
        html = highlightJSON(rawCode);
        break;
      case 'bash':
        html = highlightBash(rawCode);
        break;
      case 'log':
        html = highlightLog(rawCode);
        break;
      default:
        html = escapeHTML(rawCode);
    }

    const langLabels = {
      sql: 'SQL Query',
      bash: 'Shell / PS',
      json: 'JSON',
      log: 'Log Ralat',
      text: 'Teks'
    };

    return {
      lang,
      label: langLabels[lang] || 'Kod',
      html
    };
  }

  // Cari kotak nota dalam DOM dan gantikan dengan code-wrapper
  function applySyntaxHighlighting() {
    // Cari semua elemen kotak nota dalam kad-kad Papan Nota
    const noteCards = document.querySelectorAll('.glass-card');
    noteCards.forEach(card => {
      // Pastikan bukan sudah diproses
      if (card.dataset.syntaxHighlighted === 'true') return;

      // Cari kategori
      const catBadge = card.querySelector('span[style*="font-size: 0.72rem"]');
      const category = catBadge ? catBadge.textContent.trim() : '';

      // Cari kotak teks nota (fontFamily Consolas)
      const contentBoxes = card.querySelectorAll('div[style*="Consolas"]');
      contentBoxes.forEach(box => {
        const rawContent = box.textContent;
        if (!rawContent || rawContent.length < 5) return;

        const res = formatCode(rawContent, category);
        if (res.lang === 'text' && rawContent.length < 50) return; // Biarkan teks pendek biasa

        // Tandakan sudah siap
        card.dataset.syntaxHighlighted = 'true';

        // Bina wrapper kemas
        const wrapper = document.createElement('div');
        wrapper.className = 'iknow-code-wrapper';

        const header = document.createElement('div');
        header.className = 'iknow-code-header';
        header.innerHTML = `
          <span class="iknow-code-lang-tag lang-${res.lang}">${res.label}</span>
          <button class="iknow-code-copy-btn" title="Salin kod ini">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
            <span>Salin</span>
          </button>
        `;

        const copyBtn = header.querySelector('.iknow-code-copy-btn');
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(rawContent).then(() => {
            copyBtn.classList.add('copied');
            copyBtn.querySelector('span').textContent = 'Tersalin!';
            setTimeout(() => {
              copyBtn.classList.remove('copied');
              copyBtn.querySelector('span').textContent = 'Salin';
            }, 2000);
          });
        });

        // Kekalkan styles asal (height expand dll)
        const pre = document.createElement('div');
        pre.className = 'iknow-code-pre';
        pre.innerHTML = res.html;

        // Pindahkan inline styles seperti maxHeight dari box asal
        if (box.style.maxHeight) pre.style.maxHeight = box.style.maxHeight;
        if (box.style.overflow) pre.style.overflow = box.style.overflow;

        wrapper.appendChild(header);
        wrapper.appendChild(pre);

        box.parentNode.replaceChild(wrapper, box);
      });
    });
  }

  // Jalankan segera dan pantau DOM
  applySyntaxHighlighting();
  const observer = new MutationObserver(() => {
    applySyntaxHighlighting();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.iKnowHighlightCode = formatCode;
})();

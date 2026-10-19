/**
 * iKNOW Syntax Highlighting Utilities
 * Support for SQL, Bash/PS, JSON, and Log error highlighting
 */

export function detectCodeLanguage(code, category = '') {
  if (!code) return 'text';
  const trimmed = code.trim();
  const cat = (category || '').toLowerCase();

  if (cat.includes('sql') || cat.includes('query')) return 'sql';

  // JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      if (/"[a-zA-Z0-9_-]+"\s*:/.test(trimmed)) return 'json';
    }
  }

  // SQL
  const sqlKeywords = /\b(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|DROP\s+TABLE|ALTER\s+TABLE|JOIN|LEFT\s+JOIN|INNER\s+JOIN|WHERE|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT)\b/i;
  if (sqlKeywords.test(trimmed)) return 'sql';

  // Log
  if (/\[?(ERROR|FATAL|SEVERE|WARN|WARNING|INFO|DEBUG)\]?|Exception:|Traceback|ORA-\d{5}/i.test(trimmed)) {
    return 'log';
  }

  // Bash / PowerShell
  if (/^(#!\/bin\/(bash|sh)|Get-Service|Restart-Service|sudo |systemctl |curl |docker |git |npm |pip )/m.test(trimmed) || /\$[a-zA-Z_][a-zA-Z0-9_]*/.test(trimmed)) {
    return 'bash';
  }

  return 'text';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function highlightCode(code, category = '') {
  const lang = detectCodeLanguage(code, category);
  let escaped = escapeHtml(code);

  if (lang === 'sql') {
    // Comments
    escaped = escaped.replace(/(--.*$)/gm, '<span class="token-comment">$1</span>');
    escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token-comment">$1</span>');
    // Strings
    escaped = escaped.replace(/('(?:''|[^'\\]|\\.)*')/g, '<span class="token-str">$1</span>');
    // Keywords
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
    escaped = escaped.replace(kwRegex, (m) => `<span class="token-kw">${m.toUpperCase()}</span>`);
    // Functions
    const funcs = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'CONCAT', 'NOW', 'DATE', 'YEAR', 'MONTH', 'DAY', 'IFNULL', 'SUBSTRING'];
    const fnRegex = new RegExp(`\\b(${funcs.join('|')})(?=\\s*\\()`, 'gi');
    escaped = escaped.replace(fnRegex, (m) => `<span class="token-fn">${m.toUpperCase()}</span>`);
    // Numbers
    escaped = escaped.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="token-num">$1</span>');
  } else if (lang === 'json') {
    escaped = escaped.replace(/(&quot;[a-zA-Z0-9_$-]+&quot;)(\s*:)/g, '<span class="token-prop">$1</span>$2');
    escaped = escaped.replace(/:\s*(&quot;.*?&quot;)/g, ': <span class="token-str">$1</span>');
    escaped = escaped.replace(/\b(true|false|null)\b/g, '<span class="token-kw">$1</span>');
    escaped = escaped.replace(/:\s*(-?\d+(\.\d+)?([eE][+-]?\d+)?)/g, ': <span class="token-num">$1</span>');
  } else if (lang === 'bash') {
    escaped = escaped.replace(/(#.*$)/gm, '<span class="token-comment">$1</span>');
    escaped = escaped.replace(/(&quot;.*?&quot;)/g, '<span class="token-str">$1</span>');
    escaped = escaped.replace(/('(?:''|[^'\\]|\\.)*')/g, '<span class="token-str">$1</span>');
    escaped = escaped.replace(/(\$[a-zA-Z0-9_?]+|\$\{[a-zA-Z0-9_]+\})/g, '<span class="token-var">$1</span>');
    const commands = ['curl', 'sudo', 'systemctl', 'docker', 'docker-compose', 'git', 'npm', 'php', 'chmod', 'chown', 'rm', 'mkdir', 'cd', 'ls', 'cat', 'grep', 'Get-Service', 'Restart-Service', 'Start-Service', 'Stop-Service'];
    const cmdRegex = new RegExp(`\\b(${commands.join('|')})\\b`, 'g');
    escaped = escaped.replace(cmdRegex, '<span class="token-kw">$1</span>');
    escaped = escaped.replace(/\s(--?[a-zA-Z0-9_-]+)/g, ' <span class="token-fn">$1</span>');
  } else if (lang === 'log') {
    escaped = escaped.replace(/\[?(ERROR|FATAL|SEVERE)\]?/gi, '<span class="token-log-err">[$1]</span>');
    escaped = escaped.replace(/\[?(WARN|WARNING)\]?/gi, '<span class="token-log-warn">[$1]</span>');
    escaped = escaped.replace(/\[?(INFO|NOTICE)\]?/gi, '<span class="token-log-info">[$1]</span>');
    escaped = escaped.replace(/([a-zA-Z0-9_.]+Exception:)/g, '<span class="token-log-err" style="background:none; border:none; padding:0;">$1</span>');
    escaped = escaped.replace(/(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?)/g, '<span class="token-timestamp">$1</span>');
  }

  const labels = {
    sql: 'SQL Query',
    bash: 'Shell / PS',
    json: 'JSON',
    log: 'Log Ralat',
    text: 'Teks'
  };

  return {
    lang,
    label: labels[lang] || 'Teks',
    html: escaped
  };
}

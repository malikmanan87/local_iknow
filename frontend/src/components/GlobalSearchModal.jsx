import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, AlertTriangle, StickyNote, Landmark, Users, Database, Sparkles, ArrowRight, CornerDownLeft } from 'lucide-react';
import axios from 'axios';

export default function GlobalSearchModal({ isOpen, onClose, onSelectTab, onSelectModule }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCategory('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const SHORTCUTS = [
    {
      id: 'sc-1',
      type: 'shortcut',
      category: 'shortcuts',
      title: 'Papan Pemuka Modul Sistem',
      sub: 'Kembali ke senarai dokumentasi modul, carta alir & SOP',
      badge: 'Navigasi',
      icon: <BookOpen size={16} />,
      color: '#6366f1',
      action: () => { onSelectTab('dashboard'); onClose(); }
    },
    {
      id: 'sc-2',
      type: 'shortcut',
      category: 'shortcuts',
      title: 'Direktori Staf UniSZA',
      sub: 'Carian pegawai PIC sistem, emel, dan nombor sambungan',
      badge: 'Navigasi',
      icon: <Users size={16} />,
      color: '#10b981',
      action: () => { onSelectTab('staff'); onClose(); }
    },
    {
      id: 'sc-3',
      type: 'shortcut',
      category: 'shortcuts',
      title: 'Papan Nota Pantas (Notes & Snippets)',
      sub: 'Simpanan catatan kerja, arahan skrip, dan query SQL',
      badge: 'Navigasi',
      icon: <StickyNote size={16} />,
      color: '#f59e0b',
      action: () => { onSelectTab('notes'); onClose(); }
    },
    {
      id: 'sc-4',
      type: 'shortcut',
      category: 'shortcuts',
      title: 'Modul Kewangan & Perolehan',
      sub: 'Rujukan tatacara penilaian tender, SOP perolehan ICT & templat',
      badge: 'Navigasi',
      icon: <Landmark size={16} />,
      color: '#a855f7',
      action: () => { onSelectTab('procurement'); onClose(); }
    },
    {
      id: 'sc-5',
      type: 'shortcut',
      category: 'shortcuts',
      title: 'Pemantau Integrasi Mirth Connect HL7',
      sub: 'Status integrasi saluran, statistik mesej, dan sambungan',
      badge: 'Navigasi',
      icon: <Sparkles size={16} />,
      color: '#06b6d4',
      action: () => { onSelectTab('mirth'); onClose(); }
    }
  ];

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      let items = SHORTCUTS;
      if (category !== 'all') {
        items = items.filter(i => i.category === category);
      }
      setResults(items);
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const origin = window.location.origin;
        const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        const res = await axios.get(`${origin}${path}api/search?q=${encodeURIComponent(query.trim())}`);
        const data = res.data;

        const combined = [];

        // Modules
        (data.modules || []).forEach(m => {
          combined.push({
            id: `mod-${m.id}`,
            category: 'modules',
            title: m.title,
            sub: `${m.code ? '[' + m.code + '] ' : ''}${m.category || 'Modul Sistem'} — ${m.description || ''}`,
            badge: 'Modul',
            icon: <BookOpen size={16} />,
            color: '#6366f1',
            action: () => {
              if (onSelectModule) onSelectModule(m.id);
              else onSelectTab('dashboard');
              onClose();
            }
          });
        });

        // Issues
        (data.issues || []).forEach(i => {
          combined.push({
            id: `iss-${i.id}`,
            category: 'issues',
            title: i.title,
            sub: `${i.issue_code ? '[' + i.issue_code + '] ' : ''}${i.symptoms || i.module_title || ''}`,
            badge: 'Troubleshooting',
            icon: <AlertTriangle size={16} />,
            color: '#ef4444',
            action: () => {
              if (onSelectModule && i.module_id) onSelectModule(i.module_id, 'issues');
              else onSelectTab('dashboard');
              onClose();
            }
          });
        });

        // Notes
        (data.notes || []).forEach(n => {
          combined.push({
            id: `note-${n.id}`,
            category: 'notes',
            title: n.title,
            sub: `${n.category ? '[' + n.category + '] ' : ''}${n.content.substring(0, 100).replace(/\n/g, ' ')}...`,
            badge: 'Nota & SQL',
            icon: <StickyNote size={16} />,
            color: '#f59e0b',
            action: () => {
              if (navigator.clipboard) navigator.clipboard.writeText(n.content);
              onSelectTab('notes');
              onClose();
            }
          });
        });

        // Procurement
        (data.procurement || []).forEach(p => {
          combined.push({
            id: `proc-${p.id}`,
            category: 'procurement',
            title: p.title,
            sub: `${p.reference_no ? '[' + p.reference_no + '] ' : ''}${p.category} — ${p.description || ''}`,
            badge: 'Kewangan',
            icon: <Landmark size={16} />,
            color: '#a855f7',
            action: () => {
              onSelectTab('procurement');
              onClose();
            }
          });
        });

        // Contacts
        (data.contacts || []).forEach(c => {
          combined.push({
            id: `contact-${c.id}`,
            category: 'shortcuts',
            title: c.name,
            sub: `${c.role || 'PIC'} — ${c.email || ''} ${c.phone_no ? '(' + c.phone_no + ')' : ''}`,
            badge: 'PIC Staf',
            icon: <Users size={16} />,
            color: '#10b981',
            action: () => {
              onSelectTab('staff');
              onClose();
            }
          });
        });

        let filtered = combined;
        if (category !== 'all') {
          filtered = combined.filter(it => it.category === category);
        }

        setResults(filtered);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Omnibar search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, category]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex] && typeof results[selectedIndex].action === 'function') {
        results[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="iknow-omnibar-backdrop active" 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="iknow-omnibar-modal" onKeyDown={handleKeyDown}>
        <div className="iknow-omnibar-header">
          <div className="iknow-omnibar-icon">
            <Search size={20} />
          </div>
          <input
            ref={inputRef}
            className="iknow-omnibar-input"
            type="text"
            placeholder="Cari modul, isu ralat, skrip SQL, SOP kewangan, staf... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
          />
          <button className="iknow-omnibar-esc" onClick={onClose}>ESC</button>
        </div>

        <div className="iknow-omnibar-categories">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'modules', label: 'Modul Sistem' },
            { id: 'issues', label: 'Isu & Ralat' },
            { id: 'notes', label: 'Papan Nota & SQL' },
            { id: 'procurement', label: 'Kewangan & SOP' },
            { id: 'shortcuts', label: 'Pintasan Pantas' }
          ].map(c => (
            <button
              key={c.id}
              className={`iknow-omnibar-cat-pill ${category === c.id ? 'active' : ''}`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="iknow-omnibar-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
              Memuatkan padanan carian...
            </div>
          ) : results.length === 0 ? (
            <div className="iknow-omnibar-empty">
              <Search size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#94a3b8' }}>
                Tiada padanan dijumpai untuk "{query}"
              </div>
            </div>
          ) : (
            results.map((item, idx) => (
              <div
                key={item.id}
                className={`iknow-omnibar-item ${idx === selectedIndex ? 'selected' : ''}`}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="iknow-omnibar-item-left">
                  <div className="iknow-omnibar-item-icon" style={{ background: `${item.color}22`, color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="iknow-omnibar-item-text">
                    <div className="iknow-omnibar-item-title">{item.title}</div>
                    <div className="iknow-omnibar-item-sub">{item.sub}</div>
                  </div>
                </div>
                <div className="iknow-omnibar-item-badge" style={{ background: `${item.color}22`, color: item.color }}>
                  {item.badge}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="iknow-omnibar-footer">
          <div className="iknow-omnibar-shortcuts">
            <span><span className="iknow-omnibar-key">↑</span> <span className="iknow-omnibar-key">↓</span> Navigasi</span>
            <span><span className="iknow-omnibar-key">↵</span> Pilih</span>
            <span><span className="iknow-omnibar-key">ESC</span> Tutup</span>
          </div>
          <div>iKNOW Universal Omnibar</div>
        </div>
      </div>
    </div>
  );
}

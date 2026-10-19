import React, { useState, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  StickyNote, 
  Landmark, 
  Users, 
  Activity, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  ArrowRight, 
  RefreshCw,
  FileText,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import axios from 'axios';

export default function Home({ onNavigate, onSelectModule, backupInfo, backingUp, onManualBackup }) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [copiedNoteId, setCopiedNoteId] = useState(null);

  // Debounced search querying the 3 modules: modules, notes, and procurement
  useEffect(() => {
    if (!search || search.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const origin = window.location.origin;
        const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        const res = await axios.get(`${origin}${path}api/search?q=${encodeURIComponent(search.trim())}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error('Home search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [search]);

  const handleCopyNote = (id, content, e) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(content);
      setCopiedNoteId(id);
      setTimeout(() => setCopiedNoteId(null), 2000);
    }
  };

  const isSearching = Boolean(search && search.trim().length >= 2);

  // Filtered results
  const totalResults = searchResults?.total_results || 0;
  const modulesList = searchResults?.modules || [];
  const notesList = searchResults?.notes || [];
  const procList = searchResults?.procurement || [];
  const issuesList = searchResults?.issues || [];

  return (
    <div style={{ padding: '1.25rem 0' }}>
      {/* ── Single Central Glass Panel: Search & Daily DB Backup ── */}
      <div 
        id="iknow-home-search-panel"
        className="glass-panel iknow-home-search-panel" 
        style={{ 
          padding: '2rem 1.5rem', 
          marginBottom: '2rem', 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.16), rgba(245, 158, 11, 0.12), rgba(6, 182, 212, 0.08))',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '20px',
          boxShadow: '0 12px 35px rgba(0,0,0,0.25)'
        }}
      >
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'rgba(99, 102, 241, 0.18)', 
          color: '#a5b4fc', 
          padding: '0.35rem 1rem', 
          borderRadius: '9999px', 
          fontSize: '0.8rem', 
          fontWeight: 700, 
          marginBottom: '0.85rem', 
          border: '1px solid rgba(99, 102, 241, 0.35)' 
        }}>
          <Sparkles size={14} style={{ color: 'var(--accent-amber)' }} />
          IKNOW KNOWLEDGE HUB • PUSAT OPERASI BERSEPADU
        </div>

        <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
          Pusat Carian & Pangkalan Maklumat Sistem
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', maxWidth: '720px', margin: '0 auto 1.5rem auto', lineHeight: '1.55' }}>
          Carian bersepadu merentas <strong>Modul Sistem & Troubleshooting</strong>, <strong>Papan Nota & Skrip Pantas</strong>, serta <strong>Dokumen Kewangan & Tatakelola</strong>.
        </p>

        {/* Global 3-in-1 Search Bar */}
        <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative' }}>
          <Search 
            style={{ 
              position: 'absolute', 
              left: '1.2rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#818cf8' 
            }} 
            size={20} 
          />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Cari modul, isu ralat, skrip SQL, tatacara perolehan, atau dokumen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              paddingLeft: '3.2rem', 
              paddingRight: search ? '3rem' : '1.25rem', 
              paddingTop: '0.85rem', 
              paddingBottom: '0.85rem', 
              fontSize: '1rem', 
              borderRadius: '14px',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              background: 'rgba(10, 15, 29, 0.85)',
              color: '#f8fafc',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              style={{ 
                position: 'absolute', 
                right: '1rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                background: 'none', 
                border: 'none', 
                color: 'var(--text-muted)', 
                cursor: 'pointer', 
                fontSize: '1.2rem' 
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Sandaran Pangkalan Data Harian (Backup DB Strip) */}
        {backupInfo && (
          <div 
            id="iknow-dashboard-backup-card"
            style={{
              marginTop: '1.1rem',
              padding: '0.35rem 0.95rem',
              background: 'rgba(10, 15, 29, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              fontSize: '0.78rem',
              color: 'var(--text-muted)'
            }}
            title={`Sandaran Pangkalan Data Harian (iknow_db_backup):\nKitaran: Setiap 24 Jam (8:00 AM)\nFail: iknow_db_backup/${backupInfo.file_name}\nSeterusnya: ${backupInfo.next_cycle_formatted || '-'}\nDasar Simpanan: ${backupInfo.retention_label || '30 Hari (Pembersihan Automatik)'}`}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: backupInfo.status === 'healthy' ? '#10b981' : '#f59e0b',
              boxShadow: `0 0 8px ${backupInfo.status === 'healthy' ? '#10b981' : '#f59e0b'}`,
              flexShrink: 0
            }} />
            <span>
              Backup DB (8 AM): <strong style={{ color: '#e2e8f0', fontWeight: 600 }}>{backupInfo.last_backup_formatted || '-'}</strong>
              <span style={{ opacity: 0.8, marginLeft: '0.3rem' }}>({backupInfo.file_size || '0 B'})</span>
            </span>
            <span style={{ opacity: 0.35 }}>•</span>
            <button
              onClick={onManualBackup}
              disabled={backingUp}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                cursor: backingUp ? 'not-allowed' : 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '0.1rem 0.4rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                borderRadius: '6px'
              }}
              title="Klik untuk sandar sekarang"
            >
              <RefreshCw size={13} className={backingUp ? 'spin' : ''} />
              {backingUp ? 'Menyandar...' : 'Sandar Sekarang'}
            </button>
          </div>
        )}
      </div>

      {/* ── Jika Sedang Mencari: Papar Hasil Carian Berpusat 3-dalam-1 ── */}
      {isSearching ? (
        <div style={{ marginBottom: '2.5rem' }}>
          {/* Header Bar Hasil Carian & Penapis */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={20} color="#818cf8" />
              Hasil Carian: "{search}" ({totalResults} padanan)
            </h2>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `Semua (${totalResults})` },
                { id: 'modules', label: `Modul (${modulesList.length})` },
                { id: 'notes', label: `Nota (${notesList.length})` },
                { id: 'procurement', label: `Kewangan (${procList.length})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className="btn btn-secondary"
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.78rem',
                    background: activeFilter === f.id ? 'rgba(99, 102, 241, 0.25)' : undefined,
                    borderColor: activeFilter === f.id ? '#818cf8' : undefined,
                    color: activeFilter === f.id ? '#a5b4fc' : undefined
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.75rem auto' }} />
              <div>Mencari padanan dari seluruh pangkalan pengetahuan...</div>
            </div>
          ) : totalResults === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', borderRadius: '16px' }}>
              <Search size={40} style={{ margin: '0 auto 1rem auto', color: 'var(--text-muted)', opacity: 0.4 }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' }}>Tiada Padanan Dijumpai</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Tiada maklumat ditemui bagi kata kunci "{search}". Sila cuba kata kunci lain.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* 1. Bahagian Modul Sistem */}
              {(activeFilter === 'all' || activeFilter === 'modules') && modulesList.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#818cf8', marginBottom: '0.65rem' }}>
                    <BookOpen size={16} /> MODUL SISTEM ({modulesList.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {modulesList.map(m => (
                      <div
                        key={m.id}
                        className="glass-card"
                        onClick={() => onSelectModule(m.id)}
                        style={{ padding: '1rem', borderRadius: '12px', cursor: 'pointer', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.72rem', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                            {m.code || 'MODUL'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.category}</span>
                        </div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.3rem' }}>{m.title}</h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                          {m.description || 'Tiada penerangan'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Bahagian Papan Nota & Skrip */}
              {(activeFilter === 'all' || activeFilter === 'notes') && notesList.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.65rem' }}>
                    <StickyNote size={16} /> PAPAN NOTA & SKRIP ({notesList.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {notesList.map(n => (
                      <div
                        key={n.id}
                        className="glass-card"
                        onClick={() => onNavigate('notes')}
                        style={{ padding: '1rem', borderRadius: '12px', cursor: 'pointer', border: '1px solid rgba(245, 158, 11, 0.25)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-amber)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                            {n.category || 'Nota'}
                          </span>
                          <button
                            onClick={(e) => handleCopyNote(n.id, n.content, e)}
                            className="btn btn-secondary"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            title="Salin skrip ke clipboard"
                          >
                            {copiedNoteId === n.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                            <span>{copiedNoteId === n.id ? 'Tersalin!' : 'Salin'}</span>
                          </button>
                        </div>
                        <h4 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '0.35rem' }}>{n.title}</h4>
                        <div style={{ 
                          background: '#090d16', 
                          padding: '0.55rem', 
                          borderRadius: '8px', 
                          fontFamily: 'monospace', 
                          fontSize: '0.78rem', 
                          color: '#f1f5f9',
                          maxHeight: '75px',
                          overflow: 'hidden',
                          lineHeight: '1.4'
                        }}>
                          {n.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Bahagian Kewangan & Perolehan */}
              {(activeFilter === 'all' || activeFilter === 'procurement') && procList.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', marginBottom: '0.65rem' }}>
                    <Landmark size={16} /> KEWANGAN & PEROLEHAN ({procList.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {procList.map(p => (
                      <div
                        key={p.id}
                        className="glass-card"
                        onClick={() => onNavigate('procurement')}
                        style={{ padding: '1rem', borderRadius: '12px', cursor: 'pointer', border: '1px solid rgba(168, 85, 247, 0.25)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.72rem', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                            {p.reference_no || 'DOKUMEN'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.category}</span>
                        </div>
                        <h4 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '0.3rem' }}>{p.title}</h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                          {p.description || 'Garis panduan dan tatacara rasmi.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  StickyNote, 
  Search, 
  PlusCircle, 
  ClipboardPaste, 
  Copy, 
  Check, 
  Pencil, 
  Trash2, 
  Lock, 
  Unlock, 
  Filter, 
  Calendar, 
  User, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { getNotes, deleteNote, toggleNoteLock } from '../services/api';
import NoteModal from '../components/NoteModal';

export default function NotesManager() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [clipboardInitialText, setClipboardInitialText] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [notification, setNotification] = useState(null);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await getNotes({ search: search.trim(), category: selectedCategory });
      setNotes(res.data || []);
    } catch (err) {
      console.error('Ralat memuat nota:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotes();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const showNotification = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // One-click copy
  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showNotification('Nota berjaya disalin ke papan keratan (clipboard)!', 'success');
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  // Quick paste from clipboard directly opening modal
  const handleQuickPasteNew = async () => {
    let text = '';
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        text = await navigator.clipboard.readText();
      }
    } catch (err) {
      console.warn('Gagal membaca clipboard:', err);
    }
    setEditingNote(null);
    setClipboardInitialText(text || '');
    setModalOpen(true);
  };

  // Toggle lock status
  const handleToggleLock = async (id, currentLocked, title) => {
    try {
      const res = await toggleNoteLock(id);
      showNotification(res.data.message || 'Status kunci berjaya dikemaskini', 'info');
      fetchNotes();
    } catch (err) {
      console.error(err);
      showNotification('Gagal menukar status kunci nota', 'error');
    }
  };

  // Delete note with Lock protection
  const handleDelete = async (note) => {
    if (note.is_locked == 1) {
      alert(`⚠️ NOTA DIKUNCI!\n\nNota "${note.title}" sedang dikunci (Lock) dan tidak boleh dipadam.\n\nSila buka kunci (klik ikon mangga) terlebih dahulu jika anda benar-benar ingin memadamkannya.`);
      return;
    }

    if (window.confirm(`Adakah anda pasti mahu memadam nota "${note.title}"?`)) {
      try {
        await deleteNote(note.id);
        showNotification('Nota berjaya dipadam', 'success');
        fetchNotes();
      } catch (err) {
        const errorMsg = err.response?.data?.messages?.error || err.response?.data?.message || 'Gagal memadam nota';
        alert(errorMsg);
      }
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const baseCategories = ['Semua', 'General', 'SQL Query', 'Others'];
  const dynamicCategories = Array.from(new Set(notes.map(n => n.category).filter(Boolean)));
  const categories = Array.from(new Set([...baseCategories, ...dynamicCategories]));

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 1100,
          background: notification.type === 'error' ? '#e11d48' : '#059669',
          color: '#fff',
          padding: '0.8rem 1.4rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          fontWeight: 600,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '2.5rem', 
          marginBottom: '2rem', 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(99, 102, 241, 0.1))',
          border: '1px solid rgba(245, 158, 11, 0.25)'
        }}
      >
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.6rem', 
          background: 'rgba(245, 158, 11, 0.15)', 
          color: 'var(--accent-amber)', 
          padding: '0.4rem 1.1rem', 
          borderRadius: '9999px', 
          fontSize: '0.85rem', 
          fontWeight: 700, 
          marginBottom: '1rem', 
          border: '1px solid rgba(245, 158, 11, 0.3)' 
        }}>
          <StickyNote size={16} /> PAPAN NOTA & TAMPALAN
        </div>

        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
          Papan Nota Pantas & Salin-Tampal
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto 1.5rem auto', lineHeight: '1.6' }}>
          Simpan catatan, skrip, arahan kerja, atau mesej rujukan pasukan. Dilengkapi butang <strong>Salin & Tampal Pantas</strong> serta <strong>Kunci Perlindungan</strong>.
        </p>

        {/* Global Search Bar */}
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Cari kata kunci dalam nota, tajuk, atau pengarang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              paddingLeft: '3.2rem', 
              paddingRight: search ? '3rem' : '1rem', 
              paddingTop: '0.85rem', 
              paddingBottom: '0.85rem', 
              fontSize: '0.98rem', 
              borderRadius: '12px' 
            }}
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Categories & Quick Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginRight: '0.2rem' }}>
            <Filter size={15} /> Kategori:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn"
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.82rem',
                borderRadius: '9999px',
                background: selectedCategory === cat ? 'linear-gradient(135deg, var(--accent-amber), #d97706)' : 'rgba(255,255,255,0.06)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-main)',
                border: selectedCategory === cat ? 'none' : '1px solid var(--border-color)',
                boxShadow: selectedCategory === cat ? '0 4px 12px rgba(245,158,11,0.3)' : 'none'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Action Buttons: Tampal dari Clipboard & Nota Baru */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={handleQuickPasteNew}
            style={{
              borderColor: 'rgba(245, 158, 11, 0.35)',
              color: 'var(--accent-amber)',
              background: 'rgba(245, 158, 11, 0.1)'
            }}
            title="Tampal teks daripada clipboard pelayar serta-merta"
          >
            <ClipboardPaste size={18} /> Tampal dari Clipboard
          </button>

          <button 
            className="btn btn-primary"
            onClick={() => { setEditingNote(null); setClipboardInitialText(''); setModalOpen(true); }}
            style={{ 
              background: 'linear-gradient(135deg, var(--accent-amber), #d97706)',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
            }}
          >
            <PlusCircle size={18} /> Tambah Nota Baru
          </button>
        </div>
      </div>

      {/* Count & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Menunjukkan <strong style={{ color: 'var(--text-main)' }}>{notes.length}</strong> nota {selectedCategory !== 'Semua' ? `dalam kategori "${selectedCategory}"` : ''}
        </span>
      </div>

      {/* Note Cards List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <StickyNote className="animate-spin" size={32} style={{ margin: '0 auto 1rem auto', opacity: 0.7 }} />
          <p>Memuatkan senarai nota...</p>
        </div>
      ) : notes.length === 0 ? (
        <div 
          className="glass-panel" 
          style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed rgba(255,255,255,0.15)' }}
        >
          <StickyNote size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Tiada Nota Dijumpai
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 1.5rem auto' }}>
            {search ? 'Tiada padanan dengan kata kunci carian anda. Cuba kata kunci lain.' : 'Belum ada nota yang disimpan. Gunakan butang di bawah untuk menampal catatan atau skrip pertama anda.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              className="btn btn-secondary"
              onClick={handleQuickPasteNew}
              style={{ color: 'var(--accent-amber)', borderColor: 'rgba(245,158,11,0.3)' }}
            >
              <ClipboardPaste size={18} /> Tampal dari Clipboard
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => { setEditingNote(null); setClipboardInitialText(''); setModalOpen(true); }}
              style={{ background: 'linear-gradient(135deg, var(--accent-amber), #d97706)' }}
            >
              <PlusCircle size={18} /> Cipta Nota Baru
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {notes.map((note) => {
            const isCopied = copiedId === note.id;
            const isLocked = note.is_locked == 1;
            const isExpanded = expandedIds.has(note.id);
            const lineCount = (note.content.match(/\n/g) || []).length + 1;
            const isLong = lineCount > 6 || note.content.length > 250;

            return (
              <div 
                key={note.id} 
                className="glass-card" 
                style={{ 
                  padding: '1.35rem', 
                  borderRadius: '16px',
                  border: isLocked ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background: isLocked ? 'rgba(30, 36, 51, 0.85)' : 'rgba(22, 30, 49, 0.75)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isLocked ? '0 8px 24px rgba(245, 158, 11, 0.1)' : undefined
                }}
              >
                <div>
                  {/* Top Bar: Category, Lock Badge & Author */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span 
                        style={{ 
                          background: 'rgba(99, 102, 241, 0.15)', 
                          color: '#a5b4fc', 
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px'
                        }}
                      >
                        {note.category || 'Umum'}
                      </span>

                      {/* LOCK BADGE */}
                      {isLocked ? (
                        <span 
                          style={{ 
                            background: 'rgba(245, 158, 11, 0.2)', 
                            color: 'var(--accent-amber)', 
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                          title="Nota ini dikunci dan tidak boleh dipadam."
                        >
                          <Lock size={12} /> Dikunci
                        </span>
                      ) : (
                        <span 
                          style={{ 
                            background: 'rgba(255, 255, 255, 0.05)', 
                            color: 'var(--text-muted)', 
                            border: '1px solid var(--border-color)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <Unlock size={12} /> Terbuka
                        </span>
                      )}
                    </div>

                    {/* Lock Toggle Button */}
                    <button
                      onClick={() => handleToggleLock(note.id, isLocked, note.title)}
                      className="btn"
                      style={{
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.75rem',
                        background: isLocked ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        color: isLocked ? 'var(--accent-amber)' : 'var(--text-muted)',
                        border: isLocked ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-color)',
                        borderRadius: '8px'
                      }}
                      title={isLocked ? 'Klik untuk Buka Kunci (Unlock)' : 'Klik untuk Kunci Nota (Lock dari dipadam)'}
                    >
                      {isLocked ? <Lock size={13} /> : <Unlock size={13} />}
                      <span style={{ marginLeft: '0.2rem' }}>{isLocked ? 'Buka Kunci' : 'Kunci'}</span>
                    </button>
                  </div>

                  {/* Tajuk Nota */}
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                    {note.title}
                  </h3>

                  {/* KOTAK KANDUNGAN NOTA */}
                  <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
                    <div 
                      style={{ 
                        background: '#090d16',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        padding: '0.9rem',
                        fontFamily: 'Consolas, "Fira Code", monospace, sans-serif',
                        fontSize: '0.88rem',
                        lineHeight: '1.55',
                        color: '#f1f5f9',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: !isExpanded && isLong ? '140px' : 'none',
                        overflow: 'hidden'
                      }}
                    >
                      {note.content}
                    </div>

                    {isLong && (
                      <div style={{ textAlign: 'center', marginTop: '0.35rem' }}>
                        <button
                          onClick={() => toggleExpand(note.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-cyan)',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontWeight: 600
                          }}
                        >
                          {isExpanded ? (
                            <>Kecutkan <ChevronUp size={13} /></>
                          ) : (
                            <>Lihat Penuh ({lineCount} baris) <ChevronDown size={13} /></>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Meta Bar: Author & Date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <User size={13} /> {note.author || 'Pengguna'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} /> {new Date(note.created_at).toLocaleDateString('ms-MY', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {/* BUTANG SALIN NOTA (One-Click Copy) */}
                  <button
                    onClick={() => handleCopy(note.id, note.content)}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.45rem 0.9rem',
                      fontSize: '0.82rem',
                      background: isCopied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.12)',
                      borderColor: isCopied ? 'var(--accent-emerald)' : 'rgba(99, 102, 241, 0.3)',
                      color: isCopied ? 'var(--accent-emerald)' : '#a5b4fc',
                      fontWeight: 700
                    }}
                    title="Salin keseluruhan nota ke papan keratan"
                  >
                    {isCopied ? <Check size={15} /> : <Copy size={15} />}
                    {isCopied ? 'Tersalin!' : 'Salin Nota'}
                  </button>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {/* Kemaskini */}
                    <button
                      onClick={() => { setEditingNote(note); setClipboardInitialText(''); setModalOpen(true); }}
                      className="btn btn-secondary"
                      style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
                      title="Sunting nota"
                    >
                      <Pencil size={14} />
                    </button>

                    {/* Padam (DILINDUNGI JIKA LOCK) */}
                    <button
                      onClick={() => handleDelete(note)}
                      className="btn"
                      disabled={isLocked}
                      style={{
                        padding: '0.45rem 0.65rem',
                        fontSize: '0.82rem',
                        background: isLocked ? 'rgba(255, 255, 255, 0.04)' : 'rgba(244, 63, 94, 0.15)',
                        color: isLocked ? 'rgba(255,255,255,0.25)' : 'var(--accent-rose)',
                        border: isLocked ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(244, 63, 94, 0.3)',
                        cursor: isLocked ? 'not-allowed' : 'pointer'
                      }}
                      title={isLocked ? 'Nota ini dikunci dan tidak boleh dipadam (Buka kunci dahulu)' : 'Padam nota'}
                    >
                      {isLocked ? <Lock size={14} /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah / Kemaskini */}
      {modalOpen && (
        <NoteModal
          initialData={editingNote}
          initialClipboardText={clipboardInitialText}
          onClose={() => { setModalOpen(false); setEditingNote(null); setClipboardInitialText(''); }}
          onSuccess={() => {
            fetchNotes();
            showNotification('Nota berjaya disimpan!', 'success');
          }}
        />
      )}
    </div>
  );
}

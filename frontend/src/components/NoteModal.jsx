import React, { useState, useEffect, useRef } from 'react';
import { X, StickyNote, ClipboardPaste, Save, AlertCircle, Lock, Unlock, Tag, FileText, User } from 'lucide-react';
import { createNote, updateNote } from '../services/api';

export default function NoteModal({ initialData, initialClipboardText, onClose, onSuccess }) {
  const isEdit = Boolean(initialData && initialData.id);

  const [title, setTitle] = useState(initialData?.title || '');
  const resolveInitialCategory = () => {
    if (!initialData?.category) return 'General';
    const cat = initialData.category;
    if (cat === 'General' || cat === 'Umum') return 'General';
    if (cat === 'SQL Query' || cat.toLowerCase().includes('sql')) return 'SQL Query';
    if (cat === 'Others') return 'Others';
    return 'Others';
  };

  const [category, setCategory] = useState(resolveInitialCategory());
  const [customCategory, setCustomCategory] = useState(
    initialData?.category && !['General', 'Umum', 'SQL Query', 'Others'].includes(initialData.category)
      ? initialData.category
      : ''
  );
  const [content, setContent] = useState(initialData?.content || initialClipboardText || '');
  const [isLocked, setIsLocked] = useState(Boolean(initialData?.is_locked == 1));
  const [author, setAuthor] = useState(initialData?.author || 'Pengguna iKNOW');

  const [loading, setLoading] = useState(false);
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const [error, setError] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const isInitialRef = useRef(true);
  const autoSaveTimerRef = useRef(null);

  /* ── Restore draft for new notes from localStorage ── */
  useEffect(() => {
    if (!isEdit && !initialClipboardText) {
      try {
        const savedDraft = localStorage.getItem('iknow_new_note_draft');
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.category) setCategory(parsed.category);
          if (parsed.customCategory) setCustomCategory(parsed.customCategory);
          if (parsed.content) setContent(parsed.content);
          if (parsed.author) setAuthor(parsed.author);
          if (typeof parsed.isLocked === 'boolean') setIsLocked(parsed.isLocked);
        }
      } catch (err) {
        console.warn('Gagal membaca draf:', err);
      }
    }
  }, [isEdit, initialClipboardText]);

  /* ── Autosave: Direct to DB if editing, or save draft to localStorage if new note ── */
  useEffect(() => {
    if (isInitialRef.current) {
      isInitialRef.current = false;
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    let finalCategory = category;
    if (category === 'Others') {
      finalCategory = customCategory.trim() ? customCategory.trim() : 'Others';
    }

    if (isEdit && initialData?.id) {
      if (!content.trim()) return;

      setAutoSaveStatus('saving');
      autoSaveTimerRef.current = setTimeout(async () => {
        const payload = {
          title: title.trim() || 'Nota ' + new Date().toLocaleDateString('ms-MY'),
          category: finalCategory || 'General',
          content: content.trim(),
          is_locked: isLocked ? 1 : 0,
          author: author.trim() || 'Pengguna iKNOW'
        };

        try {
          await updateNote(initialData.id, payload);
          setAutoSaveStatus('saved');
          const now = new Date();
          setLastSavedAt(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          if (onSuccess) onSuccess();
          setTimeout(() => {
            setAutoSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
          }, 3500);
        } catch (err) {
          console.error('Autosave nota gagal:', err);
          setAutoSaveStatus('error');
        }
      }, 1200);
    } else if (!isEdit) {
      // Autosave draft to localStorage
      autoSaveTimerRef.current = setTimeout(() => {
        try {
          if (title.trim() || content.trim()) {
            localStorage.setItem('iknow_new_note_draft', JSON.stringify({
              title, category, customCategory, content, author, isLocked
            }));
            setAutoSaveStatus('saved');
            setTimeout(() => {
              setAutoSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
            }, 3000);
          }
        } catch (e) {
          // ignore
        }
      }, 800);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, category, customCategory, content, isLocked, author, isEdit, initialData?.id]);

  const categories = ['General', 'SQL Query', 'Others'];

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          setContent((prev) => (prev ? prev + '\n\n' + text : text));
          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 2000);
        } else {
          setError('Papan keratan (clipboard) anda kosong.');
          setTimeout(() => setError(''), 3000);
        }
      } else {
        setError('Pelayar anda memerlukan kebenaran papan keratan atau guna Ctrl+V untuk menampal.');
        setTimeout(() => setError(''), 4000);
      }
    } catch (err) {
      console.warn('Gagal membaca papan keratan:', err);
      setError('Sila gunakan pintasan Ctrl + V untuk menampal kandungan nota.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setError('');

    if (!content.trim()) {
      setError('Sila masukkan atau tampal kandungan nota.');
      return;
    }

    let finalCategory = category;
    if (category === 'Others') {
      finalCategory = customCategory.trim() ? customCategory.trim() : 'Others';
    }

    const payload = {
      title: title.trim() || 'Nota ' + new Date().toLocaleDateString('ms-MY'),
      category: finalCategory || 'General',
      content: content.trim(),
      is_locked: isLocked ? 1 : 0,
      author: author.trim() || 'Pengguna iKNOW'
    };

    setLoading(true);
    try {
      if (isEdit) {
        await updateNote(initialData.id, payload);
      } else {
        await createNote(payload);
        try {
          localStorage.removeItem('iknow_new_note_draft');
        } catch (e) {
          // ignore
        }
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.messages?.error || err.response?.data?.message || 'Ralat semasa menyimpan nota.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '720px', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.15)', 
              color: 'var(--accent-amber)', 
              padding: '0.6rem', 
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <StickyNote size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {isEdit ? 'Kemaskini Nota' : 'Tampal & Simpan Nota'}
                </h2>

                {/* Autosave Status Badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px',
                  background: autoSaveStatus === 'saving' ? 'rgba(56, 189, 248, 0.12)'
                            : autoSaveStatus === 'saved'  ? 'rgba(16, 185, 129, 0.12)'
                            : autoSaveStatus === 'error'  ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    autoSaveStatus === 'saving' ? 'rgba(56, 189, 248, 0.3)'
                    : autoSaveStatus === 'saved' ? 'rgba(16, 185, 129, 0.3)'
                    : autoSaveStatus === 'error' ? 'rgba(239, 68, 68, 0.4)'
                    : 'var(--border-color)'
                  }`,
                  color: autoSaveStatus === 'saving' ? 'var(--accent-cyan)'
                       : autoSaveStatus === 'saved' ? '#34d399'
                       : autoSaveStatus === 'error' ? '#f87171'
                       : 'var(--text-muted)',
                  transition: 'all 0.3s ease',
                }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: autoSaveStatus === 'saving' ? 'var(--accent-cyan)'
                              : autoSaveStatus === 'saved' ? '#10b981'
                              : autoSaveStatus === 'error' ? '#ef4444'
                              : '#64748b',
                    boxShadow: autoSaveStatus === 'saving' ? '0 0 6px var(--accent-cyan)'
                             : autoSaveStatus === 'saved' ? '0 0 6px #10b981'
                             : 'none',
                  }} />
                  {autoSaveStatus === 'saving' && 'Menyimpan...'}
                  {autoSaveStatus === 'saved' && (isEdit ? `Tersimpan automatik ${lastSavedAt ? `(${lastSavedAt})` : '✓'}` : 'Draf tersimpan')}
                  {autoSaveStatus === 'error' && 'Gagal autosave'}
                  {autoSaveStatus === 'idle' && (isEdit ? (lastSavedAt ? `Tersimpan (${lastSavedAt})` : 'Autosave aktif') : 'Draf automatik')}
                </div>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem', margin: 0 }}>
                {isEdit ? 'Perubahan disimpan ke pangkalan data secara automatik semasa anda menaip.' : 'Tampal catatan pantas, kod/skrip, templat mesej, atau arahan kerja bersama ciri kunci perlindungan.'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
            title="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(244, 63, 94, 0.15)', 
            border: '1px solid rgba(244, 63, 94, 0.3)', 
            borderRadius: '10px', 
            padding: '0.75rem 1rem', 
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: 'var(--accent-rose)',
            fontSize: '0.9rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Tajuk Nota */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={15} color="var(--primary)" />
              Tajuk / Nama Nota (Pilihan)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Skrip Semak Pesakit / Respon Aduan Farmasi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Kategori */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Tag size={15} color="var(--accent-cyan)" />
                Kategori
              </label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="General">General (Default)</option>
                <option value="SQL Query">SQL Query</option>
                <option value="Others">Others</option>
              </select>

              {category === 'Others' && (
                <div style={{ marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nyatakan kategori (pilihan)..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                  />
                </div>
              )}
            </div>

            {/* Nama Pengarang */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={15} color="var(--accent-emerald)" />
                Nama / Pegawai
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Pegawai IT / Helpdesk"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
          </div>

          {/* Kotak Kandungan Nota dengan Butang Tampal */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Kandungan Nota / Kod <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>

              {/* BUTANG TAMPAL DARI CLIPBOARD */}
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="btn btn-secondary"
                style={{
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: pasteSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                  borderColor: pasteSuccess ? 'var(--accent-emerald)' : 'rgba(99, 102, 241, 0.3)',
                  color: pasteSuccess ? 'var(--accent-emerald)' : '#a5b4fc'
                }}
              >
                <ClipboardPaste size={14} />
                {pasteSuccess ? 'Berjaya Ditampal!' : 'Tampal dari Clipboard'}
              </button>
            </div>

            <textarea
              className="form-textarea"
              rows={10}
              placeholder="Tampal teks, skrip SQL, log ralat, peringatan atau templat balasan anda di sini..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              style={{
                fontFamily: 'Consolas, "Fira Code", monospace, sans-serif',
                fontSize: '0.9rem',
                lineHeight: '1.55',
                background: '#0a0e17',
                borderColor: 'rgba(255, 255, 255, 0.12)',
                color: '#f8fafc'
              }}
            />
          </div>

          {/* FUNGSI LOCK / KUNCI NOTA */}
          <div 
            style={{ 
              background: isLocked ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${isLocked ? 'rgba(245, 158, 11, 0.35)' : 'var(--border-color)'}`,
              borderRadius: '12px',
              padding: '0.9rem 1.1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                color: isLocked ? 'var(--accent-amber)' : 'var(--text-muted)',
                background: isLocked ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                padding: '0.5rem',
                borderRadius: '8px'
              }}>
                {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.92rem', color: isLocked ? 'var(--accent-amber)' : 'var(--text-main)' }}>
                  {isLocked ? 'Nota Ini Dikunci (Lock)' : 'Nota Ini Tidak Dikunci'}
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {isLocked 
                    ? '🔒 Nota ini dilindungi dan TIDAK BOLEH dipadam selagi status kunci aktif.' 
                    : 'Nota biasa boleh dipadam oleh mana-mana pengguna.'}
                </span>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isLocked}
                onChange={(e) => setIsLocked(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-amber)' }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isLocked ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                Kunci Nota
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              {isEdit ? 'Tutup' : 'Batal'}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ 
                minWidth: '150px', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--accent-amber), #d97706)',
                color: '#fff'
              }}
            >
              {loading ? (
                'Menyimpan...'
              ) : (
                <>
                  <Save size={16} />
                  {isEdit ? 'Simpan & Tutup' : 'Simpan Nota'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

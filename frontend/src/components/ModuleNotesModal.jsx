import React, { useState, useEffect, useRef } from 'react';
import { FileText, X, Save, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { updateModule } from '../services/api';

export default function ModuleNotesModal({ module, onClose, onSaved }) {
  const [notes, setNotes] = useState(module.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const isInitialRef = useRef(true);
  const autoSaveTimerRef = useRef(null);

  /* ── Debounced Autosave as user types ── */
  useEffect(() => {
    if (isInitialRef.current) {
      isInitialRef.current = false;
      return;
    }

    setAutoSaveStatus('saving');
    setError('');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await updateModule(module.id, { notes });
        setAutoSaveStatus('saved');
        const now = new Date();
        setLastSavedAt(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        if (onSaved) onSaved();
        setTimeout(() => {
          setAutoSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
        }, 3500);
      } catch (err) {
        console.error('Autosave notes failed:', err);
        setAutoSaveStatus('error');
        setError(err.response?.data?.message || 'Gagal autosave nota modul');
      }
    }, 1000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [notes, module.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setSaving(true);
    setError('');
    try {
      await updateModule(module.id, { notes });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan nota modul');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
              <FileText size={20} color="var(--accent-cyan)" /> Nota & Catatan Modul: {module.title}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Setiap catatan disimpan secara automatik semasa anda menaip.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.3rem' }} title="Tutup">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', color: '#ef4444', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Isi Nota / Catatan Modul</label>
              
              {/* Autosave badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.72rem',
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
                {autoSaveStatus === 'saved' && `Tersimpan automatik ${lastSavedAt ? `(${lastSavedAt})` : '✓'}`}
                {autoSaveStatus === 'error' && 'Gagal autosave'}
                {autoSaveStatus === 'idle' && (lastSavedAt ? `Tersimpan (${lastSavedAt})` : 'Autosave aktif')}
              </div>
            </div>

            <textarea
              className="form-textarea"
              rows={8}
              placeholder="Taip sebarang nota penting, dokumentasi tambahan, credential ujian, atau panduan berkaitan modul ini di sini..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ fontFamily: 'inherit', lineHeight: '1.6', fontSize: '0.9rem' }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: 'right' }}>
              {notes.length} aksara
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Tutup
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader size={16} /> : <><Save size={16} /> Simpan & Tutup</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { FileText, X, Save, Loader } from 'lucide-react';
import { updateModule } from '../services/api';

export default function ModuleNotesModal({ module, onClose, onSaved }) {
  const [notes, setNotes] = useState(module.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateModule(module.id, { notes });
      onSaved();
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
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
            <FileText size={20} color="var(--accent-cyan)" /> Nota & Catatan Modul: {module.title}
          </h3>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.3rem' }}>
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
            <label className="form-label">Isi Nota / Catatan Modul</label>
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
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader size={16} /> : <><Save size={16} /> Simpan Nota</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

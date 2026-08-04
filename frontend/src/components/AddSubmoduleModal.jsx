import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { createSubmodule, updateSubmodule } from '../services/api';

export default function AddSubmoduleModal({ moduleId, parentId = null, parentTitle = '', initialData = null, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    module_id: moduleId,
    parent_id: initialData ? initialData.parent_id : parentId,
    title: initialData?.title || '',
    description: initialData?.description || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData && initialData.id) {
        await updateSubmodule(initialData.id, formData);
      } else {
        await createSubmodule(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert('Gagal menyimpan submodul: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {initialData ? 'Kemaskini Submodul' : (parentId ? 'Tambah Sub-Submodul' : 'Tambah Submodul Baru')}
            </h3>
            {parentTitle && (
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                Di bawah: {parentTitle}
              </span>
            )}
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.4rem' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama / Tajuk Submodul</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              placeholder={parentId ? "e.g. Submodul Pembayaran FPX" : "e.g. Submodul Pembayaran"} 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi / Perincian (Pilihan)</label>
            <textarea 
              className="form-textarea" 
              placeholder="Terangkan fungsi spesifik submodul ini..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={16} /> {loading ? 'Menyimpan...' : (initialData ? 'Kemaskini Submodul' : 'Simpan Submodul')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

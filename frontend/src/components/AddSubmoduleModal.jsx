import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { createSubmodule } from '../services/api';

export default function AddSubmoduleModal({ moduleId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    module_id: moduleId,
    title: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createSubmodule(formData);
      onSuccess();
      onClose();
    } catch (err) {
      alert('Gagal menambah submodul: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Tambah Submodul Baru</h3>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.4rem' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama / Tajuk Submodul</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              placeholder="e.g. Submodul Pembayaran FPX Online" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi / Perincian Submodul (Pilihan)</label>
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
              <Save size={16} /> {loading ? 'Menyimpan...' : 'Simpan Submodul'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

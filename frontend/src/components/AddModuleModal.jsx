import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { createModule } from '../services/api';

export default function AddModuleModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    category: 'Sistem Utama',
    description: '',
    status: 'Active'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createModule(formData);
      onSuccess();
      onClose();
    } catch (err) {
      alert('Gagal mendaftar modul: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Daftar Modul Baru</h3>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.4rem' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama / Tajuk Modul</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              placeholder="e.g. Modul Pembayaran & Invois Online" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Pentadbiran, Kewangan" 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status Modul</label>
              <select 
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Deprecated">Deprecated</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi / Perincian Modul</label>
            <textarea 
              className="form-textarea" 
              placeholder="Terangkan fungsi asas modul ini..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={16} /> {loading ? 'Menyimpan...' : 'Simpan Modul'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

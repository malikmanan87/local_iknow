import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { createFlow, updateFlow, uploadImage } from '../services/api';

export default function AddFlowModal({ moduleId, submodules = [], defaultSubmoduleId = null, initialData = null, nextStepNumber = 1, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    module_id: moduleId,
    submodule_id: initialData ? (initialData.submodule_id || '') : (defaultSubmoduleId || ''),
    step_number: initialData ? initialData.step_number : (nextStepNumber || 1),
    step_title: initialData?.step_title || '',
    description: initialData?.description || '',
    image_path: initialData?.image_path || ''
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append('image', file);
    data.append('type', 'flows');

    try {
      const res = await uploadImage(data);
      setFormData((prev) => ({ ...prev, image_path: res.data.image_path }));
    } catch (err) {
      alert('Gagal muat naik imej: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData && initialData.id) {
        await updateFlow(initialData.id, formData);
      } else {
        await createFlow(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert('Gagal menyimpan flow: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {initialData ? 'Kemaskini Langkah Flow' : 'Tambah Langkah Aliran Kerja (Flow)'}
          </h3>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.4rem' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {submodules.length > 0 && (
            <div className="form-group">
              <label className="form-label">Pilih Submodul (Pilihan)</label>
              <select 
                className="form-select"
                value={formData.submodule_id || ''}
                onChange={(e) => setFormData({ ...formData, submodule_id: e.target.value })}
              >
                <option value="">-- Semua / Terus di bawah Modul --</option>
                {submodules.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">No. Langkah</label>
              <input 
                type="number" 
                className="form-input" 
                required 
                value={formData.step_number}
                onChange={(e) => setFormData({ ...formData, step_number: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tajuk Langkah Flow</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                placeholder="e.g. Pengguna Menghantar Borang Permohonan" 
                value={formData.step_title}
                onChange={(e) => setFormData({ ...formData, step_title: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Keterangan / Penerangan Langkah</label>
            <textarea 
              className="form-textarea" 
              placeholder="Jelaskan proses yang berlaku pada langkah ini..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Muat Naik Diagram / Gambar Flow (Pilihan)</label>
            <input 
              type="file" 
              accept="image/*" 
              className="form-input" 
              onChange={handleImageUpload}
              disabled={uploading}
            />
            {uploading && <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)' }}>Memuat naik imej...</span>}
            {formData.image_path && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
                ✓ Imej: {formData.image_path}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading || uploading}>
              <Save size={16} /> {loading ? 'Menyimpan...' : (initialData ? 'Kemaskini Flow' : 'Simpan Flow')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

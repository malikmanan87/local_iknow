import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { createContact } from '../services/api';

export default function AddContactModal({ moduleId, onClose, onSuccess, submodules = [], defaultSubmoduleId = null }) {
  const [formData, setFormData] = useState({
    module_id: moduleId,
    submodule_id: defaultSubmoduleId || "",
    name: '',
    role: 'Lead Developer',
    email: '',
    phone_no: '',
    department: 'IT / Systems'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createContact(formData);
      onSuccess();
      onClose();
    } catch (err) {
      alert('Gagal menambah PIC: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Tambah Pegawai Bertanggungjawab (PIC)</h3>
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
        
          <div className="form-group">
            <label className="form-label">Nama Pegawai / PIC</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              placeholder="e.g. Ahmad Albab" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Peranan / Jawatan</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. System Admin / Developer" 
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Jabatan / Unit</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Unit Aplikasi Utama" 
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">E-mel</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="e.g. ahmad@example.com" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">No. Telefon / WhatsApp</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 60123456789" 
                value={formData.phone_no}
                onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={16} /> {loading ? 'Menyimpan...' : 'Simpan PIC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

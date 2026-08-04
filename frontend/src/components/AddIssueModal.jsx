import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { createIssue, updateIssue, uploadImage } from '../services/api';

export default function AddIssueModal({ moduleId, submodules = [], defaultSubmoduleId = null, initialData = null, onClose, onSuccess }) {
  const [issueData, setIssueData] = useState({
    module_id: moduleId,
    submodule_id: initialData ? (initialData.submodule_id || '') : (defaultSubmoduleId || ''),
    issue_code: initialData?.issue_code || '',
    title: initialData?.title || '',
    symptoms: initialData?.symptoms || ''
  });

  const [solutions, setSolutions] = useState(
    initialData && initialData.solutions && initialData.solutions.length > 0
      ? initialData.solutions
      : [{ instruction: '', image_path: '' }]
  );

  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const handleAddSolutionRow = () => {
    setSolutions([...solutions, { instruction: '', image_path: '' }]);
  };

  const handleRemoveSolutionRow = (index) => {
    setSolutions(solutions.filter((_, i) => i !== index));
  };

  const handleSolutionChange = (index, field, value) => {
    const updated = [...solutions];
    updated[index][field] = value;
    setSolutions(updated);
  };

  const handleSolutionImageUpload = async (index, file) => {
    if (!file) return;
    setUploadingIndex(index);
    const data = new FormData();
    data.append('image', file);
    data.append('type', 'troubleshoot');

    try {
      const res = await uploadImage(data);
      handleSolutionChange(index, 'image_path', res.data.image_path);
    } catch (err) {
      alert('Gagal muat naik imej penyelesaian: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...issueData,
      submodule_id: issueData.submodule_id ? parseInt(issueData.submodule_id, 10) : null,
      solutions: solutions.filter(s => s.instruction.trim() !== '')
    };

    try {
      if (initialData && initialData.id) {
        await updateIssue(initialData.id, payload);
      } else {
        await createIssue(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert('Gagal menyimpan isu: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {initialData ? 'Kemaskini Common Issue & Solution' : 'Tambah Common Issue & Solution / Workaround'}
          </h3>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.4rem' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {submodules.length > 0 && (
            <div className="form-group">
              <label className="form-label">Pilih Submodul (Pilihan)</label>
              <select 
                className="form-select"
                value={issueData.submodule_id || ''}
                onChange={(e) => setIssueData({ ...issueData, submodule_id: e.target.value })}
              >
                <option value="">-- Semua / Terus di bawah Modul --</option>
                {submodules.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Error Code (Pilihan)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. ERR-5001" 
                value={issueData.issue_code}
                onChange={(e) => setIssueData({ ...issueData, issue_code: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tajuk Isu / Error</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                placeholder="e.g. Transaksi Tergantung Semasa Pembayaran" 
                value={issueData.title}
                onChange={(e) => setIssueData({ ...issueData, title: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tanda-tanda / Simptom Isu (Symptoms)</label>
            <textarea 
              className="form-textarea" 
              placeholder="e.g. Skrin menunjukkan 'Payment Timeout' dan status kekal Pending..."
              value={issueData.symptoms}
              onChange={(e) => setIssueData({ ...issueData, symptoms: e.target.value })}
            />
          </div>

          <hr style={{ borderColor: 'var(--border-color)', margin: '1.5rem 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>Langkah Penyelesaian / Workaround</h4>
            <button type="button" className="btn btn-secondary" onClick={handleAddSolutionRow} style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}>
              <Plus size={14} /> Tambah Langkah
            </button>
          </div>

          {solutions.map((sol, index) => (
            <div key={index} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>Langkah #{index + 1}</span>
                {solutions.length > 1 && (
                  <button type="button" className="btn btn-danger" onClick={() => handleRemoveSolutionRow(index)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                    <Trash2 size={13} /> Padam
                  </button>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="Arahan / Langkah troubleshooting..." 
                  value={sol.instruction}
                  onChange={(e) => handleSolutionChange(index, 'instruction', e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Gambar Rujukan Solution (Pilihan)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="form-input" 
                  onChange={(e) => handleSolutionImageUpload(index, e.target.files[0])}
                  disabled={uploadingIndex === index}
                />
                {uploadingIndex === index && <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>Muat naik imej...</span>}
                {sol.image_path && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'block', marginTop: '0.25rem' }}>
                    ✓ Imej: {sol.image_path}
                  </span>
                )}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={16} /> {loading ? 'Menyimpan...' : (initialData ? 'Kemaskini Isu' : 'Simpan Isu & Solution')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

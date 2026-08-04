import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Plus, Trash2, CheckCircle } from 'lucide-react';
import { getGhopStatus, uploadGhopPdf, deleteGhopPolicy } from '../services/api';

export default function GhopPdfUploadModal({ onClose, onSuccess }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [pdfFile, setPdfFile] = useState(null);
  const [newClause, setNewClause] = useState({
    page_number: 1,
    chapter_title: '',
    section_code: '',
    title: '',
    content_text: '',
    keywords: ''
  });

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await getGhopStatus();
      setStatus(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!pdfFile && !newClause.content_text) {
      alert('Sila pilih fail PDF GHOP atau masukkan klausa teks.');
      return;
    }

    setUploading(true);
    try {
      if (pdfFile) {
        const formData = new FormData();
        formData.append('pdf_file', pdfFile);
        await uploadGhopPdf(formData);
      }

      if (newClause.content_text.trim()) {
        await uploadGhopPdf({
          pdf_filename: pdfFile ? pdfFile.name : (status?.pdf_filename || 'GHOP_Official_Policy.pdf'),
          clauses: [newClause]
        });
      }

      alert('Fail PDF / Klausa GHOP berjaya disimpan!');
      setPdfFile(null);
      setNewClause({ page_number: 1, chapter_title: '', section_code: '', title: '', content_text: '', keywords: '' });
      fetchStatus();
      if (onSuccess) onSuccess();
    } catch (err) {
      alert('Gagal memuat naik fail PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePolicy = async (id) => {
    if (window.confirm('Padam klausa GHOP ini daripada pangkalan data AI?')) {
      try {
        await deleteGhopPolicy(id);
        fetchStatus();
      } catch (err) {
        alert('Gagal memadam klausa');
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={22} color="var(--primary)" /> Pengurusan Dokumen PDF GHOP
          </h3>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.4rem' }}><X size={18} /></button>
        </div>

        {/* Current Active PDF Banner */}
        <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                Dokumen Aktif GHOP AI
              </span>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.2rem', color: '#fff' }}>
                📄 {status?.pdf_filename || 'Tiada PDF dimuat naik lagi'}
              </h4>
            </div>
            <span className="badge badge-active" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
              {status?.total_clauses || 0} Klausa Terdapat
            </span>
          </div>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleFileUpload} style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--accent-cyan)' }}>
            1. Muat Naik Fail PDF GHOP Baharu
          </h4>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <input 
              type="file" 
              accept=".pdf" 
              className="form-input" 
              onChange={(e) => setPdfFile(e.target.files[0])}
            />
            {pdfFile && (
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', marginTop: '0.4rem', display: 'block' }}>
                ✓ Dipilih: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            )}
          </div>

          <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '1.25rem 0 0.75rem 0', color: 'var(--accent-cyan)' }}>
            2. Tambah Klausa / Petikan Teks PDF Manual (Pilihan)
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>No. M/S PDF</label>
              <input 
                type="number" 
                className="form-input" 
                value={newClause.page_number}
                onChange={(e) => setNewClause({ ...newClause, page_number: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Bab / Seksyen PDF</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Bab 4: Pengurusan Wad"
                value={newClause.chapter_title}
                onChange={(e) => setNewClause({ ...newClause, chapter_title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Kod Klausa (Pilihan)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. GHOP-WAD-01"
                value={newClause.section_code}
                onChange={(e) => setNewClause({ ...newClause, section_code: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Tajuk Polisi / Klausa</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Polisi Kehadiran Peneman Pesakit Dalam Wad"
              value={newClause.title}
              onChange={(e) => setNewClause({ ...newClause, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Petikan Kandungan Teks PDF</label>
            <textarea 
              className="form-textarea" 
              rows={4}
              placeholder="Salin dan tampal perenggan klausa daripada fail PDF GHOP di sini..."
              value={newClause.content_text}
              onChange={(e) => setNewClause({ ...newClause, content_text: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={uploading} style={{ width: '100%', justifyContent: 'center' }}>
            <Upload size={16} /> {uploading ? 'Memuat naik & Mengemaskini...' : 'Simpan Dokumen PDF GHOP'}
          </button>
        </form>

        {/* Extracted Clauses Table */}
        <hr style={{ borderColor: 'var(--border-color)', margin: '1.5rem 0' }} />
        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Senarai Klausa PDF GHOP Sedia Ada ({status?.policies?.length || 0})
        </h4>

        {loading ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Memuatkan senarai klausa PDF...</p>
        ) : !status?.policies || status.policies.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tiada klausa PDF disimpan lagi.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {status.policies.map(p => (
              <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                      M/S {p.page_number}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>{p.chapter_title}</span>
                    {p.section_code && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({p.section_code})</span>}
                  </div>
                  <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>{p.title}</h5>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {p.content_text.length > 120 ? p.content_text.substring(0, 120) + '...' : p.content_text}
                  </p>
                </div>
                <button type="button" className="btn btn-danger" onClick={() => handleDeletePolicy(p.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

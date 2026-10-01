import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  PlusCircle, 
  Download, 
  Eye, 
  Trash2, 
  Pencil, 
  Calendar, 
  Tag, 
  X, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Layers,
  FileSpreadsheet,
  FileCheck,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';
import { 
  getProcurementDocuments, 
  createProcurementDocument, 
  updateProcurementDocument, 
  deleteProcurementDocument,
  UPLOAD_BASE_URL 
} from '../services/api';

export default function FinanceProcurement() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  
  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Penilaian Perolehan',
    reference_no: '',
    description: '',
    effective_date: '',
    tags: '',
    file: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(true);

  const categories = [
    'Semua',
    'Penilaian Perolehan',
    'Tatacara & Garis Panduan',
    'Kewangan & Bajet',
    'Templat & Borang'
  ];

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await getProcurementDocuments({
        search: search.trim(),
        category: selectedCategory !== 'Semua' ? selectedCategory : undefined
      });
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Ralat memuatkan dokumen:', err);
      showToast('Gagal memuatkan senarai dokumen', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocs();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const showToast = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingDoc(null);
    setFormData({
      title: '',
      category: 'Penilaian Perolehan',
      reference_no: '',
      description: '',
      effective_date: new Date().toISOString().split('T')[0],
      tags: '',
      file: null
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (doc) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title || '',
      category: doc.category || 'Penilaian Perolehan',
      reference_no: doc.reference_no || '',
      description: doc.description || '',
      effective_date: doc.effective_date || '',
      tags: doc.tags || '',
      file: null
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Sila masukkan tajuk dokumen', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('category', formData.category);
      data.append('reference_no', formData.reference_no.trim());
      data.append('description', formData.description.trim());
      data.append('effective_date', formData.effective_date);
      data.append('tags', formData.tags.trim());
      if (formData.file) {
        data.append('file', formData.file);
      }

      if (editingDoc) {
        await updateProcurementDocument(editingDoc.id, data);
        showToast('Dokumen berjaya dikemaskini', 'success');
      } else {
        await createProcurementDocument(data);
        showToast('Dokumen baharu berjaya didaftarkan', 'success');
      }

      setModalOpen(false);
      fetchDocs();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.messages?.error || err.response?.data?.message || 'Ralat menyimpan dokumen';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (doc) => {
    if (window.confirm(`Adakah anda pasti mahu memadam dokumen "${doc.title}"?`)) {
      try {
        await deleteProcurementDocument(doc.id);
        showToast('Dokumen berjaya dipadam', 'success');
        fetchDocs();
      } catch (err) {
        console.error(err);
        showToast('Gagal memadam dokumen', 'error');
      }
    }
  };

  const handlePreviewPdf = (doc) => {
    if (!doc.file_path) {
      showToast('Tiada fail PDF dilampirkan untuk dokumen ini. Sila kemaskini untuk muat naik.', 'error');
      return;
    }
    const fullUrl = doc.full_url || (UPLOAD_BASE_URL + doc.file_path);
    setPreviewTitle(doc.title);
    setPreviewPdfUrl(fullUrl);
  };

  // Helper to count stats
  const totalCount = documents.length;
  const procCount = documents.filter(d => d.category === 'Penilaian Perolehan').length;
  const sopCount = documents.filter(d => d.category === 'Tatacara & Garis Panduan').length;

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          background: notification.type === 'success' ? '#065f46' : notification.type === 'error' ? '#991b1b' : '#1e293b',
          color: '#fff',
          padding: '0.85rem 1.4rem',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.95rem',
          fontWeight: 500,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel" style={{ 
        padding: '2.5rem', 
        marginBottom: '2rem', 
        textAlign: 'center', 
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.12))' 
      }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'rgba(168, 85, 247, 0.2)', 
          color: '#c084fc', 
          padding: '0.35rem 1rem', 
          borderRadius: '20px', 
          fontSize: '0.85rem', 
          fontWeight: 600, 
          marginBottom: '0.75rem' 
        }}>
          <FileCheck size={16} /> Modul Pengurusan & Tatakelola
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
          Kewangan & Perolehan
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '700px', margin: '0 auto 1.5rem auto' }}>
          Pusat rujukan tatacara penyediaan laporan penilaian perolehan, garis panduan tender & sebut harga, SOP perolehan ICT, serta templat dokumen rasmi.
        </p>

        {/* Global Search Bar */}
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Cari tatacara, no. rujukan (PK), kata kunci, atau tajuk dokumen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '3.2rem', paddingRight: search ? '3rem' : '1rem', paddingY: '0.9rem', fontSize: '1rem', borderRadius: '12px' }}
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '0.85rem', borderRadius: '12px' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{totalCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Jumlah Dokumen Berdaftar</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.85rem', borderRadius: '12px' }}>
            <FileCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{procCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Penilaian Perolehan</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '0.85rem', borderRadius: '12px' }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{sopCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tatacara & Garis Panduan</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleOpenAdd}
            style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #9333ea, #6366f1)', border: 'none' }}
          >
            <PlusCircle size={20} />
            <span>Muat Naik Dokumen Baru</span>
          </button>
        </div>
      </div>

      {/* Accordion: 4 Peringkat Tatacara Penilaian Perolehan (Quick Infographic) */}
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div 
          onClick={() => setShowWorkflowGuide(!showWorkflowGuide)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', padding: '0.5rem', borderRadius: '8px' }}>
              <Info size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                Ringkasan Alur: 4 Fasa Tatacara Penyediaan Laporan Penilaian Perolehan
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Panduan ringkas langkah kerja bagi Jawatankuasa Penilaian Tender / Sebut Harga ICT
              </p>
            </div>
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            {showWorkflowGuide ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {showWorkflowGuide && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.35rem' }}>FASA 1</div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.4rem' }}>Pematuhan Syarat Wajib</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Semakan profil syarikat, pendaftaran MOF / CIDB / lesen wajib, dan integriti dokumen pembida.
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', marginBottom: '0.35rem' }}>FASA 2</div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.4rem' }}>Penilaian Teknikal</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Pemarkahan spesifikasi ICT, jadual kepatuhan, keupayaan teknikal, serta demonstrasi / PoC sistem.
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', marginBottom: '0.35rem' }}>FASA 3</div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.4rem' }}>Penilaian Kewangan & Harga</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Analisis perbandingan harga tawaran lawan anggaran jabatan (in-house estimate) dan kelayakan kewangan.
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #a855f7' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c084fc', marginBottom: '0.35rem' }}>FASA 4</div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.4rem' }}>Perakuan & Laporan Akhir</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Penyediaan draf laporan penilaian lengkap, justifikasi pemilihan petender terbaik, dan tandatangan perakuan jawatankuasa.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              borderRadius: '20px',
              border: selectedCategory === cat ? 'none' : '1px solid var(--border-color)',
              background: selectedCategory === cat ? 'linear-gradient(135deg, #a855f7, #6366f1)' : undefined
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Document Grid / List */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Memuatkan dokumen perolehan...
        </div>
      ) : documents.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Tiada dokumen dijumpai</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '450px', margin: '0 auto 1.5rem auto' }}>
            {search ? `Tiada dokumen yang sepadan dengan carian "${search}".` : 'Belum ada dokumen yang dimuat naik dalam kategori ini.'}
          </p>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <PlusCircle size={18} /> Muat Naik Dokumen Sekarang
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {documents.map((doc) => {
            const hasPdf = Boolean(doc.file_path);
            const isPdf = doc.file_name?.toLowerCase().endsWith('.pdf') || doc.file_path?.toLowerCase().endsWith('.pdf');

            return (
              <div 
                key={doc.id} 
                className="glass-panel"
                style={{ 
                  padding: '1.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-color)',
                  position: 'relative',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div>
                  {/* Badges Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem', gap: '0.5rem' }}>
                    <span style={{ 
                      background: 'rgba(168, 85, 247, 0.15)', 
                      color: '#c084fc', 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      padding: '0.25rem 0.65rem', 
                      borderRadius: '12px',
                      border: '1px solid rgba(168, 85, 247, 0.3)'
                    }}>
                      {doc.category || 'Penilaian Perolehan'}
                    </span>
                    {doc.reference_no && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-muted)', 
                        background: 'rgba(255,255,255,0.05)', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '6px' 
                      }}>
                        Ref: {doc.reference_no}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.6rem', color: '#f8fafc', lineHeight: 1.35 }}>
                    {doc.title}
                  </h3>

                  {/* Description */}
                  <p style={{ 
                    fontSize: '0.88rem', 
                    color: 'var(--text-muted)', 
                    lineHeight: '1.5', 
                    marginBottom: '1rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {doc.description || 'Tiada keterangan lanjut disediakan.'}
                  </p>

                  {/* File Metadata */}
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(255, 255, 255, 0.05)', 
                    marginBottom: '1.25rem',
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                      <span>Status Fail:</span>
                      <span style={{ fontWeight: 600, color: hasPdf ? '#34d399' : '#f87171' }}>
                        {hasPdf ? (isPdf ? '📄 PDF Lampiran Tersedia' : '📎 Dokumen Tersedia') : '⚠️ Tiada Fail Dimuat Naik'}
                      </span>
                    </div>
                    {doc.file_size && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Saiz:</span>
                        <span>{doc.file_size}</span>
                      </div>
                    )}
                    {doc.effective_date && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Tarikh Kuat Kuasa:</span>
                        <span>{doc.effective_date}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {hasPdf ? (
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handlePreviewPdf(doc)}
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                        title="Lihat PDF secara langsung"
                      >
                        <Eye size={15} /> Lihat PDF
                      </button>
                    ) : (
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handleOpenEdit(doc)}
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderColor: '#a855f7', color: '#c084fc' }}
                        title="Muat naik fail untuk dokumen ini"
                      >
                        <PlusCircle size={15} /> Muat Naik Fail
                      </button>
                    )}
                    {hasPdf && (
                      <a 
                        href={doc.full_url || (UPLOAD_BASE_URL + doc.file_path)}
                        download={doc.file_name || 'dokumen.pdf'}
                        className="btn btn-secondary"
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        title="Muat turun fail"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download size={15} /> Muat Turun
                      </a>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button 
                      onClick={() => handleOpenEdit(doc)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem', borderRadius: '4px' }}
                      title="Kemaskini maklumat atau ganti fail"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(doc)}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.35rem', borderRadius: '4px' }}
                      title="Padam dokumen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PDF Lightbox / Preview Modal */}
      {previewPdfUrl && (
        <div className="modal-backdrop" onClick={() => setPreviewPdfUrl(null)}>
          <div 
            className="modal-content" 
            style={{ width: '90vw', maxWidth: '1100px', height: '90vh', display: 'flex', flexDirection: 'column', padding: '1.25rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '0.5rem', borderRadius: '8px' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>{previewTitle}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pemapar Dokumen PDF</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <a 
                  href={previewPdfUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                >
                  Buka di Tab Baharu
                </a>
                <a 
                  href={previewPdfUrl} 
                  download
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                >
                  <Download size={15} /> Muat Turun
                </a>
                <button 
                  onClick={() => setPreviewPdfUrl(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem' }}
                  title="Tutup"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Embedded Iframe */}
            <div style={{ flex: 1, width: '100%', background: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
              <iframe 
                src={previewPdfUrl} 
                title={previewTitle}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Document Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '0.6rem', borderRadius: '10px' }}>
                  <FileText size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                    {editingDoc ? 'Kemaskini Dokumen' : 'Daftar Dokumen Kewangan / Perolehan'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {editingDoc ? 'Kemaskini maklumat atau muat naik versi fail baharu' : 'Masukkan tatacara, pekeliling, atau garis panduan berserta fail PDF'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">
                  Tajuk Dokumen <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Contoh: Tatacara Laporan Penilaian Perolehan"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select 
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Penilaian Perolehan">Penilaian Perolehan</option>
                    <option value="Tatacara & Garis Panduan">Tatacara & Garis Panduan</option>
                    <option value="Kewangan & Bajet">Kewangan & Bajet</option>
                    <option value="Templat & Borang">Templat & Borang</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">No. Rujukan / Pekeliling</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Contoh: PK 2.1 / PK 2.2 / HPUniSZA-SOP-01"
                    value={formData.reference_no}
                    onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Tarikh Kuat Kuasa / Terbitan</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={formData.effective_date}
                    onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kata Kunci / Tags (Pemisah koma)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="perolehan, tender, penilaian teknikal"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Keterangan / Rumusan Dokumen</label>
                <textarea 
                  className="form-textarea" 
                  rows={3}
                  placeholder="Ringkasan kandungan dan panduan bagi dokumen ini..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* File Upload Box */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">
                  Muat Naik Fail PDF / Dokumen {editingDoc && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Biarkan kosong jika tidak mahu menggantikan fail sedia ada)</span>}
                </label>
                <div style={{ 
                  border: formData.file ? '2px solid #34d399' : '2px dashed var(--border-color)', 
                  borderRadius: '10px', 
                  padding: '1.5rem', 
                  textAlign: 'center', 
                  background: formData.file ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}>
                  <input 
                    type="file" 
                    id="docFileInput"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const selected = e.target.files[0];
                        setFormData((prev) => ({ ...prev, file: selected }));
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="docFileInput" style={{ cursor: 'pointer', display: 'block' }}>
                    {formData.file ? (
                      <CheckCircle size={32} style={{ color: '#34d399', marginBottom: '0.5rem' }} />
                    ) : (
                      <Upload size={32} style={{ color: '#c084fc', marginBottom: '0.5rem' }} />
                    )}
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem', color: formData.file ? '#34d399' : 'inherit' }}>
                      {formData.file ? (
                        `📄 ${formData.file.name} (${formData.file.size > 1048576 ? (formData.file.size / 1048576).toFixed(2) + ' MB' : (formData.file.size / 1024).toFixed(1) + ' KB'})`
                      ) : (editingDoc && editingDoc.file_name ? (
                        `Fail semasa: ${editingDoc.file_name} (${editingDoc.file_size || ''}). Klik untuk ganti fail.`
                      ) : 'Klik untuk pilih fail PDF atau dokumen')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formData.file ? 'Fail sedia untuk dimuat naik' : 'Menyokong format PDF, Word (.docx) atau Excel (.xlsx)'}
                    </div>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none' }}
                  disabled={submitting}
                >
                  {submitting ? 'Sedang Menyimpan...' : (editingDoc ? 'Simpan Kemaskini' : 'Daftar Dokumen')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

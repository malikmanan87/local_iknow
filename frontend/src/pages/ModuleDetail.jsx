import React, { useState, useEffect } from 'react';
import { ArrowLeft, GitCommit, AlertTriangle, Phone, Plus, Trash2, Image as ImageIcon, MessageCircle, Mail, Layers } from 'lucide-react';
import { getModuleDetail, deleteFlow, deleteIssue, deleteContact, deleteSubmodule } from '../services/api';
import AddFlowModal from '../components/AddFlowModal';
import AddIssueModal from '../components/AddIssueModal';
import AddContactModal from '../components/AddContactModal';
import AddSubmoduleModal from '../components/AddSubmoduleModal';
import ImageLightbox from '../components/ImageLightbox';

export default function ModuleDetail({ moduleId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('flows');
  const [selectedSubmoduleId, setSelectedSubmoduleId] = useState('all'); // 'all' or submodule id

  const [showAddSubmodule, setShowAddSubmodule] = useState(false);
  const [showAddFlow, setShowAddFlow] = useState(false);
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  const [lightboxImage, setLightboxImage] = useState(null);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await getModuleDetail(moduleId);
      setData(res.data);
    } catch (err) {
      alert('Gagal mengambil maklumat modul');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (moduleId) fetchDetail();
  }, [moduleId]);

  const handleDeleteSubmodule = async (id, title) => {
    if (window.confirm('Padam submodul "' + title + '"? Flow/Isu di dalamnya akan dipindahkan ke modul utama.')) {
      await deleteSubmodule(id);
      if (selectedSubmoduleId == id) setSelectedSubmoduleId('all');
      fetchDetail();
    }
  };

  const handleDeleteFlow = async (id) => {
    if (window.confirm('Padam langkah flow ini?')) {
      await deleteFlow(id);
      fetchDetail();
    }
  };

  const handleDeleteIssue = async (id) => {
    if (window.confirm('Padam isu ini beserta langkah penyelesaiannya?')) {
      await deleteIssue(id);
      fetchDetail();
    }
  };

  const handleDeleteContact = async (id) => {
    if (window.confirm('Padam maklumat PIC ini?')) {
      await deleteContact(id);
      fetchDetail();
    }
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', margin: '2rem 0' }}>
        Memuatkan perincian modul...
      </div>
    );
  }

  if (!data || !data.module) return null;

  const { module, submodules = [], flows = [], issues = [], contacts = [] } = data;

  // Filter items by selectedSubmoduleId
  const filteredFlows = selectedSubmoduleId === 'all' 
    ? flows 
    : flows.filter(f => f.submodule_id == selectedSubmoduleId);

  const filteredIssues = selectedSubmoduleId === 'all' 
    ? issues 
    : issues.filter(i => i.submodule_id == selectedSubmoduleId);

  const filteredContacts = selectedSubmoduleId === 'all' 
    ? contacts 
    : contacts.filter(c => c.submodule_id == selectedSubmoduleId);

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Back & Module Header */}
      <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Kembali ke Senarai Modul
      </button>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-active">{module.status}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Kategori: {module.category}</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{module.title}</h1>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '800px' }}>
              {module.description || 'Tiada penerangan tambahan.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setShowAddSubmodule(true)}>
              <Layers size={16} /> + Submodul
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddFlow(true)}>
              <Plus size={16} /> Tambah Flow
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddIssue(true)} style={{ background: 'linear-gradient(135deg, var(--accent-cyan), #0284c7)' }}>
              <Plus size={16} /> Tambah Isu & Solution
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAddContact(true)}>
              <Plus size={16} /> Tambah PIC
            </button>
          </div>
        </div>

        {/* Submodules Bar */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Layers size={15} /> Submodul:
            </span>

            <button 
              onClick={() => setSelectedSubmoduleId('all')}
              className="btn btn-secondary"
              style={{ 
                padding: '0.35rem 0.85rem', 
                fontSize: '0.8rem', 
                borderRadius: '20px',
                borderColor: selectedSubmoduleId === 'all' ? 'var(--primary)' : undefined,
                background: selectedSubmoduleId === 'all' ? 'rgba(99,102,241,0.2)' : undefined,
                color: selectedSubmoduleId === 'all' ? '#fff' : undefined
              }}
            >
              Semua ({submodules.length})
            </button>

            {submodules.map((sub) => (
              <div key={sub.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <button 
                  onClick={() => setSelectedSubmoduleId(sub.id)}
                  className="btn btn-secondary"
                  style={{ 
                    padding: '0.35rem 0.85rem', 
                    fontSize: '0.8rem', 
                    borderRadius: '20px',
                    borderColor: selectedSubmoduleId == sub.id ? 'var(--accent-cyan)' : undefined,
                    background: selectedSubmoduleId == sub.id ? 'rgba(6,182,212,0.2)' : undefined,
                    color: selectedSubmoduleId == sub.id ? '#fff' : undefined
                  }}
                >
                  {sub.title}
                </button>
                <button 
                  onClick={() => handleDeleteSubmodule(sub.id, sub.title)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', opacity: 0.6 }}
                  title="Padam Submodul"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setActiveTab('flows')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'flows' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'flows' ? '#fff' : 'var(--text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <GitCommit size={18} color="var(--primary)" /> Aliran Kerja / Flow ({filteredFlows.length})
        </button>

        <button 
          onClick={() => setActiveTab('issues')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'issues' ? '3px solid var(--accent-cyan)' : '3px solid transparent',
            color: activeTab === 'issues' ? '#fff' : 'var(--text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertTriangle size={18} color="var(--accent-amber)" /> Common Issues & Solution ({filteredIssues.length})
        </button>

        <button 
          onClick={() => setActiveTab('contacts')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'contacts' ? '3px solid var(--accent-emerald)' : '3px solid transparent',
            color: activeTab === 'contacts' ? '#fff' : 'var(--text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Phone size={18} color="var(--accent-emerald)" /> Pegawai Bertugas / PIC ({filteredContacts.length})
        </button>
      </div>

      {/* Tab 1: FLOWS */}
      {activeTab === 'flows' && (
        <div>
          {filteredFlows.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Belum ada aliran kerja (flow) direkodkan. Tekan "Tambah Flow" di atas.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {filteredFlows.map((f) => (
                <div key={f.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))', color: '#fff', borderRadius: '12px', width: '45px', height: '45px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0 }}>
                    {f.step_number}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                        {f.step_title}
                      </h3>
                      <button className="btn btn-danger" onClick={() => handleDeleteFlow(f.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                      {f.description}
                    </p>

                    {f.image_path && (
                      <div 
                        onClick={() => setLightboxImage({ url: f.image_path, title: 'Flow Langkah #' + f.step_number + ': ' + f.step_title })}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', color: 'var(--primary)' }}
                      >
                        <ImageIcon size={16} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Lihat Diagram / Gambar Flow</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: ISSUES & SOLUTIONS */}
      {activeTab === 'issues' && (
        <div>
          {filteredIssues.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Belum ada isu biasa atau langkah troubleshooting direkodkan. Tekan "Tambah Isu & Solution".
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {filteredIssues.map((issue) => (
                <div key={issue.id} className="glass-panel" style={{ padding: '1.75rem', borderLeft: '4px solid var(--accent-amber)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      {issue.issue_code && (
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-amber)', background: 'rgba(245,158,11,0.15)', padding: '0.2rem 0.6rem', borderRadius: '6px', marginRight: '0.5rem' }}>
                          {issue.issue_code}
                        </span>
                      )}
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', display: 'inline' }}>
                        {issue.title}
                      </h3>
                    </div>

                    <button className="btn btn-danger" onClick={() => handleDeleteIssue(issue.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                      <Trash2 size={13} /> Padam Isu
                    </button>
                  </div>

                  {issue.symptoms && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '2px solid var(--text-muted)' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Simptom / Tanda Isu:</strong>
                      <p style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: '1.5' }}>{issue.symptoms}</p>
                    </div>
                  )}

                  {/* Solutions list */}
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Langkah Penyelesaian / Workaround:
                  </h4>

                  {issue.solutions && issue.solutions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {issue.solutions.map((sol) => (
                        <div key={sol.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.9rem 1.1rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                          <span style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '0.85rem', padding: '0.2rem 0.5rem', borderRadius: '6px', flexShrink: 0 }}>
                            #{sol.step_number}
                          </span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.95rem', color: '#f1f5f9', lineHeight: '1.5' }}>
                              {sol.instruction}
                            </p>

                            {sol.image_path && (
                              <div 
                                onClick={() => setLightboxImage({ url: sol.image_path, title: 'Solution Langkah #' + sol.step_number + ' - ' + issue.title })}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                              >
                                <ImageIcon size={15} /> Lihat Gambar Rujukan Solution
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tiada arahan solution spesifik ditambah.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: CONTACTS */}
      {activeTab === 'contacts' && (
        <div>
          {filteredContacts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Belum ada pegawai bertugas (PIC) direkodkan. Tekan "Tambah PIC".
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {filteredContacts.map((c) => {
                const cleanPhone = c.phone_no ? c.phone_no.replace(/[^0-9]/g, '') : '';
                const waUrl = cleanPhone ? ('https://wa.me/' + cleanPhone) : null;

                return (
                  <div key={c.id} className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{c.name}</h3>
                      <button className="btn btn-danger" onClick={() => handleDeleteContact(c.id)} style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '0.2rem' }}>
                      {c.role || 'Pegawai Bertanggungjawab'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Jabatan: {c.department || 'IT'}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      {c.email && (
                        <a href={'mailto:' + c.email} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                          <Mail size={14} /> {c.email}
                        </a>
                      )}

                      {waUrl && (
                        <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-whatsapp" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                          <MessageCircle size={14} /> Hubungi via WhatsApp ({c.phone_no})
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showAddSubmodule && (
        <AddSubmoduleModal 
          moduleId={moduleId} 
          onClose={() => setShowAddSubmodule(false)} 
          onSuccess={fetchDetail} 
        />
      )}

      {showAddFlow && (
        <AddFlowModal 
          moduleId={moduleId} 
          submodules={submodules}
          nextStepNumber={flows.length + 1}
          onClose={() => setShowAddFlow(false)} 
          onSuccess={fetchDetail} 
        />
      )}

      {showAddIssue && (
        <AddIssueModal 
          moduleId={moduleId} 
          submodules={submodules}
          onClose={() => setShowAddIssue(false)} 
          onSuccess={fetchDetail} 
        />
      )}

      {showAddContact && (
        <AddContactModal 
          moduleId={moduleId} 
          submodules={submodules}
          onClose={() => setShowAddContact(false)} 
          onSuccess={fetchDetail} 
        />
      )}

      {lightboxImage && (
        <ImageLightbox 
          imageUrl={lightboxImage.url} 
          title={lightboxImage.title} 
          onClose={() => setLightboxImage(null)} 
        />
      )}
    </div>
  );
}

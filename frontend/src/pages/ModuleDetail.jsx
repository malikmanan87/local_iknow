import React, { useState, useEffect } from 'react';
import { ArrowLeft, GitCommit, AlertTriangle, Phone, Plus, Trash2, Image as ImageIcon, MessageCircle, Mail, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { getModuleDetail, deleteFlow, deleteIssue, deleteContact, deleteSubmodule } from '../services/api';
import AddFlowModal from '../components/AddFlowModal';
import AddIssueModal from '../components/AddIssueModal';
import AddContactModal from '../components/AddContactModal';
import AddSubmoduleModal from '../components/AddSubmoduleModal';
import ImageLightbox from '../components/ImageLightbox';

export default function ModuleDetail({ moduleId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal control
  const [showAddSubmodule, setShowAddSubmodule] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // { type: 'flow'|'issue'|'contact', submoduleId: null }
  const [lightboxImage, setLightboxImage] = useState(null);

  // Tab selection per section: { [submoduleId_or_'main']: 'flows'|'issues'|'contacts' }
  const [tabState, setTabState] = useState({});

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

  const setSubTab = (key, tabName) => {
    setTabState(prev => ({ ...prev, [key]: tabName }));
  };

  const getSubTab = (key) => tabState[key] || 'flows';

  const handleDeleteSubmodule = async (id, title) => {
    if (window.confirm('Adakah anda pasti mahu memadam submodul "' + title + '"? Semua flow, isu & PIC di dalamnya akan dipadam.')) {
      await deleteSubmodule(id);
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

  // Render dedicated section for a module/submodule context
  const renderSectionContent = (contextKey, targetSubmoduleId, sectionFlows, sectionIssues, sectionContacts) => {
    const activeSubTab = getSubTab(contextKey);

    return (
      <div>
        {/* Inner Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
          <button 
            onClick={() => setSubTab(contextKey, 'flows')}
            style={{
              padding: '0.6rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeSubTab === 'flows' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeSubTab === 'flows' ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <GitCommit size={16} color="var(--primary)" /> Flow ({sectionFlows.length})
          </button>

          <button 
            onClick={() => setSubTab(contextKey, 'issues')}
            style={{
              padding: '0.6rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeSubTab === 'issues' ? '3px solid var(--accent-cyan)' : '3px solid transparent',
              color: activeSubTab === 'issues' ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <AlertTriangle size={16} color="var(--accent-amber)" /> Common Issues & Solution ({sectionIssues.length})
          </button>

          <button 
            onClick={() => setSubTab(contextKey, 'contacts')}
            style={{
              padding: '0.6rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeSubTab === 'contacts' ? '3px solid var(--accent-emerald)' : '3px solid transparent',
              color: activeSubTab === 'contacts' ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Phone size={16} color="var(--accent-emerald)" /> Pegawai Bertugas (PIC) ({sectionContacts.length})
          </button>
        </div>

        {/* Tab 1: FLOWS */}
        {activeSubTab === 'flows' && (
          <div>
            {sectionFlows.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                Tiada langkah flow direkodkan. Tekan "+ Tambah Flow" di atas.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sectionFlows.map((f) => (
                  <div key={f.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))', color: '#fff', borderRadius: '10px', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
                      {f.step_number}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>
                          {f.step_title}
                        </h4>
                        <button className="btn btn-danger" onClick={() => handleDeleteFlow(f.id)} style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '0.6rem' }}>
                        {f.description}
                      </p>

                      {f.image_path && (
                        <div 
                          onClick={() => setLightboxImage({ url: f.image_path, title: 'Flow Langkah #' + f.step_number + ': ' + f.step_title })}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', padding: '0.35rem 0.7rem', borderRadius: '8px', cursor: 'pointer', color: 'var(--primary)' }}
                        >
                          <ImageIcon size={15} />
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Lihat Diagram / Gambar Flow</span>
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
        {activeSubTab === 'issues' && (
          <div>
            {sectionIssues.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                Tiada isu biasa direkodkan. Tekan "+ Tambah Isu & Solution".
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {sectionIssues.map((issue) => (
                  <div key={issue.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent-amber)', borderRadius: '12px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                      <div>
                        {issue.issue_code && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-amber)', background: 'rgba(245,158,11,0.15)', padding: '0.15rem 0.5rem', borderRadius: '5px', marginRight: '0.5rem' }}>
                            {issue.issue_code}
                          </span>
                        )}
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', display: 'inline' }}>
                          {issue.title}
                        </h4>
                      </div>

                      <button className="btn btn-danger" onClick={() => handleDeleteIssue(issue.id)} style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {issue.symptoms && (
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.85rem', borderRadius: '8px', marginBottom: '0.85rem', borderLeft: '2px solid var(--text-muted)' }}>
                        <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Simptom / Tanda Isu:</strong>
                        <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.4' }}>{issue.symptoms}</p>
                      </div>
                    )}

                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Langkah Penyelesaian / Workaround:
                    </h5>

                    {issue.solutions && issue.solutions.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {issue.solutions.map((sol) => (
                          <div key={sol.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                            <span style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '0.8rem', padding: '0.15rem 0.45rem', borderRadius: '5px', flexShrink: 0 }}>
                              #{sol.step_number}
                            </span>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '0.9rem', color: '#f1f5f9', lineHeight: '1.4' }}>
                                {sol.instruction}
                              </p>

                              {sol.image_path && (
                                <div 
                                  onClick={() => setLightboxImage({ url: sol.image_path, title: 'Solution Langkah #' + sol.step_number + ' - ' + issue.title })}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                >
                                  <ImageIcon size={14} /> Lihat Gambar Solution
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tiada arahan solution spesifik.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: CONTACTS */}
        {activeSubTab === 'contacts' && (
          <div>
            {sectionContacts.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                Tiada pegawai bertugas (PIC) direkodkan. Tekan "+ Tambah PIC".
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {sectionContacts.map((c) => {
                  const cleanPhone = c.phone_no ? c.phone_no.replace(/[^0-9]/g, '') : '';
                  const waUrl = cleanPhone ? ('https://wa.me/' + cleanPhone) : null;

                  return (
                    <div key={c.id} className="glass-card" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>{c.name}</h4>
                        <button className="btn btn-danger" onClick={() => handleDeleteContact(c.id)} style={{ padding: '0.15rem 0.35rem', fontSize: '0.75rem' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '0.15rem' }}>
                        {c.role || 'Pegawai Bertanggungjawab'}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                        Jabatan: {c.department || 'IT'}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                        {c.email && (
                          <a href={'mailto:' + c.email} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}>
                            <Mail size={13} /> {c.email}
                          </a>
                        )}

                        {waUrl && (
                          <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-whatsapp" style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}>
                            <MessageCircle size={13} /> WhatsApp ({c.phone_no})
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
      </div>
    );
  };

  // General main module flows/issues/contacts (where submodule_id is null)
  const mainFlows = flows.filter(f => !f.submodule_id);
  const mainIssues = issues.filter(i => !i.submodule_id);
  const mainContacts = contacts.filter(c => !c.submodule_id);

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

          <button className="btn btn-primary" onClick={() => setShowAddSubmodule(true)}>
            <Layers size={18} /> + Tambah Submodul
          </button>
        </div>
      </div>

      {/* SECTION 1: SUBMODULES LIST (Dedicated Flow, Issues & PIC per Submodule) */}
      {submodules.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={22} color="var(--accent-cyan)" /> Senarai Submodul ({submodules.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {submodules.map((sub) => {
              const subFlows = flows.filter(f => f.submodule_id == sub.id);
              const subIssues = issues.filter(i => i.submodule_id == sub.id);
              const subContacts = contacts.filter(c => c.submodule_id == sub.id);
              const contextKey = 'sub_' + sub.id;

              return (
                <div key={sub.id} className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(6,182,212,0.3)' }}>
                  {/* Submodule Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.15)', padding: '0.15rem 0.55rem', borderRadius: '6px' }}>
                          SUBMODUL
                        </span>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{sub.title}</h3>
                      </div>
                      {sub.description && (
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{sub.description}</p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button className="btn btn-secondary" onClick={() => setActiveModal({ type: 'flow', submoduleId: sub.id })} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                        <Plus size={14} /> Flow
                      </button>
                      <button className="btn btn-secondary" onClick={() => setActiveModal({ type: 'issue', submoduleId: sub.id })} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                        <Plus size={14} /> Isu & Solution
                      </button>
                      <button className="btn btn-secondary" onClick={() => setActiveModal({ type: 'contact', submoduleId: sub.id })} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                        <Plus size={14} /> PIC
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDeleteSubmodule(sub.id, sub.title)} style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} title="Padam Submodul">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Submodule Inner Tabs & Content */}
                  {renderSectionContent(contextKey, sub.id, subFlows, subIssues, subContacts)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: MAIN MODULE GENERAL ITEMS (Items directly under main module) */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              Dokumentasi Umum Modul Utama
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Flow, Isu & PIC umum yang terpakai untuk modul keseluruhan.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setActiveModal({ type: 'flow', submoduleId: null })} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              <Plus size={14} /> Flow Utama
            </button>
            <button className="btn btn-secondary" onClick={() => setActiveModal({ type: 'issue', submoduleId: null })} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              <Plus size={14} /> Isu Utama
            </button>
            <button className="btn btn-secondary" onClick={() => setActiveModal({ type: 'contact', submoduleId: null })} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              <Plus size={14} /> PIC Utama
            </button>
          </div>
        </div>

        {renderSectionContent('main', null, mainFlows, mainIssues, mainContacts)}
      </div>

      {/* Modals */}
      {showAddSubmodule && (
        <AddSubmoduleModal 
          moduleId={moduleId} 
          onClose={() => setShowAddSubmodule(false)} 
          onSuccess={fetchDetail} 
        />
      )}

      {activeModal && activeModal.type === 'flow' && (
        <AddFlowModal 
          moduleId={moduleId} 
          submodules={submodules}
          defaultSubmoduleId={activeModal.submoduleId}
          nextStepNumber={flows.length + 1}
          onClose={() => setActiveModal(null)} 
          onSuccess={fetchDetail} 
        />
      )}

      {activeModal && activeModal.type === 'issue' && (
        <AddIssueModal 
          moduleId={moduleId} 
          submodules={submodules}
          defaultSubmoduleId={activeModal.submoduleId}
          onClose={() => setActiveModal(null)} 
          onSuccess={fetchDetail} 
        />
      )}

      {activeModal && activeModal.type === 'contact' && (
        <AddContactModal 
          moduleId={moduleId} 
          submodules={submodules}
          defaultSubmoduleId={activeModal.submoduleId}
          onClose={() => setActiveModal(null)} 
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

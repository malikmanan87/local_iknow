import React, { useState, useEffect } from 'react';
import { Search, Layers, AlertCircle, ArrowRight, Trash2, RefreshCw, Pencil, GitCommit, AlertTriangle, Phone, FileText, CheckCircle } from 'lucide-react';
import { getModules, deleteModule, searchSystem } from '../services/api';

export default function Dashboard({ onSelectModule, onEditModule }) {
  const [modules, setModules] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchFilterTab, setSearchFilterTab] = useState('all'); // 'all', 'modules', 'submodules', 'flows', 'issues', 'solutions', 'contacts'
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await getModules();
      setModules(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    if (!search || search.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchSystem(search.trim());
        setSearchResults(res.data);
      } catch (err) {
        console.error('Ralat carian:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleDeleteModule = async (e, id, title) => {
    e.stopPropagation();
    if (window.confirm('Adakah anda pasti mahu memadam modul "' + title + '"?')) {
      try {
        await deleteModule(id);
        fetchModules();
      } catch (err) {
        alert('Gagal memadam modul');
      }
    }
  };

  const isSearchActive = search && search.trim().length >= 2;

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
          Pusat Dokumentasi & Troubleshooting System Modul
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto 1.5rem auto' }}>
          Cari modul, alur kerja (flow), penyelesaian isu umum, serta hubungan pegawai bertugas (PIC) seluruh sistem.
        </p>

        {/* Global Search Bar */}
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Cari kata kunci isu, error code, langkah flow, PIC, atau modul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '3.2rem', paddingRight: search ? '3rem' : '1rem', py: '0.9rem', fontSize: '1rem', borderRadius: '12px' }}
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

      {/* Global Search Results Mode */}
      {isSearchActive ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={22} color="var(--primary)" />
              Hasil Carian Sistem: "{search}" ({searchResults ? searchResults.total_results : 0})
            </h2>

            {searchResults && searchResults.total_results > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className={`btn ${searchFilterTab === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSearchFilterTab('all')} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                  Semua ({searchResults.total_results})
                </button>
                {searchResults.modules.length > 0 && (
                  <button className={`btn ${searchFilterTab === 'modules' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSearchFilterTab('modules')} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                    Modul ({searchResults.modules.length})
                  </button>
                )}
                {searchResults.submodules.length > 0 && (
                  <button className={`btn ${searchFilterTab === 'submodules' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSearchFilterTab('submodules')} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                    Submodul ({searchResults.submodules.length})
                  </button>
                )}
                {searchResults.flows.length > 0 && (
                  <button className={`btn ${searchFilterTab === 'flows' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSearchFilterTab('flows')} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                    Flow ({searchResults.flows.length})
                  </button>
                )}
                {(searchResults.issues.length > 0 || searchResults.solutions.length > 0) && (
                  <button className={`btn ${searchFilterTab === 'issues' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSearchFilterTab('issues')} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                    Isu & Solution ({searchResults.issues.length + searchResults.solutions.length})
                  </button>
                )}
                {searchResults.contacts.length > 0 && (
                  <button className={`btn ${searchFilterTab === 'contacts' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSearchFilterTab('contacts')} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                    PIC ({searchResults.contacts.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {searching ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Mencari maklumat dalam seluruh pangkalan data...
            </div>
          ) : !searchResults || searchResults.total_results === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <AlertCircle size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Tiada padanan dijumpai untuk "{search}"</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Cuba cari guna kata kunci berbeza seperti kod error, nama modul, atau nama PIC.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* 1. Modules Results */}
              {(searchFilterTab === 'all' || searchFilterTab === 'modules') && searchResults.modules.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={18} /> Modul Utama ({searchResults.modules.length})
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {searchResults.modules.map(m => (
                      <div key={m.id} className="glass-card" onClick={() => onSelectModule(m.id, 'flows')} style={{ padding: '1.25rem', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span className="badge badge-active">{m.code || 'MODULE'}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.category}</span>
                        </div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{m.title}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{m.description || 'Tiada penerangan.'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Submodules Results */}
              {(searchFilterTab === 'all' || searchFilterTab === 'submodules') && searchResults.submodules.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} /> Submodul ({searchResults.submodules.length})
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {searchResults.submodules.map(s => (
                      <div key={s.id} className="glass-card" onClick={() => onSelectModule(s.module_id, 'flows')} style={{ padding: '1.25rem', cursor: 'pointer' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                          Modul: {s.module_title} ({s.module_code})
                        </span>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>{s.title}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{s.description || 'Tiada penerangan.'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Flows Results */}
              {(searchFilterTab === 'all' || searchFilterTab === 'flows') && searchResults.flows.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GitCommit size={18} /> Langkah Alur Kerja / Flow ({searchResults.flows.length})
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {searchResults.flows.map(f => (
                      <div key={f.id} className="glass-card" onClick={() => onSelectModule(f.module_id, 'flows')} style={{ padding: '1.25rem', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                            Langkah #{f.step_number}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {f.submodule_title ? `Submodul: ${f.submodule_title}` : `Modul: ${f.module_title}`}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>{f.step_title}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{f.description || 'Tiada penerangan.'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Issues & Solutions Results */}
              {(searchFilterTab === 'all' || searchFilterTab === 'issues') && (searchResults.issues.length > 0 || searchResults.solutions.length > 0) && (
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} /> Isu Umum & Solution ({searchResults.issues.length + searchResults.solutions.length})
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {searchResults.issues.map(i => (
                      <div key={'issue-' + i.id} className="glass-card" onClick={() => onSelectModule(i.module_id, 'issues')} style={{ padding: '1.25rem', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', fontWeight: 700 }}>
                            {i.issue_code || 'COMMON ISSUE'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {i.submodule_title ? `Submodul: ${i.submodule_title}` : `Modul: ${i.module_title}`}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>{i.title}</h4>
                        {i.symptoms && (
                          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                            <strong>Simptom:</strong> {i.symptoms}
                          </p>
                        )}
                      </div>
                    ))}

                    {searchResults.solutions.map(s => (
                      <div key={'sol-' + s.id} className="glass-card" onClick={() => onSelectModule(s.module_id, 'issues')} style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: '3px solid var(--accent-emerald)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle size={13} /> Langkah Solution #{s.step_number}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Modul: {s.module_title}</span>
                        </div>
                        <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                          Isu: {s.issue_title} {s.issue_code ? `(${s.issue_code})` : ''}
                        </h5>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', lineHeight: '1.4' }}>
                          {s.instruction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Contact / PIC Results */}
              {(searchFilterTab === 'all' || searchFilterTab === 'contacts') && searchResults.contacts.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={18} /> Pegawai Bertanggungjawab / PIC ({searchResults.contacts.length})
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {searchResults.contacts.map(c => (
                      <div key={c.id} className="glass-card" onClick={() => onSelectModule(c.module_id, 'contacts')} style={{ padding: '1.25rem', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                            {c.role || 'PIC'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {c.submodule_title ? `Submodul: ${c.submodule_title}` : `Modul: ${c.module_title}`}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.3rem' }}>{c.name}</h4>
                        {c.department && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{c.department}</p>}
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                          {c.email && <div>✉ {c.email}</div>}
                          {c.phone_no && <div>📞 {c.phone_no}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      ) : (
        /* Normal Modules Cards Mode */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={22} color="var(--primary)" /> Senarai Modul ({modules.length})
            </h2>
            <button className="btn btn-secondary" onClick={fetchModules} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              <RefreshCw size={14} /> Muat Semula
            </button>
          </div>

          {loading ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Memuatkan senarai modul...
            </div>
          ) : modules.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <AlertCircle size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Tiada modul dijumpai</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Tekan "Daftar Modul Baru" untuk menambah modul pertama anda.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {modules.map((m) => {
                const badgeClass = m.status === 'Active' ? 'badge-active' : m.status === 'Maintenance' ? 'badge-maintenance' : 'badge-deprecated';
                return (
                  <div 
                    key={m.id} 
                    className="glass-card" 
                    onClick={() => onSelectModule(m.id, 'flows')}
                    style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <span className={'badge ' + badgeClass}>{m.status}</span>
                      </div>

                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>
                        {m.title}
                      </h3>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1rem', lineHeight: '1.5' }}>
                        {m.description || 'Tiada penerangan tambahan.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Kategori: {m.category || 'General'}
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); onEditModule(m); }} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} title="Kemaskini Modul">
                          <Pencil size={14} />
                        </button>
                        <button className="btn btn-danger" 
                          onClick={(e) => handleDeleteModule(e, m.id, m.title)}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          title="Padam Modul"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
                          Lihat Flow & Isu <ArrowRight size={14} />
                        </button>
                      </div>
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
}

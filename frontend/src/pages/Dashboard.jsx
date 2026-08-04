import React, { useState, useEffect } from 'react';
import { Search, Layers, AlertCircle, ArrowRight, Trash2, RefreshCw, Pencil } from 'lucide-react';
import { getModules, deleteModule } from '../services/api';

export default function Dashboard({ onSelectModule, onEditModule }) {
  const [modules, setModules] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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

  const filteredModules = modules.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.code.toLowerCase().includes(search.toLowerCase()) ||
    (m.category && m.category.toLowerCase().includes(search.toLowerCase())) ||
    (m.description && m.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
          Pusat Dokumentasi & Troubleshooting System Modul
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto 1.5rem auto' }}>
          Cari maklumat modul, alur kerja (flow), penyelesaian isu umum, serta hubungan pegawai bertugas (PIC) dalam satu portal terpusat.
        </p>

        {/* Global Search Bar */}
        <div style={{ maxWidth: '550px', margin: '0 auto', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Cari modul mengikut Nama, Kategori, atau Penerangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '3.2rem', paddingRight: '1rem', py: '0.9rem', fontSize: '1rem', borderRadius: '12px' }}
          />
        </div>
      </div>

      {/* Modules List Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={22} color="var(--primary)" /> Senarai Modul ({filteredModules.length})
        </h2>
        <button className="btn btn-secondary" onClick={fetchModules} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          <RefreshCw size={14} /> Muat Semula
        </button>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Memuatkan senarai modul...
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Tiada modul dijumpai</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Tekan "Daftar Modul Baru" untuk menambah modul pertama anda.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredModules.map((m) => {
            const badgeClass = m.status === 'Active' ? 'badge-active' : m.status === 'Maintenance' ? 'badge-maintenance' : 'badge-deprecated';
            return (
              <div 
                key={m.id} 
                className="glass-card" 
                onClick={() => onSelectModule(m.id)}
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
  );
}

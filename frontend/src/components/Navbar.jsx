import React from 'react';
import { BookOpen, PlusCircle, Activity } from 'lucide-react';

export default function Navbar({ onOpenAddModule, activeTab, setActiveTab }) {
  return (
    <nav className="navbar">
      <div className="logo-container" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
        <div className="logo-badge">iKNOW</div>
        <span className="logo-text">System Knowledge Hub</span>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button
          className="btn btn-secondary"
          onClick={() => setActiveTab('dashboard')}
          style={{ borderColor: activeTab === 'dashboard' ? 'var(--primary)' : undefined }}
        >
          <BookOpen size={18} /> Modul Sistem
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => setActiveTab('mirth')}
          style={{ borderColor: activeTab === 'mirth' ? 'var(--accent-cyan)' : undefined, color: activeTab === 'mirth' ? 'var(--accent-cyan)' : undefined }}
        >
          <Activity size={18} /> Mirth HL7
        </button>

        <button className="btn btn-primary" onClick={onOpenAddModule}>
          <PlusCircle size={18} /> Daftar Modul Baru
        </button>
      </div>
    </nav>
  );
}

import React from 'react';
import { BookOpen, PlusCircle, Activity, StickyNote, Users, Landmark } from 'lucide-react';

export default function Navbar({ onOpenAddModule, activeTab, setActiveTab }) {
  return (
    <nav className="navbar">
      <div className="logo-container" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
        <div className="logo-badge">iKNOW</div>
        <span className="logo-text">System Knowledge Hub</span>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          className="btn btn-secondary"
          onClick={() => setActiveTab('dashboard')}
          style={{ borderColor: activeTab === 'dashboard' ? 'var(--primary)' : undefined }}
        >
          <BookOpen size={18} /> Modul Sistem
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => setActiveTab('staff')}
          style={{ 
            borderColor: activeTab === 'staff' ? 'var(--accent-emerald)' : undefined, 
            color: activeTab === 'staff' ? 'var(--accent-emerald)' : undefined 
          }}
        >
          <Users size={18} /> Direktori Staf
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => setActiveTab('notes')}
          style={{ 
            borderColor: activeTab === 'notes' ? 'var(--accent-amber)' : undefined, 
            color: activeTab === 'notes' ? 'var(--accent-amber)' : undefined 
          }}
        >
          <StickyNote size={18} /> Papan Nota
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => setActiveTab('procurement')}
          style={{ 
            borderColor: activeTab === 'procurement' ? '#a855f7' : undefined, 
            color: activeTab === 'procurement' ? '#c084fc' : undefined 
          }}
        >
          <Landmark size={18} /> Kewangan & Perolehan
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


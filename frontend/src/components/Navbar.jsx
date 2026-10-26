import React from 'react';
import { Home as HomeIcon, BookOpen, Activity, StickyNote, Users, Landmark, Server, Bell } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, alertsCount = 0 }) {
  return (
    <nav className="navbar">
      <div className="logo-container" onClick={() => setActiveTab('home')} style={{ cursor: 'pointer' }}>
        <div className="logo-badge">iKNOW</div>
        <span className="logo-text">System Knowledge Hub</span>
      </div>

      <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* 1. Home (Laman Utama) */}
        <button
          className="btn btn-secondary"
          onClick={() => setActiveTab('home')}
          style={{ 
            borderColor: activeTab === 'home' ? '#6366f1' : undefined,
            color: activeTab === 'home' ? '#818cf8' : undefined,
            background: activeTab === 'home' ? 'rgba(99, 102, 241, 0.15)' : undefined
          }}
        >
          <HomeIcon size={17} /> Home
        </button>

        {/* 2. Modul Sistem */}
        <button
          className="btn btn-secondary"
          onClick={() => setActiveTab('dashboard')}
          style={{ 
            borderColor: activeTab === 'dashboard' ? 'var(--primary)' : undefined,
            color: activeTab === 'dashboard' ? '#a5b4fc' : undefined,
            background: activeTab === 'dashboard' ? 'rgba(99, 102, 241, 0.15)' : undefined
          }}
        >
          <BookOpen size={17} /> Modul Sistem
        </button>

        {/* 3. Papan Nota */}
        <button
          className="btn btn-secondary"
          onClick={() => setActiveTab('notes')}
          style={{ 
            borderColor: activeTab === 'notes' ? 'var(--accent-amber)' : undefined, 
            color: activeTab === 'notes' ? 'var(--accent-amber)' : undefined,
            background: activeTab === 'notes' ? 'rgba(245, 158, 11, 0.12)' : undefined
          }}
        >
          <StickyNote size={17} /> Papan Nota
        </button>

        {/* 4. Kewangan & Perolehan */}
        <button
          className="btn btn-secondary"
          onClick={() => setActiveTab('procurement')}
          style={{ 
            borderColor: activeTab === 'procurement' ? '#a855f7' : undefined, 
            color: activeTab === 'procurement' ? '#c084fc' : undefined,
            background: activeTab === 'procurement' ? 'rgba(168, 85, 247, 0.12)' : undefined
          }}
        >
          <Landmark size={17} /> Kewangan & Perolehan
        </button>

        {/* 5. Direktori Staf */}
        <button
          className="btn btn-secondary"
          onClick={() => setActiveTab('staff')}
          style={{ 
            borderColor: activeTab === 'staff' ? 'var(--accent-emerald)' : undefined, 
            color: activeTab === 'staff' ? 'var(--accent-emerald)' : undefined,
            background: activeTab === 'staff' ? 'rgba(16, 185, 129, 0.12)' : undefined
          }}
        >
          <Users size={17} /> Direktori Staf
        </button>

        {/* 6. Mirth HL7 */}
        <button
          className="btn btn-secondary"
          onClick={() => setActiveTab('mirth')}
          style={{ 
            borderColor: activeTab === 'mirth' ? 'var(--accent-cyan)' : undefined, 
            color: activeTab === 'mirth' ? 'var(--accent-cyan)' : undefined,
            background: activeTab === 'mirth' ? 'rgba(6, 182, 212, 0.12)' : undefined
          }}
        >
          <Activity size={17} /> Mirth HL7
        </button>

        {/* 7. Pelayan & IP */}
        <button
          className="btn btn-secondary"
          onClick={() => setActiveTab('servers')}
          style={{ 
            borderColor: activeTab === 'servers' ? '#38bdf8' : undefined, 
            color: activeTab === 'servers' ? '#38bdf8' : undefined,
            background: activeTab === 'servers' ? 'rgba(56, 189, 248, 0.12)' : undefined
          }}
        >
          <Server size={17} /> Pelayan & IP
        </button>

        {/* 8. Reminder */}
        <button
          className="btn btn-secondary"
          onClick={() => setActiveTab('reminders')}
          style={{ 
            borderColor: activeTab === 'reminders' ? '#f43f5e' : undefined, 
            color: activeTab === 'reminders' ? '#fb7185' : undefined,
            background: activeTab === 'reminders' ? 'rgba(244, 63, 94, 0.14)' : undefined,
            position: 'relative'
          }}
        >
          <Bell size={17} /> Reminder
          {alertsCount > 0 && (
            <span style={{
              marginLeft: '0.35rem',
              background: '#f43f5e',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '0.1rem 0.45rem',
              borderRadius: '999px',
              boxShadow: '0 0 8px rgba(244, 63, 94, 0.6)'
            }}>
              {alertsCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}


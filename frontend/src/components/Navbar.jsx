import React from 'react';
import { BookOpen, PlusCircle, Activity, StickyNote, Users, Landmark, Database } from 'lucide-react';

export default function Navbar({ onOpenAddModule, activeTab, setActiveTab, backupInfo, backingUp, onManualBackup }) {
  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div className="logo-container" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
          <div className="logo-badge">iKNOW</div>
          <span className="logo-text">System Knowledge Hub</span>
        </div>

        {backupInfo && (
          <div 
            onClick={onManualBackup}
            title={`Sandaran Pangkalan Data Harian (iknow_db_backup):\nFolder: iknow_db_backup/\nFail: ${backupInfo.file_name}\nTarikh: ${backupInfo.last_backup_formatted}\nSaiz: ${backupInfo.file_size}\n\nKlik untuk buat sandaran baru serta-merta.`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 500,
              cursor: 'pointer',
              background: backupInfo.status === 'healthy' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${backupInfo.status === 'healthy' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              color: backupInfo.status === 'healthy' ? '#34d399' : '#fbbf24',
              userSelect: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Database size={13} className={backingUp ? 'spin' : ''} />
            <span>{backingUp ? 'Menyandar...' : `Daily Backup: ${backupInfo.last_backup_relative}`}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>({backupInfo.file_size})</span>
          </div>
        )}
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


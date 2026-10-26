import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ModuleDetail from './pages/ModuleDetail';
import MirthViewer from './pages/MirthViewer';
import NotesManager from './pages/NotesManager';
import StaffDirectory from './pages/StaffDirectory';
import FinanceProcurement from './pages/FinanceProcurement';
import ServerManager from './pages/ServerManager';
import Reminder from './pages/Reminder';
import AddModuleModal from './components/AddModuleModal';
import { getBackupStatus, runManualBackup } from './services/api';
import { showError } from './utils/swal';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [initialModuleTab, setInitialModuleTab] = useState('flows');
  const [editModuleData, setEditModuleData] = useState(null);
  const [showAddModule, setShowAddModule] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Reminder alerts state
  const [reminderAlerts, setReminderAlerts] = useState(0);

  // Backup status state
  const [backupInfo, setBackupInfo] = useState(null);
  const [backingUp, setBackingUp] = useState(false);

  // Server monitoring state (Kitaran 1 jam sekali & Top Alert Banner)
  const [offlineServers, setOfflineServers] = useState([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const fetchReminderAlerts = async () => {
    try {
      const origin = window.location.origin;
      const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
      const res = await axios.get(`${origin}${path}api/reminders/alerts-count`);
      if (res.data?.total_alerts !== undefined) {
        setReminderAlerts(res.data.total_alerts);
      }
    } catch (e) {
      console.error('Ralat alerts count:', e);
    }
  };

  const checkServerStatus = async () => {
    try {
      const origin = window.location.origin;
      const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
      const res = await axios.get(`${origin}${path}api/servers/check-hourly`);
      if (res.data) {
        const offList = res.data.offline_servers || (res.data.data ? res.data.data.filter(s => s.status !== 'online') : []);
        setOfflineServers(offList);
        if (offList.length > 0) {
          setBannerDismissed(false);
        }
      }
    } catch (err) {
      console.error('Ralat semakan kitaran pelayan:', err);
    }
  };

  // Auto-backup setiap kali aplikasi iKNOW dibuka
  const checkAndBackup = async (auto = true) => {
    try {
      const res = await getBackupStatus(auto);
      setBackupInfo(res.data);
    } catch (err) {
      console.error('Ralat menyemak status backup:', err);
    }
  };

  const handleManualBackup = async () => {
    setBackingUp(true);
    try {
      const res = await runManualBackup();
      if (res.data?.info) {
        setBackupInfo(res.data.info);
      }
    } catch (err) {
      console.error('Ralat manual backup:', err);
      showError('Gagal menghasilkan sandaran pangkalan data.');
    } finally {
      setBackingUp(false);
    }
  };

  useEffect(() => {
    checkAndBackup(true); // Auto backup semasa buka sistem (atau jika terlepas waktu 8:00 AM)
    checkServerStatus();  // Semak status pelayan (hanya ping jika sudah melepasi 1 jam dari semakan lalu)
    fetchReminderAlerts(); // Semak bilangan amaran peringatan (loceng navbar)

    // Semak kitaran backup setiap minit
    const backupInterval = setInterval(() => {
      checkAndBackup(true);
    }, 60000);

    // Semak kitaran 1 jam pelayan setiap 5 minit (backend hanya ping jika melepasi 3600 saat)
    const serverInterval = setInterval(() => {
      checkServerStatus();
    }, 300000);

    // Semak amaran reminder setiap 2 minit
    const reminderInterval = setInterval(() => {
      fetchReminderAlerts();
    }, 120000);

    return () => {
      clearInterval(backupInterval);
      clearInterval(serverInterval);
      clearInterval(reminderInterval);
    };
  }, []);

  const handleSelectModule = (id, tab = 'flows') => {
    setSelectedModuleId(id);
    setInitialModuleTab(tab || 'flows');
    setActiveTab('detail');
  };

  const handleSetTab = (tab) => {
    if (tab === 'dashboard' || tab === 'home' || tab === 'servers') {
      setSelectedModuleId(null);
    }
    setActiveTab(tab);
  };

  return (
    <div>
      {/* ── Top Alert Banner (Dipaparkan automatik apabila ada pelayan dikesan OFFLINE) ── */}
      {offlineServers.length > 0 && !bannerDismissed && (
        <div style={{
          background: 'linear-gradient(90deg, #991b1b 0%, #dc2626 50%, #991b1b 100%)',
          color: '#ffffff',
          padding: '0.65rem 1.25rem',
          boxShadow: '0 4px 20px rgba(220, 38, 38, 0.45)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
          position: 'sticky',
          top: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 800,
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
            }}>
              🚨
            </span>
            <div style={{ fontSize: '0.88rem', lineHeight: '1.4' }}>
              <strong>AMARAN KECEMASAN:</strong> {offlineServers.length === 1 
                ? `Pelayan "${offlineServers[0].name}" (${offlineServers[0].ip_address}) dikesan OFFLINE!`
                : `${offlineServers.length} Pelayan Hospital dikesan OFFLINE! (${offlineServers.map(s => s.name).join(', ')})`}
              <span style={{ opacity: 0.85, fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                (Semakan automatik berkala 1 jam sekali)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={() => handleSetTab('servers')}
              style={{
                background: '#ffffff',
                color: '#b91c1c',
                border: 'none',
                padding: '0.3rem 0.85rem',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
              }}
            >
              <span>Urus / Semak Pelayan</span>
              <span>&rarr;</span>
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              style={{
                background: 'rgba(0,0,0,0.15)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '0.2rem 0.55rem',
                cursor: 'pointer',
                fontSize: '1rem',
                lineHeight: 1
              }}
              title="Tutup amaran sementara"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSetTab}
        alertsCount={reminderAlerts}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', paddingBottom: '3rem' }}>
        {activeTab === 'home' ? (
          <Home
            onNavigate={handleSetTab}
            onSelectModule={handleSelectModule}
            backupInfo={backupInfo}
            backingUp={backingUp}
            onManualBackup={handleManualBackup}
          />
        ) : activeTab === 'staff' ? (
          <StaffDirectory />
        ) : activeTab === 'notes' ? (
          <NotesManager />
        ) : activeTab === 'procurement' ? (
          <FinanceProcurement />
        ) : activeTab === 'mirth' ? (
          <MirthViewer />
        ) : activeTab === 'servers' ? (
          <ServerManager />
        ) : activeTab === 'reminders' ? (
          <Reminder onAlertsChanged={fetchReminderAlerts} />
        ) : activeTab === 'dashboard' ? (
          <Dashboard
            key={refreshTrigger}
            onSelectModule={handleSelectModule}
            onEditModule={(moduleData) => { setEditModuleData(moduleData); setShowAddModule(true); }}
            onOpenAddModule={() => { setEditModuleData(null); setShowAddModule(true); }}
            backupInfo={backupInfo}
            backingUp={backingUp}
            onManualBackup={handleManualBackup}
          />
        ) : (
          <ModuleDetail
            moduleId={selectedModuleId}
            initialTab={initialModuleTab}
            onBack={() => handleSetTab('dashboard')}
          />
        )}
      </div>


      {showAddModule && (
        <AddModuleModal
          initialData={editModuleData}
          onClose={() => { setShowAddModule(false); setEditModuleData(null); }}
          onSuccess={() => {
            setRefreshTrigger(prev => prev + 1);
            setActiveTab('dashboard');
          }}
        />
      )}
    </div>
  );
}

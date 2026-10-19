import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ModuleDetail from './pages/ModuleDetail';
import MirthViewer from './pages/MirthViewer';
import NotesManager from './pages/NotesManager';
import StaffDirectory from './pages/StaffDirectory';
import FinanceProcurement from './pages/FinanceProcurement';
import AddModuleModal from './components/AddModuleModal';
import { getBackupStatus, runManualBackup } from './services/api';
import { showError } from './utils/swal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [initialModuleTab, setInitialModuleTab] = useState('flows');
  const [editModuleData, setEditModuleData] = useState(null);
  const [showAddModule, setShowAddModule] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Backup status state
  const [backupInfo, setBackupInfo] = useState(null);
  const [backingUp, setBackingUp] = useState(false);

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
    const interval = setInterval(() => {
      checkAndBackup(true); // Semak kitaran setiap minit (cth: apabila melepasi jam 8:00 AM)
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectModule = (id, tab = 'flows') => {
    setSelectedModuleId(id);
    setInitialModuleTab(tab || 'flows');
    setActiveTab('detail');
  };

  const handleSetTab = (tab) => {
    if (tab === 'dashboard') {
      setSelectedModuleId(null);
    }
    setActiveTab(tab);
  };

  return (
    <div>
      <Navbar
        onOpenAddModule={() => { setEditModuleData(null); setShowAddModule(true); }}
        activeTab={activeTab}
        setActiveTab={handleSetTab}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', paddingBottom: '3rem' }}>
        {activeTab === 'staff' ? (
          <StaffDirectory />
        ) : activeTab === 'notes' ? (
          <NotesManager />
        ) : activeTab === 'procurement' ? (
          <FinanceProcurement />
        ) : activeTab === 'mirth' ? (
          <MirthViewer />
        ) : activeTab === 'dashboard' ? (
          <Dashboard
            key={refreshTrigger}
            onSelectModule={handleSelectModule}
            onEditModule={(moduleData) => { setEditModuleData(moduleData); setShowAddModule(true); }}
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

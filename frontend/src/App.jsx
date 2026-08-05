import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ModuleDetail from './pages/ModuleDetail';
import MirthViewer from './pages/MirthViewer';
import AddModuleModal from './components/AddModuleModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [initialModuleTab, setInitialModuleTab] = useState('flows');
  const [editModuleData, setEditModuleData] = useState(null);
  const [showAddModule, setShowAddModule] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
        {activeTab === 'mirth' ? (
          <MirthViewer />
        ) : activeTab === 'dashboard' ? (
          <Dashboard
            key={refreshTrigger}
            onSelectModule={handleSelectModule}
            onEditModule={(moduleData) => { setEditModuleData(moduleData); setShowAddModule(true); }}
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

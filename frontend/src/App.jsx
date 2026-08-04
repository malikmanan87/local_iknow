import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ModuleDetail from './pages/ModuleDetail';
import AddModuleModal from './components/AddModuleModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [showAddModule, setShowAddModule] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSelectModule = (id) => {
    setSelectedModuleId(id);
    setActiveTab('detail');
  };

  const handleBackToDashboard = () => {
    setSelectedModuleId(null);
    setActiveTab('dashboard');
  };

  return (
    <div>
      <Navbar 
        onOpenAddModule={() => setShowAddModule(true)} 
        activeTab={activeTab}
        setActiveTab={handleBackToDashboard}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        {activeTab === 'dashboard' ? (
          <Dashboard 
            key={refreshTrigger}
            onSelectModule={handleSelectModule} 
          />
        ) : (
          <ModuleDetail 
            moduleId={selectedModuleId} 
            onBack={handleBackToDashboard} 
          />
        )}
      </div>

      {showAddModule && (
        <AddModuleModal 
          onClose={() => setShowAddModule(false)}
          onSuccess={() => {
            setRefreshTrigger(prev => prev + 1);
            setActiveTab('dashboard');
          }}
        />
      )}
    </div>
  );
}

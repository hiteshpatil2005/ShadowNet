import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import DigitalFootprint from './pages/DigitalFootprint';
import ExposureCorrelation from './pages/ExposureCorrelation';
import AttackPathSimulation from './pages/AttackPathSimulation';
import InfrastructureGraph from './pages/InfrastructureGraph';
import ContinuousMonitoring from './pages/ContinuousMonitoring';
import AssetProfile from './pages/AssetProfile';
import Reporting from './pages/Reporting';
import Login from './pages/Login';
import Investigation from './pages/Investigation';

const MainLayout = () => {
  const { isAuthenticated, initialLoading } = useApp();

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-neon-blue uppercase tracking-widest animate-pulse">Initializing Threat Intelligence...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-cyber-black overflow-hidden selection:bg-neon-blue/30 selection:text-neon-blue">
      {/* Persistent left sidebar navigation */}
      <Sidebar />

      {/* Main workspace container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Global search and telemetries header */}
        <Header />

        {/* Dynamic page contents grid */}
          <main className="flex-1 overflow-y-auto relative">
            <Routes>
              <Route path="/" element={<div className="p-6 cyber-grid"><Dashboard /></div>} />
              <Route path="/footprint" element={<div className="p-6 cyber-grid"><DigitalFootprint /></div>} />
              <Route path="/correlations" element={<div className="p-6 cyber-grid"><ExposureCorrelation /></div>} />
              <Route path="/attack-paths" element={<div className="p-6 cyber-grid"><AttackPathSimulation /></div>} />
              <Route path="/graph" element={<div className="p-6 cyber-grid"><InfrastructureGraph /></div>} />
              <Route path="/monitoring" element={<div className="p-6 cyber-grid"><ContinuousMonitoring /></div>} />
              <Route path="/asset-profile" element={<div className="p-6 cyber-grid"><AssetProfile /></div>} />
              <Route path="/reporting" element={<div className="p-6 cyber-grid"><Reporting /></div>} />
              <Route path="/investigation" element={<Investigation />} />
            </Routes>
          </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;

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

const MainLayout = () => {
  const { isAuthenticated } = useApp();

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
        <main className="flex-1 overflow-y-auto p-6 cyber-grid relative">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/footprint" element={<DigitalFootprint />} />
            <Route path="/correlations" element={<ExposureCorrelation />} />
            <Route path="/attack-paths" element={<AttackPathSimulation />} />
            <Route path="/graph" element={<InfrastructureGraph />} />
            <Route path="/monitoring" element={<ContinuousMonitoring />} />
            <Route path="/asset-profile" element={<AssetProfile />} />
            <Route path="/reporting" element={<Reporting />} />
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

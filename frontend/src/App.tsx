import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Complaints } from './pages/Complaints';
import { MoneyTrailPage } from './pages/MoneyTrail';
import { NetworkAnalysis } from './pages/NetworkAnalysis';
import { SuspiciousAccounts } from './pages/SuspiciousAccounts';
import { LinkedComplaints } from './pages/LinkedComplaints';
import { EvidenceVault } from './pages/EvidenceVault';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020909] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyber-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="money-trail" element={<MoneyTrailPage />} />
            <Route path="network" element={<NetworkAnalysis />} />
            <Route path="accounts" element={<SuspiciousAccounts />} />
            <Route path="linked-complaints" element={<LinkedComplaints />} />
            <Route path="evidence" element={<EvidenceVault />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';
import Dashboard from './pages/Dashboard';
import AICrimeAssistant from './pages/AICrimeAssistant';
import CrimeAnalytics from './pages/CrimeAnalytics';
import CrimeHotspots from './pages/CrimeHotspots';
import CriminalNetwork from './pages/CriminalNetwork';
import InvestigationReports from './pages/InvestigationReports';
import Settings from './pages/Settings';
import FolderTree from './pages/FolderTree';
import Notifications from './pages/Notifications';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-transparent ksp-reveal">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/assistant" element={<ProtectedLayout><AICrimeAssistant /></ProtectedLayout>} />
          <Route path="/analytics" element={<ProtectedLayout><CrimeAnalytics /></ProtectedLayout>} />
          <Route path="/tree" element={<ProtectedLayout><FolderTree /></ProtectedLayout>} />
          <Route path="/hotspots" element={<ProtectedLayout><CrimeHotspots /></ProtectedLayout>} />
          <Route path="/network" element={<ProtectedLayout><CriminalNetwork /></ProtectedLayout>} />
          <Route path="/reports" element={<ProtectedLayout><InvestigationReports /></ProtectedLayout>} />
          <Route path="/notifications" element={<ProtectedLayout><Notifications /></ProtectedLayout>} />
          <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
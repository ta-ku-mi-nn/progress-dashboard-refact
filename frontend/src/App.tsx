import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import DashboardLayout from './DashboardLayout';
import Dashboard from './pages/DashboardHome';
import Admin from './pages/Admin';
import PastExam from './pages/PastExam';
import RootTable from './pages/RootTable';
import Statistics from './pages/Statistics';
import BugReport from './pages/BugReport';
import Changelog from './pages/Changelog';
import { Toaster } from 'sonner';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* 保護されたルート (ログイン必須) */}
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            {/* ダッシュボードホーム */}
            <Route index element={<Dashboard />} />
            
            {/* 各機能ページ */}
            <Route path="past-exam" element={<PastExam />} />
            <Route path="root-table" element={<RootTable />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="bug-report" element={<BugReport />} />
            <Route path="changelog" element={<Changelog />} />
            
            {/* 管理者専用ページ */}
            <Route path="admin" element={
              <ProtectedRoute roles={['admin']}>
                <Admin />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
};

export default App;
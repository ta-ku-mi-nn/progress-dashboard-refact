import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import DeveloperDashboard from './pages/DeveloperDashboard';
import { Toaster } from 'sonner';
import { SystemProvider, useSystem } from './contexts/SystemContext';
import SystemBanner from './components/SystemBanner';
import Maintenance from './pages/Maintenance';
import { useAuth } from './contexts/AuthContext';

// --- メンテナンスモードを制御するガードコンポーネント ---
const MaintenanceGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, loading } = useSystem();
  const { user } = useAuth();
  const location = useLocation();

  // 設定読み込み中
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading system settings...</div>;

  // メンテナンスモードがONの場合の処理
  if (settings?.maintenance_mode) {
    // 開発者(developer)は通常通り全画面アクセス可能
    if (user?.role === 'developer') {
      return <>{children}</>;
    }
    // ログイン画面は通す（開発者がログイン操作をするため）
    if (location.pathname === '/login') {
      return <>{children}</>;
    }
    // それ以外の一般ユーザー・Adminがアクセスした場合はメンテナンス画面を表示
    return <Maintenance />;
  }

  return <>{children}</>;
};

// --- App コンポーネント本体 ---
const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <SystemProvider> {/* 追加: システム設定のコンテキスト */}
          
          {/* 追加: 画面最上部に常駐するお知らせバナー */}
          <SystemBanner />
          
          {/* 追加: メンテナンス状態を監視するガード */}
          <MaintenanceGuard>
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
                  <ProtectedRoute roles={['admin', 'developer']}>
                    <Admin />
                  </ProtectedRoute>
                } />

                {/* 開発者用ページ */}
                <Route path="developer" element={
                  <ProtectedRoute roles={['developer']}>
                    <DeveloperDashboard />
                  </ProtectedRoute>
                } />
              </Route>
            </Routes>
          </MaintenanceGuard>

          <Toaster />
        </SystemProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
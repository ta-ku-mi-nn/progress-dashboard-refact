import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import DashboardLayout from './DashboardLayout';
import Dashboard from './pages/DashboardHome';
import StudentDetail from './pages/StudentDetail';
import Admin from './pages/Admin';
import { Toaster } from 'sonner';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="students/:id" element={<StudentDetail />} />
            <Route path="admin" element={
              <ProtectedRoute roles={['admin']}>
                <Admin />
              </ProtectedRoute>
            } />
            {/* Add more routes here */}
          </Route>
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;

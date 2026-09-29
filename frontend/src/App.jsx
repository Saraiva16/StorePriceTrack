import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/Auth/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Home from './pages/Home';
import ImportReceipt from './pages/ImportReceipt';
import EstimatePurchase from './pages/EstimatePurchase';
import EventPlanning from './pages/EventPlanning';
import EventDashboard from './pages/EventDashboard';
import UsersManagement from './pages/UsersManagement';
import Login from './pages/Login';
import Register from './pages/Register';
import BottomNav from './components/BottomNav/BottomNav';

function AppContent() {
  const location = useLocation();
  const { user } = useAuth();
  // Don't show bottom nav on login page and event wizard, only when authenticated and not on full pages
  const showBottomNav = user && location.pathname !== '/login' && !location.pathname.startsWith('/event');

  return (
    <div className="app-layout">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<Navigate to="/home" replace />} />
        
        {/* Protected Routes */}
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/import" element={
          <ProtectedRoute>
            <ImportReceipt />
          </ProtectedRoute>
        } />
        <Route path="/estimate" element={
          <ProtectedRoute>
            <EstimatePurchase />
          </ProtectedRoute>
        } />
        <Route path="/event" element={
          <ProtectedRoute>
            <EventPlanning />
          </ProtectedRoute>
        } />
        <Route path="/event/dashboard" element={
          <ProtectedRoute>
            <EventDashboard />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute>
            <UsersManagement />
          </ProtectedRoute>
        } />
      </Routes>
      {showBottomNav && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;

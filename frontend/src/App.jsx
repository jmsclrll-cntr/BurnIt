import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ScrollRevealManager from './components/ScrollRevealManager';
import Homepage from './pages/homepage';
import { RealtimeTracker } from './pages/tracker/RealtimeTracker';
import AdminRecorder from './pages/tracker/AdminRecorder';
import ProtectedRoute from './components/ProtectedRoute';
import AuthModal from './components/auth/AuthModal';
import OnboardingModal from './components/auth/OnboardingModal';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ScrollRevealManager />
          <AuthModal />
          <OnboardingModal />
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route
              path="/tracker"
              element={
                <ProtectedRoute>
                  <RealtimeTracker />
                </ProtectedRoute>
              }
            />
            {/* Redirect old intermediate routes directly to realtime camera tracker */}
            <Route path="/tracker/session" element={<Navigate to="/tracker" replace />} />
            <Route path="/tracker/select" element={<Navigate to="/tracker" replace />} />
            <Route path="/admin/recorder" element={<AdminRecorder />} />
            {/* Fallback to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

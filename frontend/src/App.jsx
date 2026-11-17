import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ScrollRevealManager from './components/ScrollRevealManager';
import Homepage from './pages/homepage';
import AboutPage from './pages/AboutPage';
import GuidePage from './pages/GuidePage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import CookiePolicy from './pages/CookiePolicy';
import ContactPage from './pages/ContactPage';
import { RealtimeTracker } from './pages/tracker/RealtimeTracker';
import AdminRecorder from './pages/tracker/AdminRecorder';
import ProtectedRoute from './components/ProtectedRoute';
import AuthModal from './components/auth/AuthModal';
import OnboardingModal from './components/auth/OnboardingModal';
import ProfileModal from './components/auth/ProfileModal';
import FloatingThemeToggle from './components/FloatingThemeToggle';
import FloatingGuideToggle from './components/FloatingGuideToggle';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ScrollRevealManager />
          <AuthModal />
          <OnboardingModal />
          <ProfileModal />
          <FloatingThemeToggle />
          <FloatingGuideToggle />
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/contact" element={<ContactPage />} />
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

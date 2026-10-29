import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Homepage from './pages/homepage';
import { RealtimeTracker } from './pages/tracker/RealtimeTracker';
import AdminRecorder from './pages/tracker/AdminRecorder';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/tracker" element={<RealtimeTracker />} />
          {/* Redirect old intermediate routes directly to realtime camera tracker */}
          <Route path="/tracker/session" element={<Navigate to="/tracker" replace />} />
          <Route path="/tracker/select" element={<Navigate to="/tracker" replace />} />
          <Route path="/admin/recorder" element={<AdminRecorder />} />
          {/* Fallback to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

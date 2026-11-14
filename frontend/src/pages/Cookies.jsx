import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Cookies() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState({ functional: false, analytics: false });

  // Load saved preferences on mount
  useEffect(() => {
    const stored = localStorage.getItem('burnitCookiePrefs');
    if (stored) {
      try {
        setPrefs(JSON.parse(stored));
      } catch (_) {}
    }
  }, []);

  const toggle = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const savePrefs = () => {
    localStorage.setItem('burnitCookiePrefs', JSON.stringify(prefs));
    // In a real app you'd also inform any cookie‑handling library here.
    alert('Preferences saved');
  };

  return (
    <main className="min-h-screen font-sans antialiased transition-colors duration-300 bg-[#0e0e12] text-neutral-100">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-orange-500 mb-6">Cookie Policy & Preferences</h1>
        <p className="mb-4">
          BURN IT uses essential cookies required for the website to function. You may optionally enable functional and analytics cookies below.
        </p>
        <div className="space-y-6">
          {/* Essential cookies – always on and disabled */}
          <div className="flex items-center justify-between">
            <span className="text-lg">Essential Cookies (required)</span>
            <button disabled className="px-3 py-1 bg-gray-600 text-white rounded opacity-50 cursor-not-allowed">
              Enabled
            </button>
          </div>
          {/* Functional cookies */}
          <div className="flex items-center justify-between">
            <span className="text-lg">Functional Cookies</span>
            <button
              onClick={() => toggle('functional')}
              className={`px-3 py-1 rounded transition-colors ${prefs.functional ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              {prefs.functional ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          {/* Analytics cookies */}
          <div className="flex items-center justify-between">
            <span className="text-lg">Analytics Cookies</span>
            <button
              onClick={() => toggle('analytics')}
              className={`px-3 py-1 rounded transition-colors ${prefs.analytics ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              {prefs.analytics ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
        <div className="mt-8 flex gap-4">
          <button
            onClick={savePrefs}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
          >
            Save Preferences
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
          >
            ← Back to site
          </button>
        </div>
      </section>
    </main>
  );
}

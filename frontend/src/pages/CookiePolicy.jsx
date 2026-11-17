import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, Sliders, CheckCircle2, ArrowLeft, Save, RotateCcw, Info } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';
import { useTheme } from '../hooks/useTheme';

export default function CookiePolicy() {
  const { darkMode } = useTheme();

  // Load current saved preferences or default to enabled functional cookies
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('burnit_cookie_preferences');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return {
      essential: true, // Always locked to true
      functional: true, // Theme, weight inputs, UI states
      analytics: false, // BURN IT uses zero third-party analytics
    };
  });

  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleSavePreferences = () => {
    try {
      localStorage.setItem('burnit_cookie_preferences', JSON.stringify(preferences));
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 4000);
    } catch (e) {
      console.error('Failed to save preferences:', e);
    }
  };

  const handleAcceptAll = () => {
    const updated = { essential: true, functional: true, analytics: false };
    setPreferences(updated);
    try {
      localStorage.setItem('burnit_cookie_preferences', JSON.stringify(updated));
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectNonEssential = () => {
    const updated = { essential: true, functional: false, analytics: false };
    setPreferences(updated);
    try {
      localStorage.setItem('burnit_cookie_preferences', JSON.stringify(updated));
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <PageWrapper>
      <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Navigation Breadcrumb / Back to Home */}
        <div className="mb-8">
          <Link
            to="/"
            className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-150 rounded-full px-4 py-2 border ${
              darkMode
                ? 'bg-[#181822] border-[#2a2a36] text-neutral-300 hover:text-white hover:border-orange-500/60'
                : 'bg-white border-[#dcd8d2] text-[#4a463f] hover:text-[#17171c] hover:border-orange-500/60'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-orange-500" />
            <span>Return to Home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <Cookie className="w-3.5 h-3.5" />
            <span>Storage & Transparency</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Cookie & Storage Policy
          </h1>
          <p className={`text-base sm:text-lg leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
            BURN IT prioritizes user transparency. We do not use third-party tracking pixels or commercial ad networks. Below are the actual cookies and local storage items utilized by the platform.
          </p>
        </div>

        {/* Notification Toast for Saved Preferences */}
        {savedBanner && (
          <div
            className={`p-4 rounded-xl mb-8 border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
              darkMode
                ? 'bg-[#1a2818] border-green-500/40 text-green-300'
                : 'bg-[#edfcf0] border-green-400/50 text-green-900'
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <span className="text-sm font-semibold">
                Your cookie and storage preferences have been successfully updated and saved!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSavedBanner(false)}
              className="text-xs uppercase font-bold tracking-wider opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Interactive Cookie Preference Management Interface */}
        <section
          className={`p-6 sm:p-8 rounded-2xl border mb-12 shadow-md ${
            darkMode
              ? 'bg-[#151520] border-[#292938] shadow-black/40'
              : 'bg-white border-[#e2ddd5] shadow-neutral-900/5'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Interactive Cookie Preferences</h2>
          </div>
          <p className={`text-sm mb-6 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Manage your personal storage settings below. Essential cookies are required to authenticate your account and ensure platform security.
          </p>

          <div className="space-y-4">
            {/* 1. Essential Category */}
            <div
              className={`p-4 sm:p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                darkMode ? 'bg-[#1b1b28] border-[#2f2f42]' : 'bg-[#faf8f5] border-[#eae5dd]'
              }`}
            >
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base">1. Essential Authentication Storage</h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    Always Required
                  </span>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Stores your secure session token (<code>burnit_token</code>) and cached user identity (<code>burnit_user</code>). These are strictly necessary for logging in, protecting your workout sessions, and saving telemetry to your account.
                </p>
              </div>
              <div className="shrink-0 flex items-center">
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  aria-label="Essential storage (Always active)"
                  className="w-5 h-5 accent-orange-600 cursor-not-allowed opacity-80"
                />
              </div>
            </div>

            {/* 2. Functional Category */}
            <div
              className={`p-4 sm:p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                darkMode ? 'bg-[#1b1b28] border-[#2f2f42]' : 'bg-[#faf8f5] border-[#eae5dd]'
              }`}
            >
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base">2. Functional Preferences</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                      preferences.functional
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
                        : 'bg-neutral-500/15 text-neutral-400 border border-neutral-500/25'
                    }`}
                  >
                    {preferences.functional ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Remembers your interface Dark/Light mode theme (<code>burnit_theme</code>) and your preferred bicep curl barbell/dumbbell weight (<code>burnit_curl_weight_lbs</code>) so you don&apos;t have to re-enter them during every workout.
                </p>
              </div>
              <div className="shrink-0 flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                    className="sr-only peer"
                    aria-label="Toggle functional preference storage"
                  />
                  <div className="w-11 h-6 bg-neutral-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            </div>

            {/* 3. Analytics & Advertising (Disclosed Not Used) */}
            <div
              className={`p-4 sm:p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-75 ${
                darkMode ? 'bg-[#1b1b28] border-[#2f2f42]' : 'bg-[#faf8f5] border-[#eae5dd]'
              }`}
            >
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base">3. Third-Party Analytics & Marketing Pixels</h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-neutral-500/20 text-neutral-400 border border-neutral-500/30">
                    Not Used by BURN IT
                  </span>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  We do not embed third-party marketing pixels (e.g. Google Ads, Facebook Pixel, TikTok) or invasive cross-domain trackers.
                </p>
              </div>
              <div className="shrink-0 flex items-center">
                <input
                  type="checkbox"
                  checked={false}
                  disabled={true}
                  aria-label="Marketing cookies (Not used)"
                  className="w-5 h-5 accent-orange-600 cursor-not-allowed opacity-40"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3 pt-6 border-t border-neutral-700/20">
            <button
              type="button"
              onClick={handleSavePreferences}
              className="px-6 py-2.5 rounded-full bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm shadow-md shadow-orange-600/30 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>

            <button
              type="button"
              onClick={handleAcceptAll}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                darkMode
                  ? 'border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700'
                  : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100'
              }`}
            >
              Accept All
            </button>

            <button
              type="button"
              onClick={handleRejectNonEssential}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                darkMode
                  ? 'border-neutral-700 bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  : 'border-neutral-300 bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              Reject Non-Essential
            </button>
          </div>
        </section>

        {/* Detailed Item Breakdown Table */}
        <section
          className={`p-6 sm:p-8 rounded-2xl border transition-colors ${
            darkMode ? 'bg-[#15151e] border-[#272733]' : 'bg-white border-[#e5e1da]'
          }`}
        >
          <div className="flex items-center gap-2 mb-4 font-bold text-lg text-orange-500">
            <Info className="w-5 h-5" />
            <span>Complete Inventory of Browser Storage Keys</span>
          </div>
          <p className={`text-sm mb-4 leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
            For full technical transparency, here is the exact list of keys used in your browser&apos;s storage:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-neutral-700 text-neutral-300' : 'border-neutral-200 text-neutral-700'}`}>
                  <th className="py-2.5 pr-4 font-semibold">Key Name</th>
                  <th className="py-2.5 px-4 font-semibold">Storage Type</th>
                  <th className="py-2.5 px-4 font-semibold">Purpose</th>
                  <th className="py-2.5 pl-4 font-semibold">Classification</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-neutral-800 text-neutral-300' : 'divide-neutral-200 text-neutral-600'}`}>
                <tr>
                  <td className="py-3 pr-4 font-mono font-semibold text-orange-500">burnit_token</td>
                  <td className="py-3 px-4">LocalStorage / Cookie</td>
                  <td className="py-3 px-4">Cryptographic JWT bearer token authenticating your account.</td>
                  <td className="py-3 pl-4 font-semibold text-orange-400">Strictly Essential</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono font-semibold text-orange-500">burnit_user</td>
                  <td className="py-3 px-4">LocalStorage</td>
                  <td className="py-3 px-4">Cached profile username and display metadata.</td>
                  <td className="py-3 pl-4 font-semibold text-orange-400">Strictly Essential</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono font-semibold text-orange-500">burnit_theme</td>
                  <td className="py-3 px-4">LocalStorage</td>
                  <td className="py-3 px-4">Preserves Dark Mode or Light Mode across visits.</td>
                  <td className="py-3 pl-4 text-emerald-500 font-medium">Functional Preference</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono font-semibold text-orange-500">burnit_curl_weight_lbs</td>
                  <td className="py-3 px-4">LocalStorage</td>
                  <td className="py-3 px-4">Stores your selected dumbbell/barbell poundage for bicep curls.</td>
                  <td className="py-3 pl-4 text-emerald-500 font-medium">Functional Preference</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Return to Home Bottom CTA */}
        <div className="mt-12 pt-8 border-t border-neutral-800/20 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to BURN IT Homepage</span>
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}


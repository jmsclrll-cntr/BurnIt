import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Lock, ArrowRight, Home, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, user, openLogin, openOnboarding } = useAuth();
  const { darkMode } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        openLogin('/tracker');
      } else if (!user?.is_profile_completed) {
        openOnboarding();
      }
    }
  }, [isLoading, isAuthenticated, user, openLogin, openOnboarding]);

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-[#0F0F0F] text-[#F7F7F7]' : 'bg-[#F7F7F7] text-[#0F0F0F]'
          }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-[#3641C9] flex items-center justify-center animate-bounce shadow-lg shadow-[#3641C9]/40 mb-4">
          <Flame className="w-6 h-6 text-white fill-white" />
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 className="w-4 h-4 animate-spin text-[#3641C9] dark:text-[#8A9CF7]" />
          <span>Verifying credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center px-4 ${darkMode ? 'bg-[#0F0F0F] text-[#F7F7F7]' : 'bg-[#F7F7F7] text-[#0F0F0F]'
          }`}
      >
        <div
          className={`max-w-md w-full p-8 rounded-3xl border text-center transition-all shadow-2xl ${darkMode
            ? 'bg-[#16161D] border-[#262630] shadow-black/80'
            : 'bg-white border-[#E2E4E9] shadow-xl'
            }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#3641C9]/10 border border-[#3641C9]/20 text-[#3641C9] dark:text-[#8A9CF7] flex items-center justify-center mx-auto mb-5">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Authentication Required
          </h2>
          <p
            className={`text-sm mb-6 leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-neutral-600'
              }`}
          >
            The Workout Tracker requires an active account to store your reps, posture metrics, and metabolic calorie predictions.
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => openLogin('/tracker')}
              className="w-full py-3.5 px-6 rounded-full bg-[#3641C9] hover:bg-[#2C35A8] active:bg-[#14006A] text-white font-semibold text-sm shadow-lg shadow-[#3641C9]/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Log In to Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to="/"
              className={`w-full py-3 px-6 rounded-full border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${darkMode
                ? 'border-neutral-800 text-neutral-300 hover:bg-neutral-800/60'
                : 'border-[#E2E4E9] text-neutral-700 hover:bg-neutral-100'
                }`}
            >
              <Home className="w-4 h-4" />
              <span>Return to Homepage</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.is_profile_completed) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center px-4 ${darkMode ? 'bg-[#0F0F0F] text-[#F7F7F7]' : 'bg-[#F7F7F7] text-[#0F0F0F]'
          }`}
      >
        <div
          className={`max-w-md w-full p-8 rounded-3xl border text-center transition-all shadow-2xl ${darkMode
            ? 'bg-[#16161D] border-[#262630] shadow-black/80'
            : 'bg-white border-[#E2E4E9] shadow-xl'
            }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#3641C9]/10 border border-[#3641C9]/20 text-[#3641C9] dark:text-[#8A9CF7] flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Profile Setup Required
          </h2>
          <p
            className={`text-sm mb-6 leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-neutral-600'
              }`}
          >
            Please complete your biometric profile (Age, Sex, Weight, Height) before launching the tracker so your workout telemetry can be accurately calculated.
          </p>

          <button
            type="button"
            onClick={openOnboarding}
            className="w-full py-3.5 px-6 rounded-full bg-[#3641C9] hover:bg-[#2C35A8] active:bg-[#14006A] text-white font-semibold text-sm shadow-lg shadow-[#3641C9]/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Complete Profile Setup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return children;
}


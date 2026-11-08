import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  Flame,
  Scale,
  Ruler,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';

export default function UserMenu({ isTransparentNav = false }) {
  const { user, logout, openOnboarding } = useAuth();
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = user.name || user.username;
  const initial = (displayName.charAt(0) || 'U').toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border transition-all ${
          isTransparentNav
            ? 'border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'
            : darkMode
            ? 'border-neutral-800 bg-[#1a1a27] hover:bg-neutral-800 text-white'
            : 'border-neutral-200 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-900'
        }`}
        aria-label="User account menu"
      >
        <div className="w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-orange-600/30">
          {initial}
        </div>
        <span className="text-xs font-semibold max-w-[100px] truncate">
          {displayName}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-orange-500' : 'text-neutral-400'
          }`}
        />
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-72 rounded-2xl border shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
            darkMode
              ? 'bg-[#181826] border-neutral-800 text-white shadow-black/80'
              : 'bg-white border-neutral-200 text-neutral-900 shadow-xl'
          }`}
        >
          {/* User Info Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-neutral-700/40">
            <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-orange-600/30 shrink-0">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm truncate">{displayName}</div>
              <div className="text-xs text-neutral-400 truncate">@{user.username}</div>
            </div>
          </div>

          {/* Biometrics Summary Chips (if completed) */}
          {user.is_profile_completed ? (
            <div className="grid grid-cols-2 gap-2 py-3 border-b border-neutral-700/40 text-[11px]">
              <div
                className={`p-2 rounded-xl flex items-center gap-1.5 ${
                  darkMode ? 'bg-[#14141e]' : 'bg-neutral-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="truncate">{user.age ? `${user.age} yrs` : '—'}</span>
              </div>
              <div
                className={`p-2 rounded-xl flex items-center gap-1.5 ${
                  darkMode ? 'bg-[#14141e]' : 'bg-neutral-50'
                }`}
              >
                <User className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="capitalize truncate">{user.sex || '—'}</span>
              </div>
              <div
                className={`p-2 rounded-xl flex items-center gap-1.5 ${
                  darkMode ? 'bg-[#14141e]' : 'bg-neutral-50'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="truncate">{user.weight ? `${user.weight} kg` : '—'}</span>
              </div>
              <div
                className={`p-2 rounded-xl flex items-center gap-1.5 ${
                  darkMode ? 'bg-[#14141e]' : 'bg-neutral-50'
                }`}
              >
                <Ruler className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="truncate">{user.height ? `${user.height} cm` : '—'}</span>
              </div>
            </div>
          ) : (
            <div className="py-2.5 border-b border-neutral-700/40">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  openOnboarding();
                }}
                className="w-full text-left p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold flex items-center gap-2 hover:bg-orange-500/20 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>Complete Profile Setup</span>
              </button>
            </div>
          )}

          {/* Action List */}
          <div className="pt-2 space-y-1 text-xs font-medium">
            <Link
              to="/tracker"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
                darkMode ? 'hover:bg-neutral-800/80 text-neutral-200' : 'hover:bg-neutral-100 text-neutral-800'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Workout Tracker</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                openOnboarding();
              }}
              className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
                darkMode ? 'hover:bg-neutral-800/80 text-neutral-200' : 'hover:bg-neutral-100 text-neutral-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>Edit Biometric Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-500 transition-colors ${
                darkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
              }`}
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


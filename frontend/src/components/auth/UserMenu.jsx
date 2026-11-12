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
  const { user, logout, openProfileModal } = useAuth();
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
      {/* Trigger Button - Just Profile Icon (Big Icon) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md ${
          isTransparentNav
            ? 'border-white/25 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'
            : darkMode
            ? 'border-neutral-700/80 bg-[#1a1a27] hover:bg-neutral-800 text-white shadow-black/40'
            : 'border-neutral-200 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-900 shadow-neutral-900/10'
        }`}
        title={`Profile: ${displayName}`}
        aria-label="User profile menu"
      >
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm sm:text-base font-bold shadow-sm shadow-orange-600/30">
          {initial}
        </div>
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
            darkMode
              ? 'bg-[#181826] border-neutral-800 text-white shadow-black/80'
              : 'bg-white border-neutral-200 text-neutral-900'
          }`}
        >
          {/* User Info Header */}
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-full bg-[#ea580c] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm text-[#16161a] dark:text-white truncate">{displayName}</div>
              <div className="text-xs text-neutral-400 truncate">@{user.username}</div>
            </div>
          </div>

          <div className="border-t border-neutral-200/80 dark:border-neutral-800 my-1.5" />

          {/* Action List */}
          <div className="space-y-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                openProfileModal();
              }}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-neutral-500" />
              <span>Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-neutral-500" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


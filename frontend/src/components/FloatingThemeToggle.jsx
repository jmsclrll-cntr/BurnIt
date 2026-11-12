import React from 'react';
import { SunMedium, MoonStar } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function FloatingThemeToggle() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <aside aria-label="Theme settings">
      <button
        type="button"
        onClick={toggleDarkMode}
        className={`fixed bottom-6 right-6 z-50 w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md border ${
          darkMode
            ? 'bg-[#181824]/90 hover:bg-[#202030] text-amber-400 border-neutral-700/80 shadow-black/60 hover:border-amber-400/50 hover:shadow-amber-500/20'
            : 'bg-white/90 hover:bg-neutral-50 text-orange-600 border-neutral-200/90 shadow-neutral-900/15 hover:border-orange-500/50 hover:shadow-orange-500/20'
        }`}
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {darkMode ? (
          <SunMedium className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 hover:rotate-45" />
        ) : (
          <MoonStar className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 hover:-rotate-12" />
        )}
      </button>
    </aside>
  );
}


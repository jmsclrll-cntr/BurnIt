import React from 'react';
import { useTheme } from '../hooks/useTheme';

export default function FloatingThemeToggle() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <aside aria-label="Theme settings">
      <button
        type="button"
        onClick={toggleDarkMode}
        style={{
          position: 'fixed',
          right: 'calc(16px + env(safe-area-inset-right, 0px))',
          bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          cursor: 'pointer',
          borderWidth: '1px',
          borderStyle: 'solid',
          backgroundColor: darkMode ? '#16161d' : '#ffffff',
          borderColor: darkMode ? '#2a2a34' : '#dcd8d2',
          color: darkMode ? '#f5f3ef' : '#17171c',
          fontSize: '1.1rem',
          lineHeight: 1,
          transition: 'all 0.2s ease',
        }}
        className="focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ff6a1a] dark:focus-visible:ring-[#ff6a1a] focus-visible:ring-offset-2 hover:opacity-90 active:scale-95 shadow-md"
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>◐</span>
      </button>
    </aside>
  );
}


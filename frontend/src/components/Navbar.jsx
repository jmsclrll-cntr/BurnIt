import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Flame,
  Home,
  ArrowLeft,
  Menu,
  X,
  Maximize,
  Minimize,
  LogOut,
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'
import UserMenu from './auth/UserMenu'

export default function Navbar() {
  const { darkMode, isFullscreen, enterFullScreen } = useTheme()
  const { isAuthenticated, user, openLogin, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Updated navigation: Tracker moved to hero button, Programs -> Workout, Workouts -> Guide, Coaching removed
  const navItems = [
    { label: 'Home', path: '/#home' },
    { label: 'Workout', path: '/#programs' },
    { label: 'Guide', path: '/#coaching' },
    { label: 'About', path: '/#about' },
  ]

  const isHome = location.pathname === '/'
  const isTrackerPage = location.pathname === '/tracker'

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md transition-colors duration-300 border-b ${darkMode
        ? 'bg-[#13131a]/95 border-neutral-800'
        : 'bg-[#FFFFFF]/95 border-neutral-200/80'
        }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo on the left (links to home) */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Flame className="w-4 h-4 text-white fill-white" />
          </div>
          <div
            className={`flex items-center gap-1.5 font-bold text-base tracking-tight ${darkMode ? 'text-white' : 'text-black'
              }`}
          >
            <span>BURN</span>
            <span className="text-orange-600">IT</span>
          </div>
        </Link>

        {/* Center Desktop Navigation (only on non-tracker pages) */}
        {!isTrackerPage ? (
          <nav className="hidden lg:flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              return (
                <a
                  key={item.label}
                  href={isHome ? item.path.replace('/', '') : item.path}
                  className={`px-4 py-2 rounded-full text-sm font-bold tracking-tight transition-colors flex items-center gap-1 ${darkMode
                    ? 'text-neutral-200 hover:text-white hover:bg-neutral-800/60'
                    : 'text-[#202124] hover:text-orange-600 hover:bg-neutral-100'
                    }`}
                >
                  <span>{item.label}</span>
                </a>
              )
            })}
          </nav>
        ) : (
          <div className="hidden lg:block" />
        )}

        {/* Right Desktop Controls - Home (Tracker only), Fullscreen & Profile */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Home Icon Button - Only displayed on Tracker page */}
          {isTrackerPage && (
            <Link
              to="/"
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 border cursor-pointer shadow-md ${darkMode
                ? 'border-neutral-700/80 bg-[#1a1a27] hover:bg-neutral-800 text-neutral-200 shadow-black/40'
                : 'border-neutral-200 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 shadow-neutral-900/10'
                }`}
              title="Home"
              aria-label="Home"
            >
              <Home className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            </Link>
          )}

          {/* Fullscreen Toggle placed right next to Profile Icon */}
          <button
            type="button"
            onClick={() => enterFullScreen()}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 border cursor-pointer shadow-md ${darkMode
              ? 'border-neutral-700/80 bg-[#1a1a27] hover:bg-neutral-800 text-neutral-200 shadow-black/40'
              : 'border-neutral-200 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 shadow-neutral-900/10'
              }`}
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            aria-label={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5 sm:w-6 sm:h-6" /> : <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Profile Icon (Just Profile, No Name) */}
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <button
              type="button"
              onClick={() => openLogin('/tracker')}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${darkMode
                ? 'text-white hover:bg-neutral-800 border border-neutral-700'
                : 'text-neutral-900 hover:bg-neutral-100 border border-neutral-300'
                }`}
            >
              Log In
            </button>
          )}
        </div>

        {/* Mobile Right Controls */}
        <div className="flex sm:hidden items-center gap-1.5">
          {isTrackerPage && (
            <Link
              to="/"
              className={`p-2 rounded-full transition-colors ${darkMode ? 'text-neutral-300' : 'text-neutral-600'}`}
              title="Home"
              aria-label="Home"
            >
              <Home className="w-5 h-5 text-orange-500" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => enterFullScreen()}
            className={`p-2 rounded-full transition-colors ${darkMode ? 'text-neutral-300' : 'text-neutral-600'
              }`}
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            aria-label="Toggle full screen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          {isAuthenticated && (
            <UserMenu />
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-lg ${darkMode ? 'text-neutral-300 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden border-b px-6 py-6 space-y-3 ${darkMode ? 'bg-[#13131a] border-neutral-800' : 'bg-white border-neutral-200'
            }`}
        >
          {isTrackerPage ? (
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 text-base font-bold py-2 text-white hover:text-orange-400"
            >
              <ArrowLeft className="w-5 h-5 text-orange-500" />
              <span>Back to Home</span>
            </Link>
          ) : (
            navItems.map((item) => (
              <a
                key={item.label}
                href={isHome ? item.path.replace('/', '') : item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-base font-bold py-1.5 ${darkMode ? 'text-neutral-200 hover:text-orange-400' : 'text-neutral-800 hover:text-orange-600'
                  }`}
              >
                {item.label}
              </a>
            ))
          )}
          {isAuthenticated ? (
            <div className="pt-3 border-t border-neutral-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{user?.name || user?.username}</div>
                  <div className="text-xs text-neutral-400">@{user?.username}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-neutral-800/40">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLogin('/tracker');
                }}
                className="w-full py-2.5 rounded-full bg-orange-600 text-white text-sm font-bold shadow-md shadow-orange-600/30 text-center"
              >
                Log In
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

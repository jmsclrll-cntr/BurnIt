import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Flame,
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

  const navItems = [
    { label: 'Home', path: '/#home' },
    { label: 'Tracker', path: '/tracker' },
    { label: 'Programs', path: '/#programs' },
    { label: 'Workouts', path: '/#workouts' },
    { label: 'Coaching', path: '/#coaching' },
    { label: 'About', path: '/#about' },
  ]

  const isHome = location.pathname === '/'

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md transition-colors duration-300 border-b ${
        darkMode
          ? 'bg-[#13131a]/95 border-neutral-800'
          : 'bg-[#FFFFFF]/95 border-neutral-200/80'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo on the left */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Flame className="w-4 h-4 text-white fill-white" />
          </div>
          <div
            className={`flex items-center gap-1.5 font-bold text-base tracking-tight ${
              darkMode ? 'text-white' : 'text-black'
            }`}
          >
            <span>BURN</span>
            <span className="text-orange-600">IT</span>
          </div>
        </Link>

        {/* Center Desktop Navigation - Thicker Font, Direct Section Navigation, No Dropdowns */}
        <nav className="hidden lg:flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isTracker = item.path === '/tracker'
            const isCurrent = location.pathname === item.path

            if (item.path.startsWith('/#')) {
              return (
                <a
                  key={item.label}
                  href={isHome ? item.path.replace('/', '') : item.path}
                  className={`px-3.5 py-2 rounded-full text-sm font-semibold tracking-tight transition-colors flex items-center gap-1 ${
                    darkMode
                      ? 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                      : 'text-[#202124] hover:text-orange-600 hover:bg-neutral-100'
                  }`}
                >
                  <span>{item.label}</span>
                </a>
              )
            }

            if (item.path === '/tracker' && !isAuthenticated) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => openLogin('/tracker')}
                  className={`px-3.5 py-2 rounded-full text-sm font-semibold tracking-tight transition-colors flex items-center gap-1.5 ${
                    darkMode
                      ? 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                      : 'text-[#202124] hover:text-orange-600 hover:bg-neutral-100'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse ml-0.5" />
                </button>
              )
            }

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`px-3.5 py-2 rounded-full text-sm font-semibold tracking-tight transition-colors flex items-center gap-1.5 ${
                  isCurrent
                    ? darkMode
                      ? 'text-orange-400 bg-orange-500/10'
                      : 'text-orange-600 bg-orange-50 font-bold'
                    : darkMode
                      ? 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                      : 'text-[#202124] hover:text-orange-600 hover:bg-neutral-100'
                }`}
              >
                <span>{item.label}</span>
                {isTracker && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse ml-0.5" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right Desktop Controls - Fullscreen & Profile Icon Only (Big Icons) */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Fullscreen Toggle placed right next to Profile Icon */}
          <button
            type="button"
            onClick={() => enterFullScreen()}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 border cursor-pointer shadow-md ${
              darkMode
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
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${
                darkMode
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
          <button
            type="button"
            onClick={() => enterFullScreen()}
            className={`p-2 rounded-full transition-colors ${
              darkMode ? 'text-neutral-300' : 'text-neutral-600'
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
            className={`p-2 rounded-lg ${
              darkMode ? 'text-neutral-300 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'
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
          className={`lg:hidden border-b px-6 py-6 space-y-3 ${
            darkMode ? 'bg-[#13131a] border-neutral-800' : 'bg-white border-neutral-200'
          }`}
        >
          {navItems.map((item) => {
            if (item.path.startsWith('/#')) {
              return (
                <a
                  key={item.label}
                  href={isHome ? item.path.replace('/', '') : item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-base font-bold py-1.5 ${
                    darkMode ? 'text-neutral-200 hover:text-orange-400' : 'text-neutral-800 hover:text-orange-600'
                  }`}
                >
                  {item.label}
                </a>
              )
            }
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-base font-bold py-1.5 ${
                  darkMode ? 'text-neutral-200 hover:text-orange-400' : 'text-neutral-800 hover:text-orange-600'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
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

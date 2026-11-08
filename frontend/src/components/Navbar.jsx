import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Flame,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  Maximize,
  Minimize,
  LogOut,
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'
import UserMenu from './auth/UserMenu'

export default function Navbar() {
  const { darkMode, toggleDarkMode, isFullscreen, enterFullScreen } = useTheme()
  const { isAuthenticated, user, openLogin, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const location = useLocation()

  const navDropdowns = {
    Programs: [
      {
        category: 'Training Tracks',
        links: [
          { name: 'HIIT & Sprint Burn', desc: 'Cardiovascular capacity & speed intervals' },
          { name: 'Fat Shred Protocol', desc: 'High-metabolism compound routines' },
          { name: 'Distance & Marathon', desc: 'Aerobic stamina & pacing benchmarks' },
        ],
      },
      {
        category: 'Intensity Levels',
        links: [
          { name: 'Beginner Foundations', desc: 'Biomechanics, posture, and pacing' },
          { name: 'Pro Athlete Track', desc: 'Peak performance and sprint prep' },
        ],
      },
    ],
    Coaching: [
      {
        category: 'Mentorship',
        links: [
          { name: '1-on-1 Elite Coaching', desc: 'Custom plans with Steve Rock' },
          { name: 'Biometric Form Analysis', desc: 'Live video reviews and stride adjustments' },
          { name: 'Nutrition Architecture', desc: 'Targeted caloric and macro guidance' },
        ],
      },
    ],
    Workouts: [
      {
        category: 'Daily Routines',
        links: [
          { name: '15 Min Express Warmup', desc: 'Dynamic mobility & heart-rate primer' },
          { name: '45 Min Power Burn', desc: 'Interval sprint & muscular endurance' },
          { name: 'Recovery & Mobility', desc: 'Foam rolling, yoga & nervous recovery' },
        ],
      },
    ],
  }

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Tracker', path: '/tracker' },
    { label: 'Programs', path: '/#programs', hasDropdown: true },
    { label: 'Workouts', path: '/#programs', hasDropdown: true },
    { label: 'Coaching', path: '/#programs', hasDropdown: true },
  ]

  const isHome = location.pathname === '/'

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md transition-colors duration-300 border-b ${darkMode
          ? 'bg-[#13131a]/95 border-neutral-800'
          : 'bg-[#FFFFFF]/95 border-neutral-200/80'
        }`}
      onMouseLeave={() => setActiveDropdown(null)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
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

        {/* Center Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const hasDropdown = navDropdowns[item.label]
            const isTracker = item.path === '/tracker'
            const isCurrent = location.pathname === item.path

            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => hasDropdown && setActiveDropdown(item.label)}
              >
                {item.path.startsWith('/#') ? (
                  <a
                    href={isHome ? item.path.replace('/', '') : item.path}
                    className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${activeDropdown === item.label
                        ? darkMode
                          ? 'text-orange-500 bg-orange-500/10'
                          : 'text-orange-600 bg-orange-50/80'
                        : darkMode
                          ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                          : 'text-black font-semibold hover:text-orange-600 hover:bg-neutral-100'
                      }`}
                  >
                    <span>{item.label}</span>
                    {hasDropdown && (
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === item.label
                            ? 'rotate-180 text-orange-500'
                            : darkMode
                              ? 'text-neutral-500'
                              : 'text-neutral-700'
                          }`}
                      />
                    )}
                  </a>
                ) : item.path === '/tracker' && !isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => openLogin('/tracker')}
                    className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                      darkMode
                        ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                        : 'text-black font-semibold hover:text-orange-600 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse ml-0.5" />
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${isCurrent
                        ? darkMode
                          ? 'text-orange-400 bg-orange-500/10'
                          : 'text-orange-600 bg-orange-50 font-bold'
                        : darkMode
                          ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                          : 'text-black font-semibold hover:text-orange-600 hover:bg-neutral-100'
                      }`}
                  >
                    <span>{item.label}</span>
                    {isTracker && (
                      <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse ml-0.5" />
                    )}
                  </Link>
                )}
              </div>
            )
          })}
        </nav>

        {/* Right Desktop Controls */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => enterFullScreen()}
            className={`p-2 rounded-full transition-colors ${darkMode
                ? 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            aria-label={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors ${darkMode
                ? 'text-amber-400 hover:bg-neutral-800/80'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 ml-1">
              <Link
                to="/tracker"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-sm font-medium shadow-sm hover:shadow transition-all"
              >
                <span>Workout Tracker</span>
              </Link>
              <UserMenu />
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-1">
              <button
                type="button"
                onClick={() => openLogin('/tracker')}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  darkMode
                    ? 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                    : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => openLogin('/tracker')}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-sm font-medium shadow-sm hover:shadow transition-all"
              >
                <span>Join Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Right Controls */}
        <div className="flex sm:hidden items-center gap-1.5">
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
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors ${darkMode ? 'text-amber-400' : 'text-neutral-600'
              }`}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
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

      {/* Dropdown Mega-Menu Overlay */}
      {activeDropdown && navDropdowns[activeDropdown] && (
        <div
          className={`hidden lg:block absolute left-0 right-0 top-full border-b shadow-xl animate-in fade-in slide-in-from-top-1 duration-150 ${darkMode ? 'bg-[#15151e] border-neutral-800' : 'bg-white border-neutral-200'
            }`}
          onMouseEnter={() => setActiveDropdown(activeDropdown)}
          onMouseLeave={() => setActiveDropdown(null)}
        >
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              {navDropdowns[activeDropdown].map((group, idx) => (
                <div key={idx} className="space-y-3">
                  <div
                    className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-neutral-500' : 'text-neutral-400'
                      }`}
                  >
                    {group.category}
                  </div>
                  <ul className="space-y-2.5">
                    {group.links.map((link, lIdx) => (
                      <li key={lIdx}>
                        <a
                          href="/#programs"
                          onClick={() => setActiveDropdown(null)}
                          className={`group block p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-neutral-800/60' : 'hover:bg-neutral-50'
                            }`}
                        >
                          <div
                            className={`text-sm font-medium transition-colors ${darkMode
                                ? 'text-neutral-200 group-hover:text-orange-400'
                                : 'text-neutral-900 group-hover:text-orange-600'
                              }`}
                          >
                            {link.name}
                          </div>
                          <div
                            className={`text-xs mt-0.5 line-clamp-1 ${darkMode ? 'text-neutral-500' : 'text-neutral-500'
                              }`}
                          >
                            {link.desc}
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden border-b px-6 py-6 space-y-4 ${darkMode ? 'bg-[#13131a] border-neutral-800' : 'bg-white border-neutral-200'
            }`}
        >
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-sm font-medium py-1 ${darkMode
                  ? 'text-neutral-300 hover:text-orange-400'
                  : 'text-neutral-800 hover:text-orange-600'
                }`}
            >
              {item.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <div className="pt-2 border-t border-neutral-800/40 space-y-3">
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
              <Link
                to="/tracker"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2.5 rounded-full bg-orange-600 text-white text-sm font-semibold shadow-md shadow-orange-600/30"
              >
                Launch Workout Tracker
              </Link>
            </div>
          ) : (
            <div className="pt-2 border-t border-neutral-800/40 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLogin('/tracker');
                }}
                className="block text-center w-full py-2.5 rounded-full bg-orange-600 text-white text-sm font-semibold shadow-md shadow-orange-600/30"
              >
                Join Now / Log In
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}


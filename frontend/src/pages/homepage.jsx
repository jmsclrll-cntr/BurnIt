import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Flame,
  ArrowRight,
  Activity,
  Timer,
  Zap,
  Award,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  Maximize,
  Minimize,
  LogOut,
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'
import UserMenu from '../components/auth/UserMenu'


const CURRENT_YEAR = new Date().getFullYear()

export default function Homepage() {
  const { darkMode, toggleDarkMode, isFullscreen, enterFullScreen } = useTheme()
  const { isAuthenticated, user, openLogin, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true)
    }, 60)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  const detectableExercises = [
    {
      id: 'squat',
      title: 'Squat',
      tag: 'Lower Body',
      icon: Activity,
      desc: 'Real-time knee and hip angle tracking, depth verification, and knee alignment feedback.',
      metric: 'Knee Flexion & Depth',
      image: '/gifs/squats.gif',
    },
    {
      id: 'pushup',
      title: 'Push-Up',
      tag: 'Upper Body',
      icon: Flame,
      desc: 'Real-time elbow extension tracking, chest depth verification, and full-body plank alignment.',
      metric: 'Elbow Flexion & Depth',
      image: '/gifs/pushups.gif',
    },
    {
      id: 'plank',
      title: 'Plank',
      tag: 'Core Stability',
      icon: Timer,
      desc: 'Real-time shoulder-hip-ankle line detection with an automated posture hold timer.',
      metric: 'Spine Alignment & Hold Time',
      image: '/gifs/plank.gif',
    },
    {
      id: 'jumpingjack',
      title: 'Jumping Jack',
      tag: 'Cardio Blast',
      icon: Zap,
      desc: 'Real-time overhead arm reach and leg spread cadence tracking with automated rep synchronization.',
      metric: 'Arm Abduction & Cadence',
      image: '/gifs/jumpingjacks.gif',
    },
    {
      id: 'bicepcurl',
      title: 'Bicep Curl',
      tag: 'Arm Isolation',
      icon: Award,
      desc: 'Real-time elbow angle measurement with full range of motion validation and form verification.',
      metric: 'Elbow Flexion Range',
      image: '/gifs/bicepcurls.gif',
    },
  ]

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-300 selection:bg-orange-500/20 selection:text-orange-500 ${darkMode ? 'bg-[#0e0e12] text-neutral-100' : 'bg-[#FFFFFF] text-[#202124]'
        }`}
    >
      {/* ========================================================= */}
      {/* TRANSPARENT OVER HERO / FIXED TOP NAV                     */}
      {/* ========================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? darkMode
              ? 'bg-[#13131a]/90 backdrop-blur-md border-b border-neutral-800 shadow-sm'
              : 'bg-white/90 backdrop-blur-md border-b border-neutral-200/80 shadow-sm'
            : 'bg-transparent border-b border-transparent'
        }`}
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo on the left */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4 text-white fill-white" />
            </div>
            <div
              className={`flex items-center gap-1.5 font-semibold text-base tracking-tight ${
                !scrolled
                  ? 'text-white'
                  : darkMode
                    ? 'text-white'
                    : 'text-[#202124]'
              }`}
            >
              <span>BURN</span>
              <span className="text-orange-600">IT</span>
            </div>
          </a>

          {/* Center Links (Desktop Mega-Menu) */}
          <nav className="hidden lg:flex items-center gap-1">
            {['Home', 'Tracker', 'Programs', 'Workouts', 'Coaching', 'About'].map((item) => {
              const hasDropdown = navDropdowns[item]
              return (
                <div
                  key={item}
                  className="relative"
                  onMouseEnter={() => hasDropdown && setActiveDropdown(item)}
                >
                  {item === 'Tracker' ? (
                    <Link
                      to="/tracker"
                      className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                        !scrolled
                          ? 'text-neutral-200 hover:text-white hover:bg-white/10'
                          : darkMode
                            ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                            : 'text-[#5F6368] hover:text-[#202124] hover:bg-neutral-100'
                      }`}
                    >
                      <span>Tracker</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse ml-0.5" />
                    </Link>
                  ) : (
                    <a
                      href={`#${item.toLowerCase()}`}
                      className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                        activeDropdown === item
                          ? !scrolled
                            ? 'text-orange-400 bg-white/10'
                            : darkMode
                              ? 'text-orange-500 bg-orange-500/10'
                              : 'text-orange-600 bg-orange-50/80'
                          : !scrolled
                            ? 'text-neutral-200 hover:text-white hover:bg-white/10'
                            : darkMode
                              ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                              : 'text-[#5F6368] hover:text-[#202124] hover:bg-neutral-100'
                      }`}
                    >
                      <span>{item}</span>
                      {hasDropdown && (
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            activeDropdown === item
                              ? !scrolled
                                ? 'rotate-180 text-orange-400'
                                : 'rotate-180 text-orange-500'
                              : !scrolled
                                ? 'text-neutral-300'
                                : darkMode
                                  ? 'text-neutral-500'
                                  : 'text-neutral-400'
                          }`}
                        />
                      )}
                    </a>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Right Side: Theme Toggle, Fullscreen & Primary CTA */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => enterFullScreen()}
              className={`p-2 rounded-full transition-colors ${
                !scrolled
                  ? 'text-neutral-200 hover:text-white hover:bg-white/10'
                  : darkMode
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
              className={`p-2 rounded-full transition-colors ${
                !scrolled
                  ? 'text-amber-300 hover:bg-white/10'
                  : darkMode
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
                <UserMenu isTransparentNav={!scrolled} />
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <button
                  type="button"
                  onClick={() => openLogin('/tracker')}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    !scrolled
                      ? 'text-white/90 hover:text-white hover:bg-white/10'
                      : darkMode
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
              className={`p-2 rounded-full transition-colors ${
                !scrolled
                  ? 'text-neutral-200 hover:text-white'
                  : darkMode ? 'text-neutral-300' : 'text-neutral-600'
              }`}
              title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
              aria-label="Toggle full screen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-colors ${
                !scrolled
                  ? 'text-amber-300 hover:bg-white/10'
                  : darkMode ? 'text-amber-400' : 'text-neutral-600'
              }`}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg ${
                !scrolled
                  ? 'text-white hover:bg-white/10'
                  : darkMode ? 'text-neutral-300 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'
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
                            href="#programs"
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

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div
            className={`lg:hidden border-b px-6 py-6 space-y-4 ${darkMode ? 'bg-[#13131a] border-neutral-800' : 'bg-white border-neutral-200'
              }`}
          >
            {['Home', 'Programs', 'Workouts', 'Coaching', 'About'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-sm font-medium py-1 ${darkMode
                  ? 'text-neutral-300 hover:text-orange-400'
                  : 'text-neutral-800 hover:text-orange-600'
                  }`}
              >
                {item}
              </a>
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

      {/* ========================================================= */}
      {/* HERO SECTION (EXACTLY 100VH FULLSCREEN)                   */}
      {/* ========================================================= */}
      <section
        style={{ height: '100vh', minHeight: '100vh' }}
        className="hero-section relative flex items-center justify-center text-center overflow-hidden h-screen min-h-screen w-full px-4 sm:px-6 lg:px-8"
      >
        {/* Responsive Background Image Layer (Cover, Centered, Extends Behind Navbar) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/background/home_background.png"
            alt="Hero Background"
            className={`w-full h-full object-cover object-center select-none transition-transform duration-1000 ease-out will-change-transform ${
              mounted ? 'scale-100' : 'scale-105'
            }`}
          />
          {/* Subtle balanced scrim for crystal-clear image visibility and sharp text contrast */}
          <div
            className={`absolute inset-0 transition-colors duration-300 ${
              darkMode
                ? 'bg-gradient-to-b from-black/55 via-black/35 to-black/50'
                : 'bg-gradient-to-b from-black/50 via-black/30 to-black/45'
            }`}
          />
        </div>

        <noscript>
          <style>{`
            .hero-fade-init {
              opacity: 1 !important;
              transform: none !important;
            }
          `}</style>
        </noscript>

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center justify-center w-full">
          {/* Main Heading */}
          <h1
            style={{
              fontSize: 'clamp(40px, 7vw, 76px)',
              lineHeight: 1.05,
              fontWeight: 800,
            }}
            className={`text-center font-extrabold tracking-tight hero-fade-init transition-all duration-700 ease-out ${
              mounted
                ? 'opacity-100 translate-y-0 blur-0'
                : 'opacity-0 translate-y-7 blur-[3px]'
            } text-white drop-shadow-md`}
          >
            <span className="block whitespace-nowrap">Healthy Body —</span>
            <span className="block whitespace-nowrap">Healthy Life!</span>
          </h1>

          {/* Related Subtitle Text */}
          <p
            className={`mt-6 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-normal hero-fade-init transition-all duration-700 ease-out delay-150 ${
              mounted
                ? 'opacity-100 translate-y-0 blur-0'
                : 'opacity-0 translate-y-7 blur-[3px]'
            } text-neutral-200 drop-shadow`}
          >
            Real-time AI pose tracking, precision joint analysis, and smart repetition counting directly in your browser. Perfect your workout form and ignite your athletic potential.
          </p>

          {/* Action Buttons */}
          <div
            className={`mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 hero-fade-init transition-all duration-700 ease-out delay-300 ${
              mounted
                ? 'opacity-100 translate-y-0 blur-0'
                : 'opacity-0 translate-y-7 blur-[3px]'
            }`}
          >
            {isAuthenticated ? (
              <Link
                to="/tracker"
                className="group btn-glow-pulse inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-base font-semibold shadow-lg shadow-orange-600/30 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
              >
                <span>GET STARTED</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openLogin('/tracker')}
                className="group btn-glow-pulse inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-base font-semibold shadow-lg shadow-orange-600/30 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
              >
                <span>GET STARTED</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            )}
            <a
              href="#programs"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-base font-semibold border border-white/20 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white backdrop-blur-md shadow-sm hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
            >
              <span>COACHING</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FEATURE CARDS / TABS SECTION                           */}
      {/* ========================================================= */}
      <section
        id="programs"
        className={`py-24 sm:py-28 transition-colors duration-300 ${darkMode ? 'bg-[#0e0e12]' : 'bg-[#FFFFFF]'
          }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Supported Movements
            </span>
            <h2
              className={`text-3xl sm:text-4xl font-bold tracking-tight mt-1 ${darkMode ? 'text-white' : 'text-[#202124]'
                }`}
            >
              Exercises the System Can Detect
            </h2>
            <p
              className={`mt-3 text-base ${darkMode ? 'text-neutral-400' : 'text-[#5F6368]'
                }`}
            >
              Real-time 33-point pose estimation, joint angle measurement, and automated rep counting for supported workouts.
            </p>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="mt-12 flex justify-center flex-wrap gap-2 sm:gap-3 scroll-reveal">
            {detectableExercises.map((ex, idx) => {
              const Icon = ex.icon
              const isActive = activeTab === idx
              return (
                <button
                  type="button"
                  key={ex.id}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all ${isActive
                    ? 'bg-orange-600 text-white shadow-sm'
                    : darkMode
                      ? 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
                      : 'bg-[#F1F3F4] text-[#3C4043] hover:bg-neutral-200'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{ex.title}</span>
                </button>
              )
            })}
          </div>

          {/* Active Tab Showcase Card */}
          <div
            key={activeTab}
            className={`mt-10 max-w-4xl mx-auto border rounded-2xl p-6 sm:p-10 shadow-sm transition-all duration-300 animate-in fade-in-50 zoom-in-[0.99] ${darkMode ? 'bg-[#15151e] border-neutral-800' : 'bg-[#F8F9FA] border-neutral-200/80'
              }`}
          >
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b gap-4 ${darkMode ? 'border-neutral-800' : 'border-neutral-200'
                }`}
            >
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold mb-2 ${darkMode
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-orange-100 text-orange-600'
                    }`}
                >
                  {detectableExercises[activeTab].tag}
                </span>
                <h3
                  className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-[#202124]'
                    }`}
                >
                  {detectableExercises[activeTab].title}
                </h3>
                <p
                  className={`text-sm mt-1 max-w-xl ${darkMode ? 'text-neutral-400' : 'text-[#5F6368]'
                    }`}
                >
                  {detectableExercises[activeTab].desc}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <div
                  className={`text-xs uppercase tracking-wider font-semibold ${darkMode ? 'text-neutral-500' : 'text-neutral-400'
                    }`}
                >
                  Tracking Metric
                </div>
                <div
                  className={`text-base font-bold ${darkMode ? 'text-white' : 'text-neutral-900'
                    }`}
                >
                  {detectableExercises[activeTab].metric}
                </div>
              </div>
            </div>

            <div
              className={`mt-6 rounded-xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] border relative flex items-center justify-center ${darkMode ? 'border-neutral-800 bg-neutral-950/60' : 'border-neutral-200 bg-neutral-100'
                }`}
            >
              <img
                src={detectableExercises[activeTab].image}
                alt={detectableExercises[activeTab].title}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                <Link
                  to="/tracker"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all"
                >
                  <span>Track {detectableExercises[activeTab].title}</span>
                  <ChevronRight className="w-4 h-4 text-white" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* HOW TO USE THIS SYSTEM (LIVE WORKFLOW GUIDE)              */}
      {/* ========================================================= */}
      <section
        id="how-to-use"
        className={`py-24 sm:py-28 border-t transition-colors duration-300 ${darkMode ? 'bg-[#121218] border-neutral-800' : 'bg-[#FAFBFD] border-neutral-200/80'
          }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {/* Section Header with Relative Context */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Interactive Biometric Guide
            </span>
            <h2
              className={`text-3xl sm:text-4xl font-bold leading-tight ${darkMode ? 'text-white' : 'text-[#202124]'
                }`}
            >
              How to Use This System
            </h2>
            <p
              className={`text-base sm:text-lg leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-[#5F6368]'
                }`}
            >
              Turn any web browser into your personal AI coach in seconds. Follow these five simple steps to calibrate your camera, track joint angles in real time, and receive instant form corrections without wearing extra sensors or purchasing special equipment.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 scroll-reveal">
              <span className="px-3.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300">
                Zero Wearables Needed
              </span>
              <span className="px-3.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300">
                Real-Time 30+ FPS Kinematics
              </span>
              <span className="px-3.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300">
                100% Client-Side Privacy
              </span>
              <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-orange-600/10 border border-orange-600/20 text-orange-600">
                Instant Form Feedback
              </span>
            </div>
          </div>

          <div className="space-y-24">
            {/* Step 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-4 scroll-reveal">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-orange-600/10 text-orange-600 border border-orange-600/20">
                  Step 01
                </div>
                <h3
                  className={`text-2xl sm:text-3xl font-bold leading-tight ${darkMode ? 'text-white' : 'text-[#202124]'
                    }`}
                >
                  Access the Tracker
                </h3>
                <p
                  className={`text-base leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-[#3c4043]'
                    }`}
                >
                  Launch the biometric training engine directly from the home screen by clicking <strong className="text-orange-600 font-semibold">GET STARTED</strong> in the hero section or <strong className="text-orange-600 font-semibold">Workout Tracker</strong> on the top navigation bar. Simply log in or create your free account to unlock real-time tracking, personalized rep counters, and caloric expenditure analysis.
                </p>
              </div>
              <div
                className={`lg:col-span-7 rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 ${darkMode ? 'border-neutral-800 bg-[#181822]' : 'border-neutral-200 bg-white'
                  }`}
              >
                <img
                  src={darkMode ? '/guide/step-1-access-dark.png' : '/guide/step-1-access-light.png'}
                  alt="Step 1: Access Workout Tracker"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Step 2 (Alternating) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div
                className={`order-2 lg:order-1 lg:col-span-7 rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 ${darkMode ? 'border-neutral-800 bg-[#181822]' : 'border-neutral-200 bg-white'
                  }`}
              >
                <img
                  src={darkMode ? '/guide/step-2-position-dark.png' : '/guide/step-2-position-light.png'}
                  alt="Step 2: Position into camera frame"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="order-1 lg:order-2 lg:col-span-5 space-y-4 scroll-reveal">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-orange-600/10 text-orange-600 border border-orange-600/20">
                  Step 02
                </div>
                <h3
                  className={`text-2xl sm:text-3xl font-bold leading-tight ${darkMode ? 'text-white' : 'text-[#202124]'
                    }`}
                >
                  Align Body in Frame
                </h3>
                <p
                  className={`text-base leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-[#3c4043]'
                    }`}
                >
                  When prompted by your browser, grant camera permissions to activate the biometric engine. Step back approximately 6 to 8 feet so that your shoulders, hips, and knees are unobstructed inside the camera view. The system displays <strong className="text-orange-600 font-semibold">Step Into Camera Frame</strong> with glowing orange alignment indicators that illuminate green as soon as your pose is calibrated.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-4 scroll-reveal">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-orange-600/10 text-orange-600 border border-orange-600/20">
                  Step 03
                </div>
                <h3
                  className={`text-2xl sm:text-3xl font-bold leading-tight ${darkMode ? 'text-white' : 'text-[#202124]'
                    }`}
                >
                  Select Workout Mode
                </h3>
                <p
                  className={`text-base leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-[#3c4043]'
                    }`}
                >
                  Choose your targeted exercise from the workout bar—including <strong className="text-orange-600 font-semibold">Squats</strong>, <strong className="text-orange-600 font-semibold">Push-Ups</strong>, <strong className="text-orange-600 font-semibold">Plank</strong>, <strong className="text-orange-600 font-semibold">Jumping Jacks</strong>, or <strong className="text-orange-600 font-semibold">Bicep Curls</strong>. Alternatively, keep <strong className="text-orange-600 font-semibold">Auto-Detect</strong> active to let our machine learning posture engine automatically sample your biomechanics every 2 seconds and switch exercises as you move.
                </p>
              </div>
              <div
                className={`lg:col-span-7 rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 ${darkMode ? 'border-neutral-800 bg-[#181822]' : 'border-neutral-200 bg-white'
                  }`}
              >
                <img
                  src={darkMode ? '/guide/step-3-select-dark.png' : '/guide/step-3-select-light.png'}
                  alt="Step 3: Select workout mode"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Step 4 (Alternating) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div
                className={`order-2 lg:order-1 lg:col-span-7 rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 ${darkMode ? 'border-neutral-800 bg-[#181822]' : 'border-neutral-200 bg-white'
                  }`}
              >
                <img
                  src={darkMode ? '/guide/step-4-track-dark.png' : '/guide/step-4-track-light.png'}
                  alt="Step 4: Real-time pose tracking"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="order-1 lg:order-2 lg:col-span-5 space-y-4 scroll-reveal">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-orange-600/10 text-orange-600 border border-orange-600/20">
                  Step 04
                </div>
                <h3
                  className={`text-2xl sm:text-3xl font-bold leading-tight ${darkMode ? 'text-white' : 'text-[#202124]'
                    }`}
                >
                  Perform Movement
                </h3>
                <p
                  className={`text-base leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-[#3c4043]'
                    }`}
                >
                  Perform each repetition with complete range of motion. The MediaPipe kinematic engine tracks 33 3D skeletal landmarks at 30+ FPS, rendering visible joint nodes and angle measurements directly over your body. Watch your verified <strong className="text-orange-600 font-semibold">REPS</strong> count update, follow the live movement phase (<strong className="text-orange-600 font-semibold">UP</strong> / <strong className="text-orange-600 font-semibold">DOWN</strong>), and maintain your <strong className="text-orange-600 font-semibold">FORM PRECISION</strong> score.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-4 scroll-reveal">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-orange-600/10 text-orange-600 border border-orange-600/20">
                  Step 05
                </div>
                <h3
                  className={`text-2xl sm:text-3xl font-bold leading-tight ${darkMode ? 'text-white' : 'text-[#202124]'
                    }`}
                >
                  Finish and Review Summary
                </h3>
                <p
                  className={`text-base leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-[#3c4043]'
                    }`}
                >
                  Once you complete your workout set, tap <strong className="text-red-500 font-semibold">Finish Workout</strong> to conclude tracking. The system instantly generates a <strong className="text-orange-600 font-semibold">Workout Complete</strong> report detailing your total completed repetitions, overall form precision percentage, exact session duration, and estimated calories burned, with options to start a new workout or return to the dashboard.
                </p>
              </div>
              <div
                className={`lg:col-span-7 rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 ${darkMode ? 'border-neutral-800 bg-[#181822]' : 'border-neutral-200 bg-white'
                  }`}
              >
                <img
                  src={darkMode ? '/guide/step-5-summary-dark.png' : '/guide/step-5-summary-light.png'}
                  alt="Step 5: Finish workout and review summary"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FINAL DOWNLOAD / CTA SECTION                              */}
      {/* ========================================================= */}
      <section
        id="join"
        className={`py-24 sm:py-32 border-t text-center transition-colors duration-300 ${darkMode ? 'bg-[#121218] border-neutral-800' : 'bg-[#FAFBFD] border-neutral-200/80'
          }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`w-14 h-14 mx-auto rounded-2xl border flex items-center justify-center shadow-sm mb-6 ${darkMode
              ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
              : 'bg-orange-50 border-orange-200 text-orange-600'
              }`}
          >
            <Flame className="w-7 h-7 fill-orange-600" />
          </div>

          <h2
            className={`text-3xl sm:text-5xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-[#202124]'
              }`}
          >
            Start Your Transformation with Burn It
          </h2>

          <p
            className={`mt-4 text-base sm:text-lg max-w-xl mx-auto ${darkMode ? 'text-neutral-400' : 'text-[#5F6368]'
              }`}
          >
            Join Steve Rock’s elite training community. Build unstoppable stamina, shred excess fat, and conquer every milestone.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => alert('Welcome to Burn It! Registration starting...')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Flame className="w-4 h-4 fill-white" />
              <span>Join Burn It Now</span>
            </button>

            <a
              href="#programs"
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-semibold border shadow-sm transition-all ${darkMode
                ? 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-100 border-neutral-700'
                : 'bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-800 border-neutral-300'
                }`}
            >
              <span>Explore All Programs</span>
            </a>
          </div>

          <div className={`mt-6 text-xs ${darkMode ? 'text-neutral-500' : 'text-[#5F6368]'}`}>
            Instant access to daily workout guides and coaching schedules.
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* CLOSING TAGLINE                                           */}
      {/* ========================================================= */}
      <section
        className={`py-20 sm:py-28 border-t text-center transition-colors duration-300 ${darkMode ? 'bg-[#0e0e12] border-neutral-800' : 'bg-[#FFFFFF] border-neutral-200/80'
          }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2
            className={`text-5xl sm:text-6xl md:text-7xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-neutral-900'
              }`}
          >
            Ignite your potential<span className="text-orange-600">.</span>
          </h2>
          <p className={`mt-4 text-base sm:text-lg ${darkMode ? 'text-neutral-400' : 'text-[#5F6368]'}`}>
            Push past your limits and burn the rest.
          </p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* CLEAN MULTI-COLUMN FOOTER                                 */}
      {/* ========================================================= */}
      <footer
        className={`border-t py-16 text-xs transition-colors duration-300 ${darkMode
          ? 'bg-[#0a0a0d] border-neutral-800 text-neutral-400'
          : 'bg-[#F8F9FA] border-neutral-200 text-[#5F6368]'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b ${darkMode ? 'border-neutral-800' : 'border-neutral-200'
              }`}
          >
            <div>
              <div className={`font-semibold mb-3 text-sm ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                Programs
              </div>
              <ul className="space-y-2">
                <li><a href="#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>HIIT & Sprint Burn</a></li>
                <li><a href="#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Fat Shred Protocol</a></li>
                <li><a href="#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Distance & Marathon</a></li>
                <li><a href="#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>1-on-1 Pro Coaching</a></li>
              </ul>
            </div>

            <div>
              <div className={`font-semibold mb-3 text-sm ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                Workouts
              </div>
              <ul className="space-y-2">
                <li><a href="#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>15 Min Warmup</a></li>
                <li><a href="#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>45 Min Sprint Blast</a></li>
                <li><a href="#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Mobility & Stride Drill</a></li>
                <li><a href="#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Nutrition Guide</a></li>
              </ul>
            </div>

            <div>
              <div className={`font-semibold mb-3 text-sm ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                Coaching
              </div>
              <ul className="space-y-2">
                <li><a href="#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Steve Rock Bio</a></li>
                <li><a href="#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Biometric Tracking</a></li>
                <li><a href="#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Athlete Reviews</a></li>
                <li><a href="#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Schedule Consultation</a></li>
              </ul>
            </div>

            <div>
              <div className={`font-semibold mb-3 text-sm ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                Company
              </div>
              <ul className="space-y-2">
                <li><a href="#" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>About Burn It</a></li>
                <li><a href="#" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Community</a></li>
                <li><a href="#" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Careers</a></li>
                <li><a href="#" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Contact Support</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-orange-600 flex items-center justify-center">
                <Flame className="w-3 h-3 text-white fill-white" />
              </div>
              <span className={`font-semibold text-sm ${darkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>
                BURN IT
              </span>
              <span>© {CURRENT_YEAR} Burn It Fitness. All rights reserved.</span>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <a href="#" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Privacy</a>
              <a href="#" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Terms</a>
              <a href="#" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Cookies</a>
              <a href="#" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

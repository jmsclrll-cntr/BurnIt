import { useState, useEffect, useRef } from 'react'
import {
  Flame,
  ArrowRight,
  Play,
  Activity,
  Timer,
  Zap,
  Award,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  ChevronDown,
  Sun,
  Moon,
  Maximize,
  Minimize,
} from 'lucide-react'

const RUNNER_BG =
  'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=2000&q=80'

const CURRENT_YEAR = new Date().getFullYear()

export default function Homepage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('burnit_theme')
        if (saved) return saved === 'dark'
        return window.matchMedia('(prefers-color-scheme: dark)').matches
      } catch {
        return false
      }
    }
    return false
  })

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev
      try {
        localStorage.setItem('burnit_theme', next ? 'dark' : 'light')
      } catch {
        // ignore
      }
      return next
    })
  }

  const [isFullscreen, setIsFullscreen] = useState(false)
  const heroVideoRef = useRef(null)

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement)
      setIsFullscreen(active)
      if (active) {
        document.documentElement.classList.add('fullscreen-active')
      } else {
        document.documentElement.classList.remove('fullscreen-active')
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.documentElement.classList.remove('fullscreen-active')
    }
  }, [])

  /**
   * Enters or toggles full screen mode
   * @param {HTMLElement} [element] - Target element to expand (defaults to page root)
   */
  const enterFullScreen = async (element = document.documentElement) => {
    try {
      if (!document.fullscreenElement) {
        const target = element || document.documentElement
        if (target.requestFullscreen) {
          await target.requestFullscreen()
        } else if (target.webkitRequestFullscreen) {
          await target.webkitRequestFullscreen()
        } else if (target.msRequestFullscreen) {
          await target.msRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen()
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen()
        }
      }
    } catch (err) {
      console.error('Error toggling full screen:', err)
    }
  }

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

  const programFeatures = [
    {
      id: 'hiit',
      title: 'HIIT & Sprint Burn',
      tag: 'Endurance',
      icon: Activity,
      desc: 'Accelerate cardiovascular capacity with high-burst intervals, metabolic surges, and active recovery phases.',
      metric: '850+ KCAL Burned',
      image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'shred',
      title: 'Fat Shred Protocol',
      tag: 'Metabolism',
      icon: Flame,
      desc: 'Maximize metabolic burn during and after workouts with compound exercises, sprint intervals, and progressive overload.',
      metric: '48hr Afterburn Rate',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'distance',
      title: 'Distance & Marathon',
      tag: 'Stamina',
      icon: Timer,
      desc: 'Build unstoppable stamina, biomechanical efficiency, and mental grit across road, trail, and athletic tracks.',
      metric: "3'45\" /KM Target Pace",
      image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'coaching',
      title: '1-on-1 Pro Coaching',
      tag: 'VIP Elite',
      icon: Award,
      desc: 'Personalized training schedule, biometric feedback, and continuous video form analysis tailored directly by Steve Rock.',
      metric: 'Dedicated Mentorship',
      image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80',
    },
  ]

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-300 selection:bg-orange-500/20 selection:text-orange-500 ${
        darkMode ? 'bg-[#0e0e12] text-neutral-100' : 'bg-[#FFFFFF] text-[#202124]'
      }`}
    >
      {/* ========================================================= */}
      {/* STICKY TOP NAV                                            */}
      {/* ========================================================= */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-md transition-colors duration-300 border-b ${
          darkMode
            ? 'bg-[#13131a]/95 border-neutral-800'
            : 'bg-[#FFFFFF]/95 border-neutral-200/80'
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
                darkMode ? 'text-white' : 'text-[#202124]'
              }`}
            >
              <span>BURN</span>
              <span className="text-orange-600">IT</span>
            </div>
          </a>

          {/* Center Links (Desktop Mega-Menu) */}
          <nav className="hidden lg:flex items-center gap-1">
            {['Home', 'Programs', 'Workouts', 'Coaching', 'About'].map((item) => {
              const hasDropdown = navDropdowns[item]
              return (
                <div
                  key={item}
                  className="relative"
                  onMouseEnter={() => hasDropdown && setActiveDropdown(item)}
                >
                  <a
                    href={`#${item.toLowerCase()}`}
                    className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                      activeDropdown === item
                        ? darkMode
                          ? 'text-orange-500 bg-orange-500/10'
                          : 'text-orange-600 bg-orange-50/80'
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
                            ? 'rotate-180 text-orange-500'
                            : darkMode
                            ? 'text-neutral-500'
                            : 'text-neutral-400'
                        }`}
                      />
                    )}
                  </a>
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
                darkMode
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
                darkMode
                  ? 'text-amber-400 hover:bg-neutral-800/80'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <a
              href="#join"
              className="ml-1 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-sm font-medium shadow-sm hover:shadow transition-all"
            >
              <span>Join Now</span>
            </a>
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
            <button
              type="button"
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-colors ${
                darkMode ? 'text-amber-400' : 'text-neutral-600'
              }`}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
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

        {/* Dropdown Mega-Menu Overlay */}
        {activeDropdown && navDropdowns[activeDropdown] && (
          <div
            className={`hidden lg:block absolute left-0 right-0 top-full border-b shadow-xl animate-in fade-in slide-in-from-top-1 duration-150 ${
              darkMode ? 'bg-[#15151e] border-neutral-800' : 'bg-white border-neutral-200'
            }`}
            onMouseEnter={() => setActiveDropdown(activeDropdown)}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <div className="max-w-7xl mx-auto px-8 py-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                {navDropdowns[activeDropdown].map((group, idx) => (
                  <div key={idx} className="space-y-3">
                    <div
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        darkMode ? 'text-neutral-500' : 'text-neutral-400'
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
                            className={`group block p-2 rounded-lg transition-colors ${
                              darkMode ? 'hover:bg-neutral-800/60' : 'hover:bg-neutral-50'
                            }`}
                          >
                            <div
                              className={`text-sm font-medium transition-colors ${
                                darkMode
                                  ? 'text-neutral-200 group-hover:text-orange-400'
                                  : 'text-neutral-900 group-hover:text-orange-600'
                              }`}
                            >
                              {link.name}
                            </div>
                            <div
                              className={`text-xs mt-0.5 line-clamp-1 ${
                                darkMode ? 'text-neutral-500' : 'text-neutral-500'
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
            className={`lg:hidden border-b px-6 py-6 space-y-4 ${
              darkMode ? 'bg-[#13131a] border-neutral-800' : 'bg-white border-neutral-200'
            }`}
          >
            {['Home', 'Programs', 'Workouts', 'Coaching', 'About'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-sm font-medium py-1 ${
                  darkMode
                    ? 'text-neutral-300 hover:text-orange-400'
                    : 'text-neutral-800 hover:text-orange-600'
                }`}
              >
                {item}
              </a>
            ))}
            <a
              href="#join"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center w-full py-2.5 rounded-full bg-orange-600 text-white text-sm font-medium"
            >
              Join Now
            </a>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* HERO SECTION                                              */}
      {/* ========================================================= */}
      <section
        className={`pt-20 sm:pt-28 pb-16 sm:pb-24 text-center transition-colors duration-300 ${
          darkMode
            ? 'bg-gradient-to-b from-[#0e0e12] via-[#121218] to-[#15151e]'
            : 'bg-gradient-to-b from-white via-[#FAFBFD] to-[#F1F3F4]/50'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 border ${
              darkMode
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                : 'bg-orange-50 border-orange-200/80 text-orange-600'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            BURN IT ELITE TRAINING
          </div>

          <h1
            className={`text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.08] ${
              darkMode ? 'text-white' : 'text-[#202124]'
            }`}
          >
            Healthy Body —<br />
            <span>Healthy Life!</span>
          </h1>

          <p
            className={`mt-6 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed font-normal ${
              darkMode ? 'text-neutral-400' : 'text-[#5F6368]'
            }`}
          >
            Steve Rock — elite endurance & strength coach in NY. Push past your limits and ignite every muscle.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#join"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-base font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <span>GET STARTED</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#programs"
              className={`inline-flex items-center justify-center px-8 py-3.5 rounded-full text-base font-semibold border shadow-sm transition-all ${
                darkMode
                  ? 'bg-neutral-800/80 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-100 border-neutral-700'
                  : 'bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-800 border-neutral-300'
              }`}
            >
              <span>COACHING</span>
            </a>
          </div>

          <div
            className={`mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs ${
              darkMode ? 'text-neutral-400' : 'text-[#5F6368]'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 font-medium ${
                darkMode ? 'text-neutral-300' : 'text-neutral-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              <span>Certified Pro Trainer</span>
            </div>
            <span className={`hidden sm:inline ${darkMode ? 'text-neutral-700' : 'text-neutral-300'}`}>•</span>
            <div
              className={`flex items-center gap-1.5 font-medium ${
                darkMode ? 'text-neutral-300' : 'text-neutral-700'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span>5,000+ Transformations</span>
            </div>
            <span className={`hidden sm:inline ${darkMode ? 'text-neutral-700' : 'text-neutral-300'}`}>•</span>
            <span>Available on iOS, Android & Web</span>
          </div>

          {/* HERO ATHLETIC RUNNER PREVIEW */}
          <div
            ref={heroVideoRef}
            className={`mt-16 relative rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden group bg-neutral-950 ${
              darkMode ? 'border-neutral-800' : 'border-neutral-200/90'
            }`}
          >
            {/* Media Fullscreen Button */}
            <button
              type="button"
              onClick={() => enterFullScreen(heroVideoRef.current)}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/50 hover:bg-black/75 text-white/90 backdrop-blur-md border border-white/20 transition-all opacity-80 hover:opacity-100"
              title="Full screen view"
              aria-label="Full screen view"
            >
              <Maximize className="w-4 h-4" />
            </button>
            <img
              src={RUNNER_BG}
              alt="Guy running athletic training"
              className="w-full aspect-[16/10] sm:aspect-[16/9] object-cover object-center filter brightness-[0.92] contrast-[1.05]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {!isPlaying && (
              <div className="absolute inset-0 bg-neutral-950/25 backdrop-blur-[1px] flex items-center justify-center transition-all group-hover:bg-neutral-950/20">
                <button
                  type="button"
                  onClick={() => setIsPlaying(true)}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white hover:bg-neutral-100 text-orange-600 flex items-center justify-center shadow-2xl transition-all transform group-hover:scale-110 active:scale-95"
                  aria-label="Watch running routine"
                >
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-orange-600 ml-1" />
                </button>
              </div>
            )}

            <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center justify-between gap-3 text-left">
              <div className="flex flex-wrap gap-3">
                <div
                  className={`backdrop-blur-md border px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-3 ${
                    darkMode
                      ? 'bg-[#181822]/90 border-neutral-700 text-white'
                      : 'bg-white/90 border-neutral-200 text-neutral-900'
                  }`}
                >
                  <Flame className="w-5 h-5 text-orange-600 fill-orange-600" />
                  <div>
                    <div className="text-sm font-bold">850 KCAL</div>
                    <div
                      className={`text-[10px] uppercase tracking-wider ${
                        darkMode ? 'text-neutral-400' : 'text-neutral-500'
                      }`}
                    >
                      Avg. Burn Per Session
                    </div>
                  </div>
                </div>

                <div
                  className={`backdrop-blur-md border px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-3 ${
                    darkMode
                      ? 'bg-[#181822]/90 border-neutral-700 text-white'
                      : 'bg-white/90 border-neutral-200 text-neutral-900'
                  }`}
                >
                  <Zap className="w-5 h-5 text-amber-500" />
                  <div>
                    <div className="text-sm font-bold">3&apos;45&quot; /KM</div>
                    <div
                      className={`text-[10px] uppercase tracking-wider ${
                        darkMode ? 'text-neutral-400' : 'text-neutral-500'
                      }`}
                    >
                      Endurance Pace Target
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block text-xs text-white/90 font-medium bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-lg border border-white/10">
                Watch Running Routine • 15 Min Warmup
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FEATURE CARDS / TABS SECTION                           */}
      {/* ========================================================= */}
      <section
        id="programs"
        className={`py-24 sm:py-28 border-t transition-colors duration-300 ${
          darkMode ? 'bg-[#0e0e12] border-neutral-800' : 'bg-[#FFFFFF] border-neutral-200/80'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Our Programs
            </span>
            <h2
              className={`text-3xl sm:text-4xl font-bold tracking-tight mt-1 ${
                darkMode ? 'text-white' : 'text-[#202124]'
              }`}
            >
              Designed to Make You Burn
            </h2>
            <p
              className={`mt-3 text-base ${
                darkMode ? 'text-neutral-400' : 'text-[#5F6368]'
              }`}
            >
              High-intensity cardio, track sprint protocols, and powerlifting fundamentals engineered by champion coaches.
            </p>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="mt-12 flex justify-center flex-wrap gap-2 sm:gap-3">
            {programFeatures.map((prog, idx) => {
              const Icon = prog.icon
              const isActive = activeTab === idx
              return (
                <button
                  type="button"
                  key={prog.id}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-sm'
                      : darkMode
                      ? 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
                      : 'bg-[#F1F3F4] text-[#3C4043] hover:bg-neutral-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{prog.title}</span>
                </button>
              )
            })}
          </div>

          {/* Active Tab Showcase Card */}
          <div
            className={`mt-10 max-w-4xl mx-auto border rounded-2xl p-6 sm:p-10 shadow-sm transition-colors duration-300 ${
              darkMode ? 'bg-[#15151e] border-neutral-800' : 'bg-[#F8F9FA] border-neutral-200/80'
            }`}
          >
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b gap-4 ${
                darkMode ? 'border-neutral-800' : 'border-neutral-200'
              }`}
            >
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold mb-2 ${
                    darkMode
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  {programFeatures[activeTab].tag}
                </span>
                <h3
                  className={`text-2xl font-bold ${
                    darkMode ? 'text-white' : 'text-[#202124]'
                  }`}
                >
                  {programFeatures[activeTab].title}
                </h3>
                <p
                  className={`text-sm mt-1 max-w-xl ${
                    darkMode ? 'text-neutral-400' : 'text-[#5F6368]'
                  }`}
                >
                  {programFeatures[activeTab].desc}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <div
                  className={`text-xs uppercase tracking-wider font-semibold ${
                    darkMode ? 'text-neutral-500' : 'text-neutral-400'
                  }`}
                >
                  Benchmark
                </div>
                <div
                  className={`text-base font-bold ${
                    darkMode ? 'text-white' : 'text-neutral-900'
                  }`}
                >
                  {programFeatures[activeTab].metric}
                </div>
              </div>
            </div>

            <div
              className={`mt-6 rounded-xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] border relative ${
                darkMode ? 'border-neutral-800' : 'border-neutral-200'
              }`}
            >
              <img
                src={programFeatures[activeTab].image}
                alt={programFeatures[activeTab].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-6">
                <a
                  href="#join"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-bold uppercase tracking-wider shadow-md transition-all"
                >
                  <span>Start This Program</span>
                  <ChevronRight className="w-4 h-4 text-orange-600" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* ALTERNATING TEXT + IMAGE SECTIONS                         */}
      {/* ========================================================= */}
      <section
        className={`py-24 sm:py-28 border-t space-y-24 transition-colors duration-300 ${
          darkMode ? 'bg-[#121218] border-neutral-800' : 'bg-[#FAFBFD] border-neutral-200/80'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {/* Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Endurance & Interval Training
              </span>
              <h3
                className={`text-3xl sm:text-4xl font-bold leading-tight ${
                  darkMode ? 'text-white' : 'text-[#202124]'
                }`}
              >
                Accelerate cardiovascular capacity with high-burst sprint intervals.
              </h3>
              <p
                className={`text-base leading-relaxed ${
                  darkMode ? 'text-neutral-400' : 'text-[#5F6368]'
                }`}
              >
                Engineered to spike your heart rate and trigger long-lasting metabolic burn. Each session synchronizes sprint pacing, heart-rate recovery, and progressive aerobic capacity.
              </p>
              <div className="pt-2">
                <a
                  href="#programs"
                  className="text-sm font-semibold text-orange-600 hover:underline inline-flex items-center gap-1"
                >
                  Explore sprint protocols <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div
              className={`lg:col-span-6 rounded-2xl overflow-hidden border shadow-md ${
                darkMode ? 'border-neutral-800 bg-[#181822]' : 'border-neutral-200 bg-white'
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=1000&q=80"
                alt="Sprint track training"
                className="w-full h-80 object-cover"
              />
            </div>
          </div>

          {/* Row 2 (Alternating) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div
              className={`order-2 lg:order-1 lg:col-span-6 rounded-2xl overflow-hidden border shadow-md ${
                darkMode ? 'border-neutral-800 bg-[#181822]' : 'border-neutral-200 bg-white'
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80"
                alt="Power conditioning"
                className="w-full h-80 object-cover"
              />
            </div>
            <div className="order-1 lg:order-2 lg:col-span-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Metabolic Fat Shred
              </span>
              <h3
                className={`text-3xl sm:text-4xl font-bold leading-tight ${
                  darkMode ? 'text-white' : 'text-[#202124]'
                }`}
              >
                Compound movements designed to incinerate fat and sculpt lean power.
              </h3>
              <p
                className={`text-base leading-relaxed ${
                  darkMode ? 'text-neutral-400' : 'text-[#5F6368]'
                }`}
              >
                Targeting both fast-twitch strength fibers and endurance energy pathways. Steve Rock’s regimen maintains high intensity with precision posture to prevent injury and unlock maximum power output.
              </p>
              <div className="pt-2">
                <a
                  href="#programs"
                  className="text-sm font-semibold text-orange-600 hover:underline inline-flex items-center gap-1"
                >
                  View strength fundamentals <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Personal Coaching & Form Analysis
              </span>
              <h3
                className={`text-3xl sm:text-4xl font-bold leading-tight ${
                  darkMode ? 'text-white' : 'text-[#202124]'
                }`}
              >
                1-on-1 mentorship with data-driven biometric milestones.
              </h3>
              <p
                className={`text-base leading-relaxed ${
                  darkMode ? 'text-neutral-400' : 'text-[#5F6368]'
                }`}
              >
                Continuous video stride adjustments, pace threshold tracking, and customized nutrition planning. Get the exact guidance needed to crush personal records and stay motivated week after week.
              </p>
              <div className="pt-2">
                <a
                  href="#join"
                  className="text-sm font-semibold text-orange-600 hover:underline inline-flex items-center gap-1"
                >
                  Apply for coaching <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div
              className={`lg:col-span-6 rounded-2xl overflow-hidden border shadow-md ${
                darkMode ? 'border-neutral-800 bg-[#181822]' : 'border-neutral-200 bg-white'
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1000&q=80"
                alt="Coaching and form review"
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* STATS OVERVIEW                                            */}
      {/* ========================================================= */}
      <section
        className={`py-20 border-t transition-colors duration-300 ${
          darkMode ? 'bg-[#0e0e12] border-neutral-800' : 'bg-[#FFFFFF] border-neutral-200/80'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: '12K+', label: 'Athletes Trained' },
              { val: '98%', label: 'Success Rate' },
              { val: '45+', label: 'Training Modules' },
              { val: '24/7', label: 'Coach Support' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-colors ${
                  darkMode
                    ? 'bg-[#15151e] border-neutral-800'
                    : 'bg-[#F8F9FA] border-neutral-200/80'
                }`}
              >
                <div
                  className={`text-3xl sm:text-4xl font-bold tracking-tight ${
                    darkMode ? 'text-white' : 'text-[#202124]'
                  }`}
                >
                  {stat.val}
                </div>
                <div
                  className={`text-xs uppercase tracking-wider font-semibold mt-1 ${
                    darkMode ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FINAL DOWNLOAD / CTA SECTION                              */}
      {/* ========================================================= */}
      <section
        id="join"
        className={`py-24 sm:py-32 border-t text-center transition-colors duration-300 ${
          darkMode ? 'bg-[#121218] border-neutral-800' : 'bg-[#FAFBFD] border-neutral-200/80'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`w-14 h-14 mx-auto rounded-2xl border flex items-center justify-center shadow-sm mb-6 ${
              darkMode
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                : 'bg-orange-50 border-orange-200 text-orange-600'
            }`}
          >
            <Flame className="w-7 h-7 fill-orange-600" />
          </div>

          <h2
            className={`text-3xl sm:text-5xl font-bold tracking-tight ${
              darkMode ? 'text-white' : 'text-[#202124]'
            }`}
          >
            Start Your Transformation with Burn It
          </h2>

          <p
            className={`mt-4 text-base sm:text-lg max-w-xl mx-auto ${
              darkMode ? 'text-neutral-400' : 'text-[#5F6368]'
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
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-semibold border shadow-sm transition-all ${
                darkMode
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
        className={`py-20 sm:py-28 border-t text-center transition-colors duration-300 ${
          darkMode ? 'bg-[#0e0e12] border-neutral-800' : 'bg-[#FFFFFF] border-neutral-200/80'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2
            className={`text-5xl sm:text-6xl md:text-7xl font-black tracking-tight ${
              darkMode ? 'text-white' : 'text-neutral-900'
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
        className={`border-t py-16 text-xs transition-colors duration-300 ${
          darkMode
            ? 'bg-[#0a0a0d] border-neutral-800 text-neutral-400'
            : 'bg-[#F8F9FA] border-neutral-200 text-[#5F6368]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b ${
              darkMode ? 'border-neutral-800' : 'border-neutral-200'
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

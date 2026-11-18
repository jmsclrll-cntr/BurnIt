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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  Maximize,
  Minimize,
  LogOut,
  Check,
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'
import UserMenu from '../components/auth/UserMenu'
import AboutBurnIt from '../components/AboutBurnIt'
import ExerciseDetectorSection from '../components/ExerciseDetectorSection'
import Footer from '../components/Footer'
import GuideWalkthrough from '../components/GuideWalkthrough'


const CURRENT_YEAR = new Date().getFullYear()

export default function Homepage() {
  const { darkMode, toggleDarkMode, isFullscreen, enterFullScreen } = useTheme()
  const { isAuthenticated, user, openLogin, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true)
    }, 60)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)

      // Section scroll spy to highlight active nav link
      const sections = ['about', 'coaching', 'programs', 'home']
      for (const id of sections) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 140) {
            setActiveSection(id)
            break
          }
        }
      }
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

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 selection:bg-[#3641C9]/20 selection:text-[#3641C9] ${darkMode ? 'bg-[#0F0F0F] text-[#F7F7F7]' : 'bg-[#F7F7F7] text-[#0F0F0F]'
      }`}
    >
      {/* ========================================================= */}
      {/* TRANSPARENT OVER HERO / FIXED TOP NAV */}
      {/* ========================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? darkMode
            ? 'bg-[#0F0F0F]/90 backdrop-blur-md border-b border-[#262630] shadow-sm'
            : 'bg-[#F7F7F7]/90 backdrop-blur-md border-b border-[#E2E4E9] shadow-sm'
          : 'bg-transparent border-b border-transparent'
          }`}
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo on the left */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#3641C9] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <Flame className="w-4 h-4 text-white fill-white" />
            </div>
            <div className="flex items-center gap-1.5 font-bold text-base tracking-tight select-none">
              <span className="text-black">
                BURN
              </span>
              <span className="text-[#3641C9]">IT</span>
            </div>
          </a>

          {/* Center Links (Light Floating Pill Nav) */}
          <nav
            className={`hidden lg:flex items-center gap-[2px] p-[5px] rounded-full border transition-colors duration-150 ${darkMode
              ? 'bg-[#16161D] border-[#262630] shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
              : 'bg-[#FFFFFF] border-[#E2E4E9] shadow-[0_2px_8px_rgba(15,15,15,0.06)]'
              }`}
            style={{ fontFamily: "'Inter', sans-serif" }}
            aria-label="Primary navigation"
          >
            {[
              { label: 'Home', target: 'home' },
              { label: 'Workout', target: 'programs' },
              { label: 'Guide', target: 'coaching' },
              { label: 'About', target: 'about' },
            ].map((item) => {
              const isActive = activeSection === item.target;
              return (
                <a
                  key={item.label}
                  href={`#${item.target}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSection(item.target);
                    if (item.target === 'home') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      const el = document.getElementById(item.target);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }}
                  className={`px-3 sm:px-[18px] py-[7px] rounded-full text-[14px] leading-none tracking-normal transition-colors duration-150 ease-in-out select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${darkMode
                    ? 'focus-visible:outline-[#8A9CF7]'
                    : 'focus-visible:outline-[#3641C9]'
                    } ${isActive
                      ? darkMode
                        ? 'bg-[#3641C9]/25 text-[#8A9CF7] font-semibold'
                        : 'bg-[#3641C9]/10 text-[#3641C9] font-semibold'
                      : darkMode
                        ? 'text-[#A3A3B0] font-medium hover:bg-[#1E1E28] hover:text-[#F7F7F7]'
                        : 'text-[#5D5D68] font-medium hover:bg-[#EBEBEF] hover:text-[#0F0F0F]'
                    }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

      {/* Right Side:Fullscreen & Profile Icon Only (Big Icons) */ }
              <div className="hidden sm:flex items-center gap-3">
                {/* Fullscreen Toggle placed right next to Profile Icon */}
                <button
                  type="button"
                  onClick={() => enterFullScreen()}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 border cursor-pointer shadow-md ${!scrolled
                    ? 'border-white/25 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'
                    : darkMode
                      ? 'border-neutral-700/80 bg-[#16161D] hover:bg-neutral-800 text-neutral-200 shadow-black/40'
                      : 'border-[#E2E4E9] bg-white hover:bg-[#eae6e1] text-[#0F0F0F] shadow-sm'
                    }`}
                  title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
                  aria-label={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
                >
                  {isFullscreen ? <Minimize className="w-5 h-5 sm:w-6 sm:h-6" /> : <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>

                {/* Profile Icon (Profile only, no name) */}
                {isAuthenticated ? (
                  <UserMenu isTransparentNav={!scrolled} />
                ) : (
                  <button
                    type="button"
                    onClick={() => openLogin('/tracker')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${!scrolled
                      ? 'text-white hover:bg-white/10 border border-white/20'
                      : darkMode
                        ? 'text-white hover:bg-neutral-800 border border-neutral-700'
                        : 'text-[#0F0F0F] hover:bg-white border border-[#E2E4E9]'
                      }`}
                  >
                    Log In
                  </button>
                )
                }
              </div>

              {/* Mobile Right Controls */ }
              <div className="flex sm:hidden items-center gap-1.5" >
                <button
                  type="button"
                  onClick={() => enterFullScreen()}
                  className={`p-2 rounded-full transition-colors ${!scrolled
                    ? 'text-neutral-200 hover:text-white'
                    : darkMode ? 'text-neutral-300' : 'text-[#0F0F0F]'
                    }`}
                  title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
                  aria-label="Toggle full screen"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
                {isAuthenticated && (
                  <UserMenu isTransparentNav={!scrolled} />
                )}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`p-2 rounded-lg ${!scrolled
                    ? 'text-white hover:bg-white/10'
                    : darkMode ? 'text-neutral-300 hover:bg-neutral-800' : 'text-[#0F0F0F] hover:bg-[#eae6e1]'
                    } `}
                  aria-label="Toggle navigation menu"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className={`lg:hidden border-b px-6 py-6 space-y-3 ${darkMode ? 'bg-[#16161D] border-[#262630]' : 'bg-[#F7F7F7] border-[#E2E4E9]'
            } `}
          >
            {[
              { label: 'Home', target: 'home' },
              { label: 'Workout', target: 'programs' },
              { label: 'Guide', target: 'coaching' },
              { label: 'About', target: 'about' },
            ].map((item) => (
              <a
                key={item.label}
                href={`#${item.target}`}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  if (item.target === 'home') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    const el = document.getElementById(item.target);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }
                }}
                className={`block text-base font-bold py-1.5 ${darkMode ? 'text-neutral-200 hover:text-[#8A9CF7]' : 'text-neutral-800 hover:text-[#3641C9]'
                  } `}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-2">
              <Link
                to="/tracker"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#3641C9] hover:bg-[#2C35A8] text-white text-sm font-bold shadow-md shadow-[#3641C9]/30"
              >
                <span>Workout Tracker</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
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
                  className="w-full py-2.5 rounded-full bg-[#3641C9] hover:bg-[#2C35A8] text-white text-sm font-bold shadow-md shadow-[#3641C9]/30 text-center"
                >
                  Log In
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* HERO SECTION (EXACTLY 100VH FULLSCREEN) */}
      {/* ========================================================= */}
      <section
        id="home"
        style={{ height: '100vh', minHeight: '100vh' }}
        className="hero-section relative flex items-center justify-center text-center overflow-hidden h-screen min-h-screen w-full px-4 sm:px-6 lg:px-8"
      >
        {/* Responsive Background Image Layer (Cover, Centered, Extends Behind Navbar) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/background/home_background.png"
            alt="Hero Background"
            className={`w-full h-full object-cover object-center select-none transition-transform duration-1000 ease-out will-change-transform ${mounted ? 'scale-100' : 'scale-105'
              } `}
          />
          {/* Subtle balanced scrim for crystal-clear image visibility and sharp text contrast */}
          <div className={`absolute inset-0 transition-colors duration-300 ${darkMode
            ? 'bg-gradient-to-b from-black/55 via-black/35 to-black/50'
            : 'bg-gradient-to-b from-black/50 via-black/30 to-black/45'
            } `}
          />
        </div>

        <noscript>
          <style>{`
  .hero-fade-init {
  opacity:1!important;
  transform:none!important;
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
            className={`text-center font-extrabold tracking-tight hero-fade-init transition-all duration-700 ease-out ${mounted
              ? 'opacity-100 translate-y-0 blur-0'
              : 'opacity-0 translate-y-7 blur-[3px]'
              } text-white drop-shadow-md`}
          >
            <span className="block whitespace-nowrap">Healthy Body —</span>
            <span className="block whitespace-nowrap">Healthy Life!</span>
          </h1>

          {/* Related Subtitle Text */}
          <p
            className={`mt-6 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-normal hero-fade-init transition-all duration-700 ease-out delay-150 ${mounted
              ? 'opacity-100 translate-y-0 blur-0'
              : 'opacity-0 translate-y-7 blur-[3px]'
              } text-neutral-200 drop-shadow`}
          >
            Real-time AI pose tracking, precision joint analysis, and smart repetition counting directly in your browser. Perfect your workout form and ignite your athletic potential.
          </p>

          {/* Action Buttons */}
          <div className={`mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 hero-fade-init transition-all duration-700 ease-out delay-300 ${mounted
            ? 'opacity-100 translate-y-0 blur-0'
            : 'opacity-0 translate-y-7 blur-[3px]'
            } `}
          >
            {isAuthenticated ? (
              <Link
                to="/tracker"
                className="group btn-glow-pulse inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-full bg-[#3641C9] hover:bg-[#2C35A8] active:bg-[#14006A] text-white text-base sm:text-lg font-black tracking-wide shadow-xl shadow-[#3641C9]/35 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
              >
                <span>WORKOUT TRACKER</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openLogin('/tracker')}
                className="group btn-glow-pulse inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-full bg-[#3641C9] hover:bg-[#2C35A8] active:bg-[#14006A] text-white text-base sm:text-lg font-black tracking-wide shadow-xl shadow-[#3641C9]/35 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer"
              >
                <span>WORKOUT TRACKER</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* EXERCISES THE SYSTEM CAN DETECT */}
      {/* ========================================================= */}
      <ExerciseDetectorSection />

      {/* ========================================================= */}
      {/* HOW TO USE BURN IT / GUIDE SECTION                        */}
      {/* ========================================================= */}
      <section
        id="coaching"
        className={`py-20 sm:py-24 border-t scroll-mt-16 transition-colors duration-300 ${darkMode ? 'bg-[#0F0F0F] border-[#262630]' : 'bg-[#F7F7F7] border-[#E2E4E9]'
          }`}
      >
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
          <GuideWalkthrough />
        </div>
      </section>

      {/* ========================================================= */}
      {/* ABOUT BURN IT SECTION (DIRECTLY AFTER GUIDE SECTION) */}
      {/* ========================================================= */}
      <AboutBurnIt />

      {/* ========================================================= */}
      {/* REDESIGNED MINIMAL FOOTER */}
      {/* ========================================================= */}
      <Footer />
    </div>
  )
}

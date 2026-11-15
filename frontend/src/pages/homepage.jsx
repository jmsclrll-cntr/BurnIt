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
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'
import UserMenu from '../components/auth/UserMenu'
import AboutBurnIt from '../components/AboutBurnIt'
import ExerciseDetectorSection from '../components/ExerciseDetectorSection'
import Footer from '../components/Footer'


const CURRENT_YEAR = new Date().getFullYear()

export default function Homepage() {
  const { darkMode, toggleDarkMode, isFullscreen, enterFullScreen } = useTheme()
  const { isAuthenticated, user, openLogin, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-300 selection:bg-orange-500/20 selection:text-orange-500 ${darkMode ? 'bg-[#0e0e13] text-[#f5f3ef]' : 'bg-[#f6f4f1] text-[#17171c]'
        }`}
    >
      {/* ========================================================= */}
      {/* TRANSPARENT OVER HERO / FIXED TOP NAV                     */}
      {/* ========================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
            ? darkMode
                ? 'bg-[#0e0e13]/90 backdrop-blur-md border-b border-[#2a2a34] shadow-sm'
                : 'bg-[#f6f4f1]/90 backdrop-blur-md border-b border-[#dcd8d2] shadow-sm'
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
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4 text-white fill-white" />
            </div>
            <div
              className={`flex items-center gap-1.5 font-bold text-base tracking-tight ${!scrolled
                  ? 'text-white'
                  : darkMode
                    ? 'text-white'
                    : 'text-[#17171c]'
              }`}
            >
            <span>BURN</span>
            <span className="text-orange-600">IT</span>
        </div>
      </a>

      {/* Center Links (Visible, High Contrast, Updated Items: Home, Workout, Guide, About) */}
      <nav className="hidden lg:flex items-center gap-1.5 sm:gap-2.5 bg-black/50 backdrop-blur-md px-5 py-2 rounded-full border border-white/20 shadow-xl">
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
              if (item.target === 'home') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                const el = document.getElementById(item.target);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }
            }}
            className="px-4 py-1.5 rounded-full text-[15px] font-extrabold tracking-tight text-white hover:text-orange-400 hover:bg-white/15 transition-all duration-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
          >
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      {/* Right Side: Fullscreen & Profile Icon Only (Big Icons) */}
      <div className="hidden sm:flex items-center gap-3">
        {/* Fullscreen Toggle placed right next to Profile Icon */}
        <button
          type="button"
          onClick={() => enterFullScreen()}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 border cursor-pointer shadow-md ${!scrolled
              ? 'border-white/25 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'
              : darkMode
                ? 'border-neutral-700/80 bg-[#1a1a27] hover:bg-neutral-800 text-neutral-200 shadow-black/40'
                    : 'border-[#dcd8d2] bg-white hover:bg-[#eae6e1] text-[#17171c] shadow-sm'
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
                    : 'text-[#17171c] hover:bg-white border border-[#dcd8d2]'
                }`}
              >
      Log In
    </button>
  )
}
          </div >

  {/* Mobile Right Controls */ }
  < div className = "flex sm:hidden items-center gap-1.5" >
    <button
      type="button"
      onClick={() => enterFullScreen()}
      className={`p-2 rounded-full transition-colors ${!scrolled
          ? 'text-neutral-200 hover:text-white'
                  : darkMode ? 'text-neutral-300' : 'text-[#17171c]'
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
              className={`p - 2 rounded - lg ${
  !scrolled
    ? 'text-white hover:bg-white/10'
                  : darkMode ? 'text-neutral-300 hover:bg-neutral-800' : 'text-[#17171c] hover:bg-[#eae6e1]'
} `}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div
            className={`lg:hidden border - b px - 6 py - 6 space - y - 3 ${
  darkMode ? 'bg-[#16161d] border-[#2a2a34]' : 'bg-[#f6f4f1] border-[#dcd8d2]'
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
                href={`#${ item.target } `}
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
                className={`block text - base font - bold py - 1.5 ${
  darkMode ? 'text-neutral-200 hover:text-orange-400' : 'text-neutral-800 hover:text-orange-600'
} `}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-2">
              <Link
                to="/tracker"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-orange-600 text-white text-sm font-bold shadow-md shadow-orange-600/30"
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
                  className="w-full py-2.5 rounded-full bg-orange-600 text-white text-sm font-bold shadow-md shadow-orange-600/30 text-center"
                >
                  Log In
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
        id="home"
        style={{ height: '100vh', minHeight: '100vh' }}
        className="hero-section relative flex items-center justify-center text-center overflow-hidden h-screen min-h-screen w-full px-4 sm:px-6 lg:px-8"
      >
        {/* Responsive Background Image Layer (Cover, Centered, Extends Behind Navbar) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/background/home_background.png"
            alt="Hero Background"
            className={`w - full h - full object - cover object - center select - none transition - transform duration - 1000 ease - out will - change - transform ${
  mounted ? 'scale-100' : 'scale-105'
} `}
          />
          {/* Subtle balanced scrim for crystal-clear image visibility and sharp text contrast */}
          <div
            className={`absolute inset - 0 transition - colors duration - 300 ${
  darkMode
    ? 'bg-gradient-to-b from-black/55 via-black/35 to-black/50'
    : 'bg-gradient-to-b from-black/50 via-black/30 to-black/45'
} `}
          />
        </div>

        <noscript>
          <style>{`
  .hero - fade - init {
  opacity: 1!important;
  transform: none!important;
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
            className={`text - center font - extrabold tracking - tight hero - fade - init transition - all duration - 700 ease - out ${
  mounted
    ? 'opacity-100 translate-y-0 blur-0'
    : 'opacity-0 translate-y-7 blur-[3px]'
} text - white drop - shadow - md`}
          >
            <span className="block whitespace-nowrap">Healthy Body —</span>
            <span className="block whitespace-nowrap">Healthy Life!</span>
          </h1>

          {/* Related Subtitle Text */}
          <p
            className={`mt - 6 text - base sm: text - lg md: text - xl max - w - 2xl mx - auto leading - relaxed font - normal hero - fade - init transition - all duration - 700 ease - out delay - 150 ${
  mounted
    ? 'opacity-100 translate-y-0 blur-0'
    : 'opacity-0 translate-y-7 blur-[3px]'
} text - neutral - 200 drop - shadow`}
          >
            Real-time AI pose tracking, precision joint analysis, and smart repetition counting directly in your browser. Perfect your workout form and ignite your athletic potential.
          </p>

          {/* Action Buttons */}
          <div
            className={`mt - 8 sm: mt - 10 flex flex - col sm: flex - row items - center justify - center gap - 4 hero - fade - init transition - all duration - 700 ease - out delay - 300 ${
  mounted
    ? 'opacity-100 translate-y-0 blur-0'
    : 'opacity-0 translate-y-7 blur-[3px]'
} `}
          >
            {isAuthenticated ? (
              <Link
                to="/tracker"
                className="group btn-glow-pulse inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-base sm:text-lg font-black tracking-wide shadow-xl shadow-orange-600/35 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
              >
                <span>WORKOUT TRACKER</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openLogin('/tracker')}
                className="group btn-glow-pulse inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-base sm:text-lg font-black tracking-wide shadow-xl shadow-orange-600/35 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer"
              >
                <span>WORKOUT TRACKER</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* EXERCISES THE SYSTEM CAN DETECT                           */}
      {/* ========================================================= */}
      <ExerciseDetectorSection />

      {/* ========================================================= */}
      {/* HOW TO USE THIS SYSTEM (LIVE WORKFLOW GUIDE)              */}
      {/* ========================================================= */}
      <section
        id="coaching"
        className={`py - 24 sm: py - 28 border - t transition - colors duration - 300 ${
  darkMode ? 'bg-[#0e0e13] border-[#2a2a34]' : 'bg-[#f6f4f1] border-[#dcd8d2]'
} `}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {/* Section Header with Relative Context */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Interactive Biometric Guide
            </span>
            <h2
              className={`text - 3xl sm: text - 4xl font - bold leading - tight ${
  darkMode ? 'text-white' : 'text-[#17171c]'
} `}
            >
              How to Use This System
            </h2>
            <p
              className={`text - base sm: text - lg leading - relaxed ${
  darkMode ? 'text-neutral-300' : 'text-[#5d5d68]'
} `}
            >
              Turn any web browser into your personal AI coach in seconds. Follow these five simple steps to calibrate your camera, track joint angles in real time, and receive instant form corrections without wearing extra sensors or purchasing special equipment.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 scroll-reveal">
              <span className="px-3.5 py-1 rounded-full text-xs font-medium bg-white/80 dark:bg-white/5 border border-[#dcd8d2] dark:border-white/10 text-[#5d5d68] dark:text-neutral-300">
                Zero Wearables Needed
              </span>
              <span className="px-3.5 py-1 rounded-full text-xs font-medium bg-white/80 dark:bg-white/5 border border-[#dcd8d2] dark:border-white/10 text-[#5d5d68] dark:text-neutral-300">
                Real-Time 30+ FPS Kinematics
              </span>
              <span className="px-3.5 py-1 rounded-full text-xs font-medium bg-white/80 dark:bg-white/5 border border-[#dcd8d2] dark:border-white/10 text-[#5d5d68] dark:text-neutral-300">
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
                  className={`text - 2xl sm: text - 3xl font - bold leading - tight ${
  darkMode ? 'text-white' : 'text-[#17171c]'
} `}
                >
                  Access the Tracker
                </h3>
                <p
                  className={`text - base leading - relaxed ${
  darkMode ? 'text-neutral-300' : 'text-[#5d5d68]'
} `}
                >
                  Launch the biometric training engine directly from the home screen by clicking <strong className="text-orange-600 font-semibold">GET STARTED</strong> in the hero section or <strong className="text-orange-600 font-semibold">Workout Tracker</strong> on the top navigation bar. Simply log in or create your free account to unlock real-time tracking, personalized rep counters, and caloric expenditure analysis.
                </p>
              </div>
              <div
                className={`lg: col - span - 7 rounded - 2xl overflow - hidden border shadow - lg transition - all duration - 300 ${
  darkMode ? 'border-[#2a2a34] bg-[#16161d]' : 'border-[#dcd8d2] bg-white'
} `}
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
                className={`order - 2 lg: order - 1 lg: col - span - 7 rounded - 2xl overflow - hidden border shadow - lg transition - all duration - 300 ${
  darkMode ? 'border-[#2a2a34] bg-[#16161d]' : 'border-[#dcd8d2] bg-white'
} `}
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
                  className={`text - 2xl sm: text - 3xl font - bold leading - tight ${
  darkMode ? 'text-white' : 'text-[#17171c]'
} `}
                >
                  Align Body in Frame
                </h3>
                <p
                  className={`text - base leading - relaxed ${
  darkMode ? 'text-neutral-300' : 'text-[#5d5d68]'
} `}
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
                  className={`text - 2xl sm: text - 3xl font - bold leading - tight ${
  darkMode ? 'text-white' : 'text-[#17171c]'
} `}
                >
                  Select Workout Mode
                </h3>
                <p
                  className={`text - base leading - relaxed ${
  darkMode ? 'text-neutral-300' : 'text-[#5d5d68]'
} `}
                >
                  Choose your targeted exercise from the workout bar—including <strong className="text-orange-600 font-semibold">Squats</strong>, <strong className="text-orange-600 font-semibold">Push-Ups</strong>, <strong className="text-orange-600 font-semibold">Plank</strong>, <strong className="text-orange-600 font-semibold">Jumping Jacks</strong>, or <strong className="text-orange-600 font-semibold">Bicep Curls</strong>. Alternatively, keep <strong className="text-orange-600 font-semibold">Auto-Detect</strong> active to let our machine learning posture engine automatically sample your biomechanics every 2 seconds and switch exercises as you move.
                </p>
              </div>
              <div
                className={`lg: col - span - 7 rounded - 2xl overflow - hidden border shadow - lg transition - all duration - 300 ${
  darkMode ? 'border-[#2a2a34] bg-[#16161d]' : 'border-[#dcd8d2] bg-white'
} `}
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
                className={`order - 2 lg: order - 1 lg: col - span - 7 rounded - 2xl overflow - hidden border shadow - lg transition - all duration - 300 ${
  darkMode ? 'border-[#2a2a34] bg-[#16161d]' : 'border-[#dcd8d2] bg-white'
} `}
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
                  className={`text - 2xl sm: text - 3xl font - bold leading - tight ${
  darkMode ? 'text-white' : 'text-[#17171c]'
} `}
                >
                  Perform Movement
                </h3>
                <p
                  className={`text - base leading - relaxed ${
  darkMode ? 'text-neutral-300' : 'text-[#5d5d68]'
} `}
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
                  className={`text - 2xl sm: text - 3xl font - bold leading - tight ${
  darkMode ? 'text-white' : 'text-[#17171c]'
} `}
                >
                  Finish and Review Summary
                </h3>
                <p
                  className={`text - base leading - relaxed ${
  darkMode ? 'text-neutral-300' : 'text-[#5d5d68]'
} `}
                >
                  Once you complete your workout set, tap <strong className="text-red-500 font-semibold">Finish Workout</strong> to conclude tracking. The system instantly generates a <strong className="text-orange-600 font-semibold">Workout Complete</strong> report detailing your total completed repetitions, overall form precision percentage, exact session duration, and estimated calories burned, with options to start a new workout or return to the dashboard.
                </p>
              </div>
              <div
                className={`lg: col - span - 7 rounded - 2xl overflow - hidden border shadow - lg transition - all duration - 300 ${
  darkMode ? 'border-[#2a2a34] bg-[#16161d]' : 'border-[#dcd8d2] bg-white'
} `}
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
      {/* ABOUT BURN IT SECTION (DIRECTLY AFTER GUIDE SECTION)      */}
      {/* ========================================================= */}
      <AboutBurnIt />

      {/* ========================================================= */}
      {/* REDESIGNED MINIMAL FOOTER                                 */}
      {/* ========================================================= */}
      <Footer />
    </div>
  )
}

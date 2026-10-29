import { useState } from 'react'
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
} from 'lucide-react'

// Athletic male runner background image (Unsplash high-resolution fitness photography)
const RUNNER_BG =
  'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=2000&q=80'

const CURRENT_YEAR = new Date().getFullYear()

export default function Homepage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0e0e11] text-neutral-100 font-sans antialiased selection:bg-orange-600 selection:text-white">
      {/* ========================================================= */}
      {/* MATERIAL APP BAR / NAVIGATION                             */}
      {/* ========================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#121216]/90 backdrop-blur-md border-b border-neutral-800/80 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-md bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-600/30 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 text-white fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-wider text-white uppercase leading-none">
                BURN <span className="text-orange-500">IT</span>
              </span>
              <span className="text-[10px] tracking-widest text-neutral-400 uppercase font-semibold">
                Fitness & Power
              </span>
            </div>
          </a>

          {/* Desktop Nav Links (Material Flat Style) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {['Home', 'Programs', 'Workouts', 'Coaching', 'About'].map((item, idx) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className={`px-4 py-2 rounded text-sm font-medium tracking-wide uppercase transition-colors ${
                  idx === 0
                    ? 'text-orange-400 bg-orange-500/10'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                {item}
              </a>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden sm:flex items-center gap-3">
            <button className="px-5 py-2.5 rounded bg-transparent hover:bg-neutral-800/80 text-neutral-300 hover:text-white text-xs font-bold tracking-widest uppercase transition-all">
              Sign In
            </button>
            <button className="px-5 py-2.5 rounded bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-xs font-bold tracking-widest uppercase shadow-md hover:shadow-orange-600/25 transition-all">
              Join Now
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#16161b] border-b border-neutral-800 px-6 py-5 space-y-3 animate-in fade-in slide-in-from-top-2">
            {['Home', 'Programs', 'Workouts', 'Coaching', 'About'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm uppercase tracking-wider text-neutral-200 hover:text-orange-400"
              >
                {item}
              </a>
            ))}
            <div className="pt-4 border-t border-neutral-800 flex flex-col gap-2">
              <button className="w-full py-2.5 rounded bg-orange-600 text-white text-xs font-bold tracking-widest uppercase">
                Join Now
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* HERO SECTION (Matches Reference Image Layout)             */}
      {/* ========================================================= */}
      <section className="relative min-h-screen pt-20 flex items-center overflow-hidden bg-[#0a0a0d]">
        {/* RIGHT SIDE: Guy running background with cinematic dark vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src={RUNNER_BG}
            alt="Guy running athletic training"
            className="w-full h-full object-cover object-center sm:object-right filter brightness-[0.78] contrast-[1.12]"
          />
          {/* Material Dark Gradients & Overlays */}
          {/* Left-to-right gradient to blend smoothly into the dark card background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0d] via-[#0a0a0d]/90 to-transparent lg:w-3/5" />
          {/* Top and bottom subtle vignettes */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-transparent to-[#0a0a0d]/60" />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* HERO CONTAINER & FLOATING MATERIAL CARD */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* LEFT / CENTER-LEFT: Elevated Dark Material Box */}
            <div className="lg:col-span-7 xl:col-span-6">
              <div className="relative bg-[#16161a]/95 backdrop-blur-md rounded-none md:rounded-sm p-8 sm:p-12 lg:p-14 shadow-2xl border border-neutral-800/80 transition-all hover:border-neutral-700/80">
                {/* Brand Accent Bar */}
                <div className="w-12 h-1 bg-orange-500 mb-6" />

                {/* Subtitle / Category Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-sm mb-6 text-xs uppercase tracking-widest font-semibold text-orange-400">
                  <Flame className="w-3.5 h-3.5" />
                  BURN IT ELITE TRAINING
                </div>

                {/* Hero Title (Identical bold style as user's reference image) */}
                <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-black text-white leading-[1.08] tracking-tight uppercase">
                  Healthy Body —<br />
                  <span className="text-neutral-100">Healthy Life!</span>
                </h1>

                {/* Tagline / Subtitle */}
                <p className="mt-5 text-sm sm:text-base text-neutral-400 font-normal tracking-wide max-w-md">
                  Steve Rock — elite endurance & strength coach in NY. Push past your limits and ignite every muscle.
                </p>

                {/* Action Buttons (Matches Reference Image) */}
                <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4">
                  {/* Primary Button: Solid White Flat/Material style with arrow */}
                  <button className="group inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-white hover:bg-neutral-100 active:bg-neutral-200 text-black font-extrabold text-xs sm:text-sm tracking-widest uppercase rounded-none md:rounded-sm shadow-lg hover:shadow-white/20 active:translate-y-0.5 transition-all">
                    <span>GET STARTED</span>
                    <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Secondary Button: Dark Flat / Outlined style */}
                  <button className="inline-flex items-center justify-center px-8 py-3.5 bg-transparent hover:bg-white/5 active:bg-white/10 text-white font-bold text-xs sm:text-sm tracking-widest uppercase border border-neutral-700 hover:border-neutral-500 rounded-none md:rounded-sm transition-all">
                    COACHING
                  </button>
                </div>

                {/* Coach Trust Indicator */}
                <div className="mt-10 pt-8 border-t border-neutral-800/80 flex items-center gap-6 text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-orange-500" />
                    <span>Certified Pro Trainer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span>5,000+ Transformations</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE FLOATING MATERIAL METRICS BADGES */}
            <div className="hidden lg:flex lg:col-span-5 xl:col-span-6 flex-col items-end gap-5">
              {/* Badge 1: Calories Burned */}
              <div className="bg-[#16161a]/85 backdrop-blur-md border border-neutral-800 p-4 rounded-sm shadow-xl flex items-center gap-4 max-w-xs hover:border-orange-500/50 transition-all">
                <div className="w-12 h-12 rounded bg-orange-600/20 text-orange-500 flex items-center justify-center">
                  <Flame className="w-6 h-6 fill-orange-500" />
                </div>
                <div>
                  <div className="text-xl font-black text-white tracking-wide">850 KCAL</div>
                  <div className="text-[11px] text-neutral-400 uppercase tracking-wider">
                    Avg. Burn Per Session
                  </div>
                </div>
              </div>

              {/* Badge 2: Pace / Sprint speed */}
              <div className="bg-[#16161a]/85 backdrop-blur-md border border-neutral-800 p-4 rounded-sm shadow-xl flex items-center gap-4 max-w-xs hover:border-orange-500/50 transition-all">
                <div className="w-12 h-12 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xl font-black text-white tracking-wide">3&apos;45&quot; /KM</div>
                  <div className="text-[11px] text-neutral-400 uppercase tracking-wider">
                    Endurance Pace Target
                  </div>
                </div>
              </div>

              {/* Badge 3: Video Workout Preview */}
              <div className="bg-[#16161a]/85 backdrop-blur-md border border-neutral-800 p-4 rounded-sm shadow-xl flex items-center gap-4 max-w-xs group cursor-pointer hover:border-orange-500/50 transition-all">
                <div className="w-12 h-12 rounded bg-white text-black flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Play className="w-5 h-5 fill-black ml-0.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Watch Running Routine
                  </div>
                  <div className="text-[11px] text-neutral-400">15 Min HIIT Warmup</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* PROGRAMS & FEATURES SECTION (Flat / Material Cards)       */}
      {/* ========================================================= */}
      <section id="programs" className="py-24 bg-[#111115] border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <div className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-2">
                Our Programs
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                Designed to Make You <span className="text-orange-500">Burn</span>
              </h2>
            </div>
            <p className="text-sm text-neutral-400 max-w-md">
              High-intensity cardio, track sprint protocols, and powerlifting fundamentals engineered by champion coaches.
            </p>
          </div>

          {/* Material Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Activity,
                title: 'HIIT & Sprint Burn',
                desc: 'Accelerate cardiovascular capacity with high-burst intervals and recovery phases.',
                tag: 'Endurance',
                color: 'text-orange-400',
              },
              {
                icon: Flame,
                title: 'Fat Shred Protocol',
                desc: 'Maximize metabolic burn during and after workouts with compound exercises.',
                tag: 'Metabolism',
                color: 'text-amber-400',
              },
              {
                icon: Timer,
                title: 'Distance & Marathon',
                desc: 'Build unstoppable stamina, biomechanical efficiency, and mental grit on road and track.',
                tag: 'Stamina',
                color: 'text-orange-500',
              },
              {
                icon: Award,
                title: '1-on-1 Pro Coaching',
                desc: 'Personalized training schedule, biometric feedback, and form analysis by Steve Rock.',
                tag: 'VIP Elite',
                color: 'text-amber-300',
              },
            ].map((card, i) => {
              const Icon = card.icon
              return (
                <div
                  key={i}
                  className="group relative bg-[#18181e] p-8 rounded-none md:rounded-sm border border-neutral-800 hover:border-orange-500/60 shadow-lg hover:shadow-orange-600/10 hover:-translate-y-1 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded flex items-center justify-center group-hover:bg-orange-600 group-hover:border-orange-600 group-hover:text-white transition-colors">
                        <Icon className={`w-6 h-6 ${card.color} group-hover:text-white transition-colors`} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-sm">
                        {card.tag}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-wide mb-3">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs font-bold text-orange-400 group-hover:text-orange-300">
                    <span>EXPLORE PROGRAM</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* STATS BANNER                                              */}
      {/* ========================================================= */}
      <section className="py-16 bg-[#0c0c0f] border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: '12K+', label: 'Athletes Trained' },
              { val: '98%', label: 'Success Rate' },
              { val: '45+', label: 'Training Modules' },
              { val: '24/7', label: 'Coach Support' },
            ].map((stat, idx) => (
              <div key={idx} className="p-4">
                <div className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
                  {stat.val}
                </div>
                <div className="text-xs uppercase tracking-widest text-orange-500 font-semibold mt-2">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MATERIAL FLAT FOOTER                                      */}
      {/* ========================================================= */}
      <footer className="bg-[#08080a] border-t border-neutral-800/80 py-12 text-neutral-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-orange-600 flex items-center justify-center">
              <Flame className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-sm font-bold tracking-widest text-white uppercase">
              BURN IT
            </span>
          </div>

          <p className="text-center md:text-left">
            © {CURRENT_YEAR} Burn It Fitness. All rights reserved. Built with Flat & Material UI.
          </p>

          <div className="flex gap-6 uppercase tracking-wider font-semibold text-neutral-400">
            <a href="#" className="hover:text-orange-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-orange-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-orange-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

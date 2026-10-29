import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

const CURRENT_YEAR = new Date().getFullYear()

export default function Footer() {
  const { darkMode } = useTheme()

  return (
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
              <li><Link to="/#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>HIIT & Sprint Burn</Link></li>
              <li><Link to="/#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Fat Shred Protocol</Link></li>
              <li><Link to="/#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Distance & Marathon</Link></li>
              <li><Link to="/#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>1-on-1 Pro Coaching</Link></li>
            </ul>
          </div>

          <div>
            <div className={`font-semibold mb-3 text-sm ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
              AI Tracker
            </div>
            <ul className="space-y-2">
              <li><Link to="/tracker/select" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Real-time Pose Tracker</Link></li>
              <li><Link to="/tracker/select?exercise=squat" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Squat Counter</Link></li>
              <li><Link to="/tracker/select?exercise=pushup" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Push-up Tracker</Link></li>
              <li><Link to="/admin/recorder" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Dataset Recorder (Admin)</Link></li>
            </ul>
          </div>

          <div>
            <div className={`font-semibold mb-3 text-sm ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
              Coaching
            </div>
            <ul className="space-y-2">
              <li><Link to="/#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Steve Rock Bio</Link></li>
              <li><Link to="/#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Biometric Tracking</Link></li>
              <li><Link to="/#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Athlete Reviews</Link></li>
              <li><Link to="/#programs" className={darkMode ? 'hover:text-white' : 'hover:text-neutral-900'}>Schedule Consultation</Link></li>
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
  )
}


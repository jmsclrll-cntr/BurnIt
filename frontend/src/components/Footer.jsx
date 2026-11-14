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
        {/* Main content could go here */}
        <hr className="border-t border-neutral-800 mb-4" />
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-orange-600 flex items-center justify-center">
              <Flame className="w-3 h-3 text-white fill-white" />
            </div>
            <span className={`font-semibold text-sm ${darkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>BURN IT</span>
            <span>© {CURRENT_YEAR} Burn It Fitness. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/privacy" className={`text-xs ${darkMode ? 'hover:text-white' : 'hover:text-neutral-900'} focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 transition-colors`}>Privacy</Link>
            <Link to="/terms" className={`text-xs ${darkMode ? 'hover:text-white' : 'hover:text-neutral-900'} focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 transition-colors`}>Terms</Link>
            <Link to="/cookies" className={`text-xs ${darkMode ? 'hover:text-white' : 'hover:text-neutral-900'} focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 transition-colors`}>Cookies</Link>
            <Link to="/contact" className={`text-xs ${darkMode ? 'hover:text-white' : 'hover:text-neutral-900'} focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 transition-colors`}>Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

const CURRENT_YEAR = new Date().getFullYear()

export default function Footer() {
  const { darkMode } = useTheme()

  return (
    <footer
      className={`border-t py-12 text-xs transition-colors duration-300 ${
        darkMode
          ? 'bg-[#0e0e13] border-[#2a2a34] text-[#a3a3b0]'
          : 'bg-[#f6f4f1] border-[#dcd8d2] text-[#5d5d68]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-orange-600 flex items-center justify-center">
              <Flame className="w-3 h-3 text-white fill-white" />
            </div>
            <span className={`font-semibold text-sm ${darkMode ? 'text-[#f5f3ef]' : 'text-[#17171c]'}`}>
              BURN IT
            </span>
            <span>© {CURRENT_YEAR} Burn It Fitness. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#" className={darkMode ? 'hover:text-white' : 'hover:text-[#17171c]'}>Privacy</a>
            <a href="#" className={darkMode ? 'hover:text-white' : 'hover:text-[#17171c]'}>Terms</a>
            <a href="#" className={darkMode ? 'hover:text-white' : 'hover:text-[#17171c]'}>Cookies</a>
            <a href="#" className={darkMode ? 'hover:text-white' : 'hover:text-[#17171c]'}>Contact</a>
          </div>
        </div>
      </div>
    </footer>
  )
}


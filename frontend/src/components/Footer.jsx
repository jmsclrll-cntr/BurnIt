import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const { darkMode } = useTheme();

  return (
    <footer
      className={`border-t py-12 text-xs transition-colors duration-300 ${darkMode
        ? 'bg-[#0F0F0F] border-[#262630] text-[#A3A3B0]'
        : 'bg-[#F7F7F7] border-[#E2E4E9] text-[#5D5D68]'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-5 h-5 rounded bg-[#3641C9] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Flame className="w-3 h-3 text-white fill-white" />
              </div>
              <div className="font-bold text-sm tracking-tight flex items-center gap-1 select-none">
                <span className={darkMode ? 'text-white' : 'text-[#0F0F0F]'}>BURN</span>
                <span className="text-[#3641C9]">IT</span>
              </div>
            </Link>
            <span className="ml-1 text-xs opacity-90">© {CURRENT_YEAR} Burn It Fitness. All rights reserved.</span>
          </div>

          <nav className="flex flex-wrap items-center gap-6" aria-label="Footer Navigation">
            <Link
              to="/privacy"
              className={`transition-colors duration-150 rounded-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3641C9] ${darkMode ? 'hover:text-[#8A9CF7] focus:text-[#8A9CF7]' : 'hover:text-[#3641C9] focus:text-[#3641C9]'
                }`}
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className={`transition-colors duration-150 rounded-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3641C9] ${darkMode ? 'hover:text-[#8A9CF7] focus:text-[#8A9CF7]' : 'hover:text-[#3641C9] focus:text-[#3641C9]'
                }`}
            >
              Terms
            </Link>
            <Link
              to="/cookies"
              className={`transition-colors duration-150 rounded-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3641C9] ${darkMode ? 'hover:text-[#8A9CF7] focus:text-[#8A9CF7]' : 'hover:text-[#3641C9] focus:text-[#3641C9]'
                }`}
            >
              Cookies
            </Link>
            <Link
              to="/contact"
              className={`transition-colors duration-150 rounded-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3641C9] ${darkMode ? 'hover:text-[#8A9CF7] focus:text-[#8A9CF7]' : 'hover:text-[#3641C9] focus:text-[#3641C9]'
                }`}
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

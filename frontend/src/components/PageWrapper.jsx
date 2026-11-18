import Navbar from './Navbar'
import Footer from './Footer'
import { useTheme } from '../hooks/useTheme'

export default function PageWrapper({ children, hideFooter = false }) {
  const { darkMode } = useTheme()

  return (
    <div
      className={`min-h-screen font-sans antialiased flex flex-col justify-between transition-colors duration-300 selection:bg-[#3641C9]/20 selection:text-[#3641C9] ${darkMode ? 'bg-[#0F0F0F] text-[#F7F7F7]' : 'bg-[#F7F7F7] text-[#0F0F0F]'
        } dark:bg-[#0F0F0F] dark:text-[#F7F7F7]`}
    >
      <div>
        <Navbar />
        <main className="w-full">{children}</main>
      </div>
      {!hideFooter && <Footer />}
    </div>
  )
}

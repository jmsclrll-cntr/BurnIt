import Navbar from './Navbar'
import Footer from './Footer'
import { useTheme } from '../hooks/useTheme'

export default function PageWrapper({ children, hideFooter = false }) {
  const { darkMode } = useTheme()

  return (
    <div
      className={`min-h-screen font-sans antialiased flex flex-col justify-between transition-colors duration-300 selection:bg-orange-500/20 selection:text-orange-500 ${
        darkMode ? 'bg-[#0e0e13] text-[#f5f3ef]' : 'bg-[#f6f4f1] text-[#17171c]'
      } dark:bg-[#0e0e13] dark:text-[#f5f3ef]`}
    >
      <div>
        <Navbar />
        <main className="w-full">{children}</main>
      </div>
      {!hideFooter && <Footer />}
    </div>
  )
}


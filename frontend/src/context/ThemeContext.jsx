import { useState, useEffect } from 'react'
import { ThemeContext } from './ThemeContextCore'

export function ThemeProvider({ children }) {
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

  const [isFullscreen, setIsFullscreen] = useState(false)

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

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, isFullscreen, enterFullScreen }}>
      {children}
    </ThemeContext.Provider>
  )
}

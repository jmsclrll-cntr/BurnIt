import { createContext } from 'react'

export const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
  isFullscreen: false,
  enterFullScreen: () => {},
})


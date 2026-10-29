import { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContextCore'

export function useTheme() {
  return useContext(ThemeContext)
}

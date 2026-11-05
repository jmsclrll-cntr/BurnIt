import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { initScrollReveal } from '../hooks/useScrollReveal'

/**
 * Global ScrollRevealManager
 * Automatically applies subtle scroll fade-in & slide-up animation
 * across all current and future pages in the app.
 */
export default function ScrollRevealManager() {
  const location = useLocation()

  useEffect(() => {
    // Re-initialize scroll reveal observer on route change and initial load
    const cleanup = initScrollReveal(document)
    return cleanup
  }, [location.pathname])

  return null
}


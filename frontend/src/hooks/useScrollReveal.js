import { useEffect } from 'react'

/**
 * Default selectors for auto-detecting headings, images, cards, and interactive blocks
 * Note: sections are excluded by default to avoid double-nested compound transforms
 * on both the section container and its child elements.
 */
const DEFAULT_TARGETS = [
  'h1:not(.no-reveal):not(.hero-fade-init)',
  'h2:not(.no-reveal)',
  'h3:not(.no-reveal)',
  'h4:not(.no-reveal)',
  'img:not([alt*="Hero"]):not(.no-reveal):not([alt="Hero Background"])',
  '[class*="card"]:not(.no-reveal)',
  '[class*="rounded-2xl"]:not(.no-reveal):not(section):not(header):not(nav):not(main)',
  '[class*="rounded-xl"]:not(.no-reveal):not(section):not(header):not(nav):not(main)',
  '.scroll-reveal:not(.is-revealed)',
].join(', ')

/**
 * Initializes scroll reveal observer on a given container or document.
 * Returns a cleanup function.
 */

export function initScrollReveal(container = document) {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return () => { }
  }

  // Check prefers-reduced-motion
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (mediaQuery && mediaQuery.matches) {
    return () => { }
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed')
          // Only animate once - immediately disconnect observer for this element
          obs.unobserve(entry.target)
          setTimeout(() => {
            if (entry.target) {
              entry.target.style.transitionDelay = '0s'
              entry.target.style.willChange = 'auto'
            }
          }, 1000)
        }
      })
    },
    {
      threshold: 0.06,
      rootMargin: '0px 0px -40px 0px',
    }
  )

  const registeredElements = new WeakSet()

  function observeElements() {
    try {
      const elements = container.querySelectorAll(DEFAULT_TARGETS)
      elements.forEach((el) => {
        if (
          registeredElements.has(el) ||
          el.classList.contains('is-revealed') ||
          el.closest('header') ||
          el.closest('nav') ||
          el.closest('.no-reveal') ||
          el.tagName === 'CANVAS' ||
          el.tagName === 'VIDEO' ||
          el.getAttribute('alt') === 'Hero Background'
        ) {
          return
        }

        // Add base scroll-reveal class if not already present
        if (!el.classList.contains('scroll-reveal')) {
          el.classList.add('scroll-reveal')
        }

        // Sibling auto-stagger calculation for cards, tabs, and list items
        if (el.parentElement && !el.style.transitionDelay) {
          const siblings = Array.from(el.parentElement.children).filter(
            (child) =>
              child.nodeType === 1 &&
              (child.classList.contains('scroll-reveal') || child.matches(DEFAULT_TARGETS))
          )
          if (siblings.length > 1) {
            const index = siblings.indexOf(el)
            if (index > 0) {
              el.style.transitionDelay = `${Math.min(index * 90, 500)}ms`
            }
          }
        }

        // Check if element is already within the initial viewport
        const rect = el.getBoundingClientRect()
        const inViewport = rect.top < window.innerHeight && rect.bottom > 0
        if (inViewport && rect.top < window.innerHeight * 0.75) {
          // Immediately reveal elements already near or above the fold
          el.classList.add('is-revealed')
          return
        }

        registeredElements.add(el)
        observer.observe(el)
      })
    } catch {
      // Graceful fallback
    }
  }

  // Initial observation
  observeElements()

  // Use MutationObserver to catch dynamically rendered elements or tab changes
  let mutationObserver = null
  if ('MutationObserver' in window) {
    let timeoutId = null
    mutationObserver = new MutationObserver(() => {
      if (timeoutId) cancelAnimationFrame(timeoutId)
      timeoutId = requestAnimationFrame(() => {
        observeElements()
      })
    })

    mutationObserver.observe(container.body || container, {
      childList: true,
      subtree: true,
    })
  }

  return () => {
    observer.disconnect()
    if (mutationObserver) {
      mutationObserver.disconnect()
    }
  }
}

/**
 * React hook to enable scroll reveal in any component
 */
export function useScrollReveal(ref) {
  useEffect(() => {
    const target = ref?.current || document
    return initScrollReveal(target)
  }, [ref])
}


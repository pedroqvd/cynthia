import { useState, useEffect } from 'react'

/**
 * Returns true when the viewport is narrower than the given breakpoint (default 768px).
 * Safe for SSR: always starts as false, updates after hydration.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < breakpoint)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])

  return isMobile
}

'use client'

import { useEffect, useRef } from 'react'

/** Hook para animação de scroll reveal com IntersectionObserver */
export function useReveal(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px', ...options }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [options])

  return { ref }
}

/** Hook para stagger reveal em filhos */
export function useStaggerReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const children = Array.from(container.children) as HTMLElement[]
    children.forEach((el, i) => {
      el.classList.add('reveal')
      el.style.transitionDelay = `${i * 0.1}s`
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    )

    children.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return { ref }
}

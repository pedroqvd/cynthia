'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const LINKS = [
  { href: '#sobre', label: 'Sobre' },
  { href: '#especialidades', label: 'Especialidades' },
  { href: '#resultados', label: 'Resultados' },
  { href: '#depoimentos', label: 'Depoimentos' },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '1.25rem 4rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: scrolled ? 'rgba(245,240,230,0.97)' : 'rgba(245,240,230,0.92)',
          borderBottom: scrolled ? '1px solid rgba(201,169,110,0.3)' : '1px solid transparent',
          backdropFilter: 'blur(12px)',
          transition: 'background .3s, border-color .3s',
        }}
        className="max-md:!px-6"
      >
        {/* Logo */}
        <Link
          href="#"
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '1.1rem',
            fontWeight: 400,
            color: '#1C1C1C',
            letterSpacing: '.06em',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '.5rem',
          }}
        >
          <span
            style={{
              width: '32px',
              height: '32px',
              background: '#1B6B5A',
              color: '#F5F0E6',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '.9rem',
              fontWeight: 500,
              letterSpacing: '-.01em',
              flexShrink: 0,
            }}
          >
            CQ
          </span>
          Dra. Cynthia <span style={{ color: '#1B6B5A' }}>Quevedo</span>
        </Link>

        {/* Links desktop */}
        <ul
          style={{ display: 'flex', gap: '2.5rem', listStyle: 'none', alignItems: 'center' }}
          className="hidden md:flex"
        >
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                style={{
                  fontSize: '.78rem',
                  fontWeight: 400,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: '#6B6B6B',
                  textDecoration: 'none',
                  transition: 'color .2s',
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#1B6B5A')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#6B6B6B')}
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="/agendamento"
              style={{
                fontSize: '.75rem',
                fontWeight: 500,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                color: '#F5F0E6',
                background: '#1B6B5A',
                padding: '.65rem 1.5rem',
                borderRadius: '3px',
                textDecoration: 'none',
                transition: 'background .2s',
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.background = '#163D32')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.background = '#1B6B5A')}
            >
              Agendar avaliação
            </a>
          </li>
        </ul>

        {/* Hamburguer mobile */}
        <button
          className="flex md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: '#1C1C1C' }}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            {mobileOpen ? (
              <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            ) : (
              <path d="M4 8h16M4 12h16M4 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#F5F0E6',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
          }}
          onClick={() => setMobileOpen(false)}
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '2rem',
                fontWeight: 300,
                color: '#1C1C1C',
                textDecoration: 'none',
                letterSpacing: '.04em',
              }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="/agendamento"
            style={{
              fontSize: '.85rem',
              fontWeight: 500,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: '#F5F0E6',
              background: '#1B6B5A',
              padding: '.9rem 2.5rem',
              borderRadius: '3px',
              textDecoration: 'none',
              marginTop: '1rem',
            }}
          >
            Agendar avaliação
          </a>
        </div>
      )}
    </>
  )
}

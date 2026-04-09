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
          padding: '1.5rem 4rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: scrolled
            ? 'rgba(15,14,12,0.97)'
            : 'linear-gradient(to bottom, rgba(15,14,12,.95) 0%, transparent 100%)',
          borderBottom: scrolled ? '1px solid rgba(184,150,90,0.15)' : 'none',
          transition: 'background .3s, border-color .3s',
        }}
      >
        {/* Logo */}
        <Link
          href="#"
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '1.15rem',
            fontWeight: 400,
            color: '#f5f0e8',
            letterSpacing: '.04em',
            textDecoration: 'none',
          }}
        >
          Dra. <span style={{ color: '#b8965a' }}>Cynthia</span>
        </Link>

        {/* Links desktop */}
        <ul
          style={{
            display: 'flex',
            gap: '2.5rem',
            listStyle: 'none',
          }}
          className="hidden md:flex"
        >
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                style={{
                  fontSize: '.78rem',
                  fontWeight: 400,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: '#7a7570',
                  textDecoration: 'none',
                  transition: 'color .2s',
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#f5f0e8')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#7a7570')}
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="#cta"
              style={{
                fontSize: '.75rem',
                fontWeight: 500,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: '#0f0e0c',
                background: '#b8965a',
                padding: '.6rem 1.4rem',
                borderRadius: '2px',
                textDecoration: 'none',
                transition: 'background .2s',
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.background = '#d4b07a')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.background = '#b8965a')}
            >
              Agendar avaliação
            </a>
          </li>
        </ul>

        {/* Hamburguer mobile */}
        <button
          className="flex md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: '#f5f0e8',
          }}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            {mobileOpen ? (
              <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            ) : (
              <>
                <path d="M4 8h16M4 12h16M4 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </>
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
            background: 'rgba(15,14,12,0.98)',
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
                color: '#f5f0e8',
                textDecoration: 'none',
                letterSpacing: '.04em',
              }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#cta"
            style={{
              fontSize: '.85rem',
              fontWeight: 500,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: '#0f0e0c',
              background: '#b8965a',
              padding: '.9rem 2.5rem',
              borderRadius: '2px',
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

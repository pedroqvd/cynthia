'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_PRIMARY = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
  },
  {
    href: '/admin/agenda',
    label: 'Agenda',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="2.5" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M4.5 1v3M11.5 1v3M1 6.5h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/admin/leads',
    label: 'Pacientes',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M1.5 14c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/admin/financeiro',
    label: 'Financeiro',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 3.5v9M5.5 6.5c0-1.24.8-2.25 2.5-2.25s2.5 1.01 2.5 2.25c0 1.24-1 1.75-2.5 1.75s-2.5.51-2.5 1.75c0 1.24.8 2.25 2.5 2.25s2.5-1.01 2.5-2.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/admin/analytics',
    label: 'Analytics',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1 12l4-4 3 3 4-5 3 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M1 15h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/admin/whatsapp',
    label: 'WhatsApp',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1C4.13 1 1 4.13 1 8c0 1.18.31 2.28.85 3.23L1 15l3.87-.84A6.96 6.96 0 008 15c3.87 0 7-3.13 7-7s-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M5.5 8.5c.5.9 1.4 1.7 2.3 2.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
]

const NAV_SECONDARY = [
  {
    href: '/admin/conteudo',
    label: 'Conteúdo',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M4 5h8M4 8h8M4 11h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/admin/blog',
    label: 'Artigos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zM6 5.5h4M6 8h4M6 10.5h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/admin/automacoes',
    label: 'Automações',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L3 8h4.5L6.5 15l6-7H8.5L8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/admin/config',
    label: 'Configurações',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.42 1.42M11.18 11.18l1.42 1.42M3.4 12.6l1.42-1.42M11.18 4.82l1.42-1.42" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    function check() { setCollapsed(window.innerWidth < 900) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const isLoginPage = pathname === '/admin/login'

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (isLoginPage) return null

  return (
    <aside style={{
      width: collapsed ? '60px' : '216px',
      background: '#0f0e0c',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      transition: 'width .2s ease',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflow: 'hidden',
    }}>

      {/* ── Marca ─────────────────────────────────────────── */}
      <div style={{
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        padding: collapsed ? '0' : '0 1.25rem',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: 'rgba(184,150,90,0.15)',
              border: '1px solid rgba(184,150,90,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '1rem', fontWeight: 600, color: '#b8965a', flexShrink: 0,
            }}>
              C
            </div>
            <div>
              <div style={{ fontSize: '.78rem', fontWeight: 500, color: '#f5f0e8', letterSpacing: '.01em' }}>Cynthia</div>
              <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Painel</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: 'rgba(184,150,90,0.15)',
            border: '1px solid rgba(184,150,90,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '1rem', fontWeight: 600, color: '#b8965a',
          }}>
            C
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={collapseBtn} title="Recolher">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Navegação ─────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '.75rem 0' }}>

        {/* Principal */}
        {!collapsed && (
          <div style={{ padding: '0 1rem .35rem', fontSize: '.58rem', fontWeight: 600, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '.12em' }}>
            Principal
          </div>
        )}

        {NAV_PRIMARY.map((link) => <NavLink key={link.href} link={link} collapsed={collapsed} pathname={pathname} />)}

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '.75rem 0' }} />

        {/* Gestão */}
        {!collapsed && (
          <div style={{ padding: '0 1rem .35rem', fontSize: '.58rem', fontWeight: 600, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '.12em' }}>
            Gestão
          </div>
        )}

        {NAV_SECONDARY.map((link) => <NavLink key={link.href} link={link} collapsed={collapsed} pathname={pathname} />)}
      </nav>

      {/* ── Busca global ──────────────────────────────────── */}
      <div style={{ padding: '.5rem .75rem' }}>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true }))}
          title="Busca global (⌘K)"
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: collapsed ? '8px 0' : '7px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px',
            cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: '.72rem',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          {!collapsed && (
            <>
              <span style={{ flex: 1, color: 'rgba(255,255,255,0.25)' }}>Buscar...</span>
              <kbd style={{ fontSize: '.58rem', background: 'rgba(255,255,255,0.06)', padding: '2px 5px', borderRadius: '3px', color: 'rgba(255,255,255,0.2)' }}>⌘K</kbd>
            </>
          )}
        </button>
      </div>

      {/* ── Rodapé ────────────────────────────────────────── */}
      <div style={{
        padding: '.75rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: '.5rem',
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', minWidth: 0 }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'rgba(184,150,90,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.72rem', color: '#b8965a', flexShrink: 0,
              fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 600,
            }}>
              D
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Dra. Cynthia</div>
              <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,0.25)' }}>Admin</div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', flexShrink: 0 }}>
          {collapsed && (
            <button onClick={() => setCollapsed(false)} style={collapseBtn} title="Expandir">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <button onClick={handleLogout} title="Sair" style={collapseBtn}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 12H2a1 1 0 01-1-1V3a1 1 0 011-1h3M9 9.5L12.5 7 9 4.5M12.5 7H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavLink({ link, collapsed, pathname }: {
  link: { href: string; label: string; icon: React.ReactNode }
  collapsed: boolean
  pathname: string
}) {
  const active = pathname.startsWith(link.href)
  return (
    <Link
      href={link.href}
      title={collapsed ? link.label : undefined}
      style={{
        display: 'flex', alignItems: 'center',
        gap: '10px',
        padding: collapsed ? '9px 0' : '8px 1rem',
        justifyContent: collapsed ? 'center' : 'flex-start',
        margin: '1px .5rem',
        borderRadius: '6px',
        color: active ? '#b8965a' : 'rgba(255,255,255,0.38)',
        textDecoration: 'none', fontSize: '.8rem',
        background: active ? 'rgba(184,150,90,0.1)' : 'transparent',
        transition: 'color .12s, background .12s',
        whiteSpace: 'nowrap',
        fontWeight: active ? 500 : 400,
      }}
    >
      {link.icon}
      {!collapsed && link.label}
    </Link>
  )
}

const collapseBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'rgba(255,255,255,0.25)', padding: '4px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '4px',
}

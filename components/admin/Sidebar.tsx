'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const LINKS = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="10" y="1" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="1" y="10" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="10" y="10" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    href: '/admin/agenda',
    label: 'Agenda',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="3" width="16" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5 1v4M13 1v4M1 7h16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/admin/leads',
    label: 'Leads / CRM',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M2 16c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/admin/whatsapp',
    label: 'WhatsApp',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 1.5C4.858 1.5 1.5 4.858 1.5 9c0 1.306.34 2.532.935 3.595L1.5 16.5l3.99-1.012A7.43 7.43 0 009 16.5c4.142 0 7.5-3.358 7.5-7.5S13.142 1.5 9 1.5z" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M6.5 9.5c.5 1 1.5 2 2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/admin/conteudo',
    label: 'Conteúdo',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1.5" y="1.5" width="15" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5 6h8M5 9h8M5 12h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/admin/automacoes',
    label: 'Automações',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 1.5L3 9h5.25L7.5 16.5l6-7.5H8.25L9 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/admin/config',
    label: 'Configurações',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.697 3.697l1.414 1.414M12.889 12.889l1.414 1.414M3.697 14.303l1.414-1.414M12.889 5.111l1.414-1.414" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <aside
      style={{
        width: collapsed ? '64px' : '220px',
        background: '#0f0e0c',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(184,150,90,0.15)',
        transition: 'width .2s ease',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(184,150,90,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-end',
        }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#7a7570',
            padding: '4px',
            display: 'flex',
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            {collapsed ? (
              <path d="M2 8h12M6 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M14 8H2M10 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </button>
      </div>

      {/* Navegação */}
      <nav style={{ flex: 1, padding: '1rem 0', overflow: 'hidden' }}>
        {LINKS.map((link) => {
          const active = pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: collapsed ? '10px 0' : '10px 1.5rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: active ? '#b8965a' : '#7a7570',
                textDecoration: 'none',
                fontSize: '.82rem',
                background: active ? 'rgba(184,150,90,0.08)' : 'transparent',
                borderRight: active ? '2px solid #b8965a' : '2px solid transparent',
                transition: 'color .15s, background .15s',
                whiteSpace: 'nowrap',
              }}
              title={collapsed ? link.label : undefined}
            >
              {link.icon}
              {!collapsed && link.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(184,150,90,0.15)', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#7a7570',
            fontSize: '.72rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: 0,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 12H2a1 1 0 01-1-1V3a1 1 0 011-1h3M9.5 9.5L13 7l-3.5-2.5M13 7H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!collapsed && 'Sair'}
        </button>
      </div>
    </aside>
  )
}

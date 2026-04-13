'use client'

/**
 * GlobalSearch — Busca global no painel admin.
 * Abre com Cmd+K / Ctrl+K ou clicando no ícone da sidebar.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface SearchResults {
  leads: { id: string; nome: string; whatsapp: string; especialidade: string | null; status: string }[]
  appointments: { id: string; procedimento: string; data_hora: string; status: string; leads: { nome: string } | { nome: string }[] | null }[]
  posts: { id: string; title: string; slug: string }[]
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  // Atalho Cmd+K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else { setQuery(''); setResults(null) }
  }, [open])

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) { setResults(null); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`)
        if (res.ok) setResults(await res.json() as SearchResults)
      } finally {
        setLoading(false)
      }
    }, 280)
  }, [])

  function navigate(path: string) {
    router.push(path)
    setOpen(false)
  }

  const hasResults = results && (results.leads.length + results.appointments.length + results.posts.length) > 0

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.55)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 20px 60px rgba(0,0,0,.25)',
          overflow: 'hidden',
        }}
      >
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '1rem 1.25rem', borderBottom: '1px solid #f0f0ee' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#7a7570', flexShrink: 0 }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); search(e.target.value) }}
            placeholder="Buscar leads, consultas, artigos..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '.95rem',
              color: '#0f0e0c',
              fontFamily: 'DM Sans, sans-serif',
              background: 'transparent',
            }}
          />
          {loading && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#b8965a', animation: 'spin 1s linear infinite', flexShrink: 0 }}>
              <path d="M8 1.5A6.5 6.5 0 1114.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          )}
          <kbd style={{ fontSize: '.65rem', color: '#7a7570', background: '#f3f4f6', padding: '2px 5px', borderRadius: '3px', flexShrink: 0 }}>ESC</kbd>
        </div>

        {/* Resultados */}
        <div style={{ maxHeight: '420px', overflow: 'auto' }}>
          {!query || query.length < 2 ? (
            <p style={{ padding: '1.5rem', fontSize: '.82rem', color: '#7a7570', textAlign: 'center' }}>
              Digite para buscar…
              <br />
              <span style={{ fontSize: '.72rem', opacity: .7 }}>leads · consultas · artigos</span>
            </p>
          ) : !hasResults && !loading ? (
            <p style={{ padding: '1.5rem', fontSize: '.82rem', color: '#7a7570', textAlign: 'center' }}>
              Nenhum resultado para &ldquo;{query}&rdquo;
            </p>
          ) : (
            <>
              {results?.leads && results.leads.length > 0 && (
                <Section label="Leads">
                  {results.leads.map((l) => (
                    <ResultRow
                      key={l.id}
                      icon="👤"
                      primary={l.nome}
                      secondary={`${l.whatsapp}${l.especialidade ? ` · ${l.especialidade}` : ''}`}
                      badge={l.status}
                      onClick={() => navigate('/admin/leads')}
                    />
                  ))}
                </Section>
              )}
              {results?.appointments && results.appointments.length > 0 && (
                <Section label="Consultas">
                  {results.appointments.map((a) => {
                    const lead = Array.isArray(a.leads) ? a.leads[0] : a.leads
                    return (
                      <ResultRow
                        key={a.id}
                        icon="📅"
                        primary={a.procedimento}
                        secondary={`${(lead as { nome?: string })?.nome ?? ''} · ${new Date(a.data_hora).toLocaleDateString('pt-BR')}`}
                        badge={a.status}
                        onClick={() => navigate('/admin/agenda')}
                      />
                    )
                  })}
                </Section>
              )}
              {results?.posts && results.posts.length > 0 && (
                <Section label="Artigos">
                  {results.posts.map((p) => (
                    <ResultRow
                      key={p.id}
                      icon="📝"
                      primary={p.title}
                      secondary={p.slug}
                      onClick={() => navigate(`/admin/blog/${p.id}`)}
                    />
                  ))}
                </Section>
              )}
            </>
          )}
        </div>

        {/* Rodapé */}
        <div style={{ padding: '.6rem 1.25rem', borderTop: '1px solid #f0f0ee', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '.68rem', color: '#7a7570' }}>
            <kbd style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: '2px' }}>⌘K</kbd> para abrir · <kbd style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: '2px' }}>↵</kbd> para navegar
          </span>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ padding: '.5rem 1.25rem .3rem', fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#7a7570', background: '#fafaf9' }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function ResultRow({ icon, primary, secondary, badge, onClick }: {
  icon: string; primary: string; secondary?: string; badge?: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '.75rem',
        padding: '.65rem 1.25rem',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background .1s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#faf7f2' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <span style={{ fontSize: '.95rem', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '.85rem', color: '#0f0e0c', fontWeight: 500 }}>{primary}</div>
        {secondary && <div style={{ fontSize: '.72rem', color: '#7a7570', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{secondary}</div>}
      </div>
      {badge && (
        <span style={{ fontSize: '.65rem', padding: '2px 7px', borderRadius: '10px', background: '#f3f4f6', color: '#7a7570', flexShrink: 0 }}>
          {badge}
        </span>
      )}
    </button>
  )
}

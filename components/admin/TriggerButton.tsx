'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export function TriggerButton({ endpoint }: { endpoint: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleRun() {
    setLoading(true)
    setDone(false)
    try {
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ''}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Executado com sucesso. ${JSON.stringify(data)}`)
        setDone(true)
        setTimeout(() => setDone(false), 4000)
      } else {
        toast.error(`Erro ${res.status}: ${res.statusText}`)
      }
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRun}
      disabled={loading}
      style={{
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '.75rem',
        fontWeight: 500,
        letterSpacing: '.06em',
        textTransform: 'uppercase',
        background: done ? '#1B6B5A' : loading ? '#e5e5e3' : '#0f0e0c',
        color: done ? '#F5F0E6' : loading ? '#7a7570' : '#f5f0e8',
        border: 'none',
        padding: '.6rem 1.25rem',
        borderRadius: '4px',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background .2s',
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M6 1v2M6 9v2M1 6h2M9 6h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Executando...
        </>
      ) : done ? (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Concluído
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 2l7 4-7 4V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          Executar agora
        </>
      )}
    </button>
  )
}

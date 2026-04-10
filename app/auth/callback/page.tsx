'use client'

/**
 * /auth/callback
 * Intermediário do fluxo de autenticação Supabase.
 * Suporta:
 *  - Fluxo PKCE  → ?code=xxx  (enviado pelo servidor, ideal)
 *  - Fluxo legado → #access_token=xxx (hash, só visível no cliente)
 */
import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/admin/dashboard'

  useEffect(() => {
    const supabase = createClient()
    const hash = window.location.hash

    if (hash.includes('access_token')) {
      // Fluxo implícito legado — o cliente Supabase processa o hash automaticamente
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          router.replace(next)
        } else {
          router.replace('/admin/login?error=link_invalido')
        }
      })
      return
    }

    const code = params.get('code')
    if (code) {
      // Fluxo PKCE — troca o código por sessão
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          router.replace(next)
        } else {
          router.replace('/admin/login?error=link_invalido')
        }
      })
      return
    }

    // Nenhum token — redireciona
    router.replace('/admin/login?error=link_invalido')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0e0c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif',
      color: '#7a7570',
      fontSize: '.85rem',
      letterSpacing: '.05em',
    }}>
      Verificando link...
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackHandler />
    </Suspense>
  )
}

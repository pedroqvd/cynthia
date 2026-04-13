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

  useEffect(() => {
    const supabase = createClient()
    const hash = window.location.hash

    if (hash.includes('access_token')) {
      // Fluxo implícito legado — extrai tokens diretamente do hash e chama setSession()
      // (getSession() pode ser chamado antes do cliente processar o hash)
      const hashParams = new URLSearchParams(hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')
      const next = type === 'recovery' ? '/admin/reset-password' : (params.get('next') ?? '/admin/dashboard')

      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ data, error }) => {
            if (!error && data.session) {
              router.replace(next)
            } else {
              router.replace('/admin/login?error=link_invalido')
            }
          })
      } else {
        router.replace('/admin/login?error=link_invalido')
      }
      return
    }

    const code = params.get('code')
    const next = params.get('next') ?? '/admin/dashboard'
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

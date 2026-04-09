'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Toaster } from 'sonner'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') ?? '/admin/dashboard'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Credenciais inválidas. Tente novamente.')
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0e0c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      <Toaster theme="dark" />

      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2.5rem',
          border: '1px solid rgba(184,150,90,0.25)',
        }}
      >
        <div
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '1.5rem',
            fontWeight: 300,
            color: '#f5f0e8',
            textAlign: 'center',
            marginBottom: '.5rem',
          }}
        >
          Dra. <span style={{ color: '#b8965a' }}>Cynthia</span>
        </div>
        <p
          style={{
            fontSize: '.72rem',
            letterSpacing: '.15em',
            textTransform: 'uppercase',
            color: '#7a7570',
            textAlign: 'center',
            marginBottom: '2.5rem',
          }}
        >
          Painel administrativo
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            <label style={{ fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#7a7570' }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(184,150,90,0.25)',
                borderRadius: '2px',
                padding: '.75rem 1rem',
                color: '#f5f0e8',
                fontSize: '.9rem',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            <label style={{ fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#7a7570' }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(184,150,90,0.25)',
                borderRadius: '2px',
                padding: '.75rem 1rem',
                color: '#f5f0e8',
                fontSize: '.9rem',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#7a7570' : '#b8965a',
              color: '#0f0e0c',
              border: 'none',
              borderRadius: '2px',
              padding: '.9rem',
              fontSize: '.78rem',
              fontWeight: 500,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '.5rem',
              transition: 'background .2s',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

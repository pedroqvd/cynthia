'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Toaster } from 'sonner'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'login' | 'forgot'>('login')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const params = useSearchParams()
  const redirect = params.get('redirect') ?? '/admin/dashboard'

  useEffect(() => {
    if (params.get('error') === 'link_invalido') {
      toast.error('Link de redefinição inválido ou expirado. Solicite um novo.')
    }
  }, [params])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Login server-side para garantir que os cookies sejam definidos
      // corretamente antes do middleware verificar a sessão
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Credenciais inválidas. Tente novamente.')
        setLoading(false)
        return
      }

      // Hard navigation após cookies definidos server-side
      window.location.href = redirect
    } catch {
      toast.error('Erro ao conectar. Tente novamente.')
      setLoading(false)
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setForgotLoading(true)

    try {
      const redirectTo = `${window.location.origin}/auth/callback`
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, redirectTo }),
      })

      let data: { error?: string; success?: boolean } = {}
      try { data = await res.json() } catch { /* body vazio */ }

      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao enviar e-mail. Tente novamente.')
      } else {
        toast.success('Link enviado! Verifique sua caixa de entrada.')
        setForgotEmail('')
        setView('login')
      }
    } catch {
      toast.error('Sem conexão. Verifique sua internet e tente novamente.')
    } finally {
      setForgotLoading(false)
    }
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
          {view === 'login' ? 'Painel administrativo' : 'Recuperar senha'}
        </p>

        {/* ── Login ── */}
        {view === 'login' && (
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
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(184,150,90,0.25)',
                    borderRadius: '2px',
                    padding: '.75rem 2.8rem .75rem 1rem',
                    color: '#f5f0e8',
                    fontSize: '.9rem',
                    outline: 'none',
                    width: '100%',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#7a7570',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
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

            <button
              type="button"
              onClick={() => setView('forgot')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#7a7570',
                fontSize: '.72rem',
                letterSpacing: '.08em',
                textAlign: 'center',
                marginTop: '.25rem',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              Esqueci a senha
            </button>
          </form>
        )}

        {/* ── Recuperar senha ── */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '.8rem', color: '#7a7570', lineHeight: 1.6, marginBottom: '.5rem' }}>
              Digite o e-mail cadastrado. Você receberá um link para criar uma nova senha.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              <label style={{ fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#7a7570' }}>
                E-mail
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
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

            <button
              type="submit"
              disabled={forgotLoading}
              style={{
                background: forgotLoading ? '#7a7570' : '#b8965a',
                color: '#0f0e0c',
                border: 'none',
                borderRadius: '2px',
                padding: '.9rem',
                fontSize: '.78rem',
                fontWeight: 500,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                cursor: forgotLoading ? 'not-allowed' : 'pointer',
                marginTop: '.5rem',
                transition: 'background .2s',
              }}
            >
              {forgotLoading ? 'Enviando...' : 'Enviar link'}
            </button>

            <button
              type="button"
              onClick={() => setView('login')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#7a7570',
                fontSize: '.72rem',
                letterSpacing: '.08em',
                textAlign: 'center',
                marginTop: '.25rem',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              ← Voltar ao login
            </button>
          </form>
        )}
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

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Toaster } from 'sonner'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exchanging, setExchanging] = useState(true)
  const [valid, setValid] = useState(false)
  const router = useRouter()

  // A sessão já foi estabelecida pelo /auth/callback — só verifica se existe
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        setValid(false)
      } else {
        setValid(true)
      }
      setExchanging(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      toast.error('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        toast.error('Erro ao atualizar a senha. Tente novamente.')
      } else {
        toast.success('Senha atualizada com sucesso!')
        setTimeout(() => router.push('/admin/login'), 1500)
      }
    } catch {
      toast.error('Erro ao conectar. Tente novamente.')
    } finally {
      setLoading(false)
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
          Nova senha
        </p>

        {exchanging && (
          <p style={{ textAlign: 'center', color: '#7a7570', fontSize: '.85rem' }}>
            Verificando link...
          </p>
        )}

        {!exchanging && !valid && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#7a7570', fontSize: '.85rem', marginBottom: '1.5rem' }}>
              Link inválido ou expirado. Solicite um novo link de recuperação.
            </p>
            <button
              onClick={() => router.push('/admin/login')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#b8965a',
                fontSize: '.78rem',
                letterSpacing: '.08em',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              ← Voltar ao login
            </button>
          </div>
        )}

        {!exchanging && valid && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              <label style={{ fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#7a7570' }}>
                Nova senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              <label style={{ fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#7a7570' }}>
                Confirmar senha
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
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
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}

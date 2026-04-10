'use client'

/**
 * AuthHashRedirect
 * Rede de segurança global: detecta tokens de autenticação do Supabase
 * (#access_token=...) em qualquer página e redireciona para /auth/callback.
 * Cobre o caso onde o Supabase ignora o redirectTo e cai no Site URL.
 */
import { useEffect } from 'react'

export function AuthHashRedirect() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const hash = window.location.hash
    const path = window.location.pathname

    // Já está no callback — deixa a página lidar
    if (path === '/auth/callback') return

    // Detecta token de auth no hash
    if (hash.includes('access_token') || hash.includes('error_description')) {
      // Redireciona mantendo o hash (tem o token)
      window.location.replace(`/auth/callback${hash}`)
    }
  }, [])

  return null
}

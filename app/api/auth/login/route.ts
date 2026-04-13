/**
 * POST /api/auth/login
 * Login server-side: os cookies de sessão são definidos via Set-Cookie no header
 * da resposta HTTP, garantindo que o middleware os leia corretamente.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Credenciais obrigatórias.' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Resposta que receberá os cookies de sessão via setAll
  const response = NextResponse.json({ ok: true })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        // Usa as opções padrão do Supabase (sem httpOnly) para que o browser client
        // também consiga ler os cookies (necessário para logout, reset-password, callback)
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            path: '/',  // garante que os cookies são enviados em todas as rotas
          })
        })
      },
    },
  })

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json(
      { error: 'Credenciais inválidas. Tente novamente.' },
      { status: 401 }
    )
  }

  return response
}

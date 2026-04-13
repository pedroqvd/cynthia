/**
 * GET /api/auth/whoami
 * Endpoint de diagnóstico: retorna os cookies recebidos e o status da sessão.
 * Use para verificar se o login server-side está funcionando.
 * REMOVER em produção após diagnóstico concluído.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const cookieNames = req.cookies.getAll().map((c) => c.name)

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: () => {},
    },
  })

  const { data: { user }, error } = await supabase.auth.getUser()

  return NextResponse.json({
    authenticated: !!user,
    user: user ? { id: user.id, email: user.email } : null,
    error: error?.message ?? null,
    cookieNames,
    supabaseCookies: cookieNames.filter((n) => n.startsWith('sb-')),
  })
}

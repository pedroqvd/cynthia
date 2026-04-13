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

  // Não expõe dados se não autenticado
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    user: { id: user.id, email: user.email },
    supabaseCookies: cookieNames.filter((n) => n.startsWith('sb-')),
  })
}

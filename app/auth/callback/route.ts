/**
 * GET /auth/callback
 * Rota intermediária do fluxo de autenticação Supabase (PKCE).
 * Recebe o ?code= após verificação do e-mail e troca por sessão,
 * depois redireciona para ?next= (padrão: /admin/dashboard).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Código ausente ou inválido — volta ao login com aviso
  return NextResponse.redirect(`${origin}/admin/login?error=link_invalido`)
}

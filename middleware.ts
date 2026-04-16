import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/** Comparação em tempo constante para secrets — previne timing attacks */
function timingSafeEqualStr(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length)
  const pa = a.padEnd(maxLen, '\0')
  const pb = b.padEnd(maxLen, '\0')
  let diff = a.length !== b.length ? 1 : 0
  for (let i = 0; i < maxLen; i++) {
    diff |= pa.charCodeAt(i) ^ pb.charCodeAt(i)
  }
  return diff === 0
}

/**
 * Protege todas as rotas /admin/* exceto /admin/login e /admin/reset-password.
 *
 * IMPORTANTE: usa getUser() para validar o JWT diretamente no servidor Supabase.
 * Isso é mais seguro e resistente a expiração prematura de sessão após deploys.
 * getUser() renova o token automaticamente se o refresh token ainda for válido.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas de cron: valida secret header com comparação em tempo constante
  if (pathname.startsWith('/api/cron/')) {
    const provided = request.headers.get('authorization') ?? ''
    const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`
    if (!timingSafeEqualStr(provided, expected)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Rotas admin: requer autenticação
  if (
    pathname.startsWith('/admin') &&
    !pathname.startsWith('/admin/login') &&
    !pathname.startsWith('/admin/reset-password')
  ) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('[middleware] Variáveis SUPABASE não configuradas')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/cron/:path*',
  ],
}

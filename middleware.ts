import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Protege todas as rotas /admin/* exceto /admin/login e /admin/reset-password.
 *
 * IMPORTANTE: usa getUser() para validar o JWT diretamente no servidor Supabase.
 * Isso é mais seguro e resistente a expiração prematura de sessão após deploys.
 * getUser() renova o token automaticamente se o refresh token ainda for válido.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas de cron: valida secret header
  if (pathname.startsWith('/api/cron/')) {
    const secret = request.headers.get('authorization')
    if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
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

    // Padrão canônico Supabase SSR — não inserir código entre createServerClient e getSession()
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

    // getUser() valida o JWT diretamente na API do Supabase (mais seguro e resiliente que getSession).
    // Evita expiração de sessão prematura após novos deploys.
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

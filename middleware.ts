import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Protege todas as rotas /admin/* exceto /admin/login e /admin/reset-password.
 *
 * IMPORTANTE: usa getSession() (não getUser()) para a decisão de redirecionamento.
 * getSession() valida o JWT localmente via assinatura — sem chamada de rede.
 * getUser() faz uma chamada à API do Supabase e pode falhar no Edge Runtime
 * causando o loop de redirecionamento mesmo com sessão válida.
 * Use getUser() dentro das Server Components/Route Handlers para validação segura.
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

    // getSession() verifica a sessão via assinatura JWT local — não faz chamada de rede.
    // É o método correto para decisões de redirecionamento no middleware.
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
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

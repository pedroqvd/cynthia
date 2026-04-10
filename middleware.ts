import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/** Protege todas as rotas /admin/* exceto /admin/login */
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
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && !pathname.startsWith('/admin/reset-password')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Se variáveis não configuradas, redireciona para login
    if (!supabaseUrl || !supabaseKey) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    try {
      let response = NextResponse.next({ request })

      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
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

      return response
    } catch {
      // Em caso de erro inesperado, redireciona para login
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/cron/:path*',
  ],
}

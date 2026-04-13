/**
 * GET /api/admin/search?q=termo
 * Busca global no painel: leads, consultas e artigos do blog.
 * Requer autenticação.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ leads: [], appointments: [], posts: [] })

  const like = `%${q}%`

  const [
    { data: leads },
    { data: appointments },
    { data: posts },
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('id, nome, whatsapp, especialidade, status')
      .or(`nome.ilike.${like},whatsapp.ilike.${like},email.ilike.${like}`)
      .limit(5),
    supabase
      .from('appointments')
      .select('id, procedimento, data_hora, status, leads(nome)')
      .ilike('procedimento', like)
      .limit(5),
    supabase
      .from('blog_posts')
      .select('id, titulo, slug, published_at')
      .or(`titulo.ilike.${like},conteudo.ilike.${like}`)
      .limit(5),
  ])

  return NextResponse.json({
    leads: leads ?? [],
    appointments: appointments ?? [],
    posts: posts ?? [],
  })
}

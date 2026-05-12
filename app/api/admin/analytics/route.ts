import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Não autorizado', 401)

  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform')
  const limit = parseInt(searchParams.get('limit') ?? '12', 10)

  if (!platform) return apiError('platform é obrigatório', 400)

  const { data, error } = await supabase
    .from('social_metrics')
    .select('*')
    .eq('platform', platform)
    .order('periodo', { ascending: false })
    .limit(limit)

  if (error) return apiError(error.message, 500)
  return apiResponse(data)
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Não autorizado', 401)
  const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
  if (roleRow?.role !== 'admin') return apiError('Sem permissão', 403)

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return apiError('JSON inválido', 400) }

  if (!body.platform || !body.periodo) {
    return apiError('platform e periodo são obrigatórios', 400)
  }

  const { data, error } = await supabase
    .from('social_metrics')
    .upsert({ ...body }, { onConflict: 'platform,periodo' })
    .select()
    .single()

  if (error) return apiError(error.message, 500)
  return apiResponse(data, 201)
}

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils'

const ALLOWED_CRON_PATHS = [
  '/api/cron/reminders',
  '/api/cron/followup',
  '/api/cron/reativacao',
  '/api/cron/sync-calendar',
  '/api/cron/avaliacao',
]

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Não autorizado', 401)

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
  if (roleRow?.role !== 'admin') return apiError('Sem permissão', 403)

  let body: { endpoint?: string }
  try { body = await request.json() } catch { return apiError('JSON inválido', 400) }

  const { endpoint } = body
  if (!endpoint || !ALLOWED_CRON_PATHS.includes(endpoint)) {
    return apiError('Endpoint inválido', 400)
  }

  const secret = process.env.CRON_SECRET
  if (!secret) return apiError('CRON_SECRET não configurado', 500)

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? request.nextUrl.origin
    : 'http://localhost:3000'

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${secret}` },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) return apiError(`Cron retornou ${res.status}`, 502)
  return apiResponse(data)
}

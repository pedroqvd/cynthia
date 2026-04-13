import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, supabase, isAdmin: false }
  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).single()
  return { user, supabase, isAdmin: roleRow?.role === 'admin' }
}

export async function GET() {
  const { user, isAdmin } = await requireAdmin()
  if (!user) return apiError('Não autorizado', 401)
  if (!isAdmin) return apiError('Sem permissão', 403)

  // Lista todos os usuários do projeto via admin client
  const adminClient = createAdminClient()
  const { data: authUsers } = await adminClient.auth.admin.listUsers()
  const { data: roles } = await adminClient
    .from('user_roles').select('user_id, role, nome')

  const rolesMap: Record<string, string> = {}
  const nomesMap: Record<string, string> = {}
  ;(roles ?? []).forEach((r) => {
    rolesMap[r.user_id] = r.role
    nomesMap[r.user_id] = r.nome ?? ''
  })

  const users = (authUsers?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email,
    nome: nomesMap[u.id] ?? u.user_metadata?.name ?? '',
    role: rolesMap[u.id] ?? 'secretaria',
    last_sign_in: u.last_sign_in_at,
  }))

  return apiResponse(users)
}

export async function PATCH(req: NextRequest) {
  const { user, isAdmin } = await requireAdmin()
  if (!user) return apiError('Não autorizado', 401)
  if (!isAdmin) return apiError('Sem permissão', 403)

  const { user_id, role, nome } = await req.json()
  if (!user_id || !role) return apiError('user_id e role obrigatórios', 422)

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('user_roles')
    .upsert({ user_id, role, nome: nome ?? '' }, { onConflict: 'user_id' })

  if (error) return apiError(error.message, 500)
  return apiResponse({ ok: true })
}

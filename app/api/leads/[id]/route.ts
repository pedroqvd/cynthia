/**
 * GET    /api/leads/[id]  → detalhe do lead
 * PATCH  /api/leads/[id]  → atualiza lead
 * DELETE /api/leads/[id]  → exclui lead (LGPD)
 */
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { leadSchema } from '@/lib/schemas'
import { apiResponse, apiError } from '@/lib/utils'

async function getUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { user, supabase }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase } = await getUser()
  if (!user) return apiError('Não autorizado', 401)

  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      messages(id, direction, content, type, status, created_at),
      appointments(id, procedimento, data_hora, status),
      activity_log(id, acao, detalhes, created_at, user_id)
    `)
    .eq('id', params.id)
    .order('created_at', { referencedTable: 'messages', ascending: true })
    .single()

  if (error) return apiError(error.message, 404)
  return apiResponse(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase } = await getUser()
  if (!user) return apiError('Não autorizado', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('JSON inválido', 400)
  }

  const parsed = leadSchema.partial().safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422)
  }

  const { data, error } = await supabase
    .from('leads')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return apiError(error.message, 500)

  // Log de atividade
  await supabase.from('activity_log').insert({
    lead_id: params.id,
    user_id: user.id,
    acao: 'lead_atualizado',
    detalhes: parsed.data as Record<string, unknown>,
  })

  return apiResponse(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase } = await getUser()
  if (!user) return apiError('Não autorizado', 401)

  // Exclui mensagens e logs primeiro (FK)
  await Promise.all([
    supabase.from('messages').delete().eq('lead_id', params.id),
    supabase.from('activity_log').delete().eq('lead_id', params.id),
    supabase.from('appointments').update({ lead_id: null }).eq('lead_id', params.id),
  ])

  const { error } = await supabase.from('leads').delete().eq('id', params.id)
  if (error) return apiError(error.message, 500)

  return apiResponse({ deleted: true })
}

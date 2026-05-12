import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils'

async function getAuth() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, supabase, role: null }
  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
  return { user, supabase, role: roleRow?.role ?? 'secretaria' }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase, role } = await getAuth()
  if (!user) return apiError('Não autorizado', 401)
  if (role !== 'admin') return apiError('Sem permissão', 403)

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return apiError('JSON inválido', 400) }

  const ALLOWED: (keyof typeof body)[] = [
    'descricao', 'valor', 'data', 'tipo', 'categoria_id',
    'lead_id', 'appointment_id', 'contrato_id', 'parcela_numero',
    'parcelas_total', 'forma_pagamento', 'status', 'notas',
  ]
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ALLOWED) {
    if (key in body) patch[key] = body[key]
  }

  const { data, error } = await supabase
    .from('financial_entries')
    .update(patch)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return apiError(error.message, 500)
  return apiResponse(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase, role } = await getAuth()
  if (!user) return apiError('Não autorizado', 401)
  if (role !== 'admin') return apiError('Sem permissão', 403)

  const { error } = await supabase
    .from('financial_entries').delete().eq('id', params.id)

  if (error) return apiError(error.message, 500)
  return apiResponse({ deleted: true })
}

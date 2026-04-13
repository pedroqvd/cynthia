import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils'

async function getAuth() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, supabase, role: null }
  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).single()
  return { user, supabase, role: roleRow?.role ?? 'secretaria' }
}

export async function GET(req: NextRequest) {
  const { user, supabase, role } = await getAuth()
  if (!user) return apiError('Não autorizado', 401)

  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo')
  const mes = searchParams.get('mes') // YYYY-MM
  const status = searchParams.get('status')

  let query = supabase
    .from('financial_entries')
    .select(`*, financial_categories(id, nome, cor, tipo), leads(nome), appointments(procedimento)`)
    .order('data', { ascending: false })
    .order('created_at', { ascending: false })

  if (tipo) query = query.eq('tipo', tipo)
  if (status) query = query.eq('status', status)
  if (mes) {
    const start = `${mes}-01`
    const end = new Date(Number(mes.split('-')[0]), Number(mes.split('-')[1]), 0)
      .toISOString().split('T')[0]
    query = query.gte('data', start).lte('data', end)
  }

  const { data, error } = await query.limit(500)
  if (error) return apiError(error.message, 500)

  // Secretária não vê receitas — apenas despesas
  const filtered = role === 'admin' ? data : (data ?? []).filter((e) => e.tipo === 'despesa')
  return apiResponse(filtered)
}

export async function POST(req: NextRequest) {
  const { user, supabase } = await getAuth()
  if (!user) return apiError('Não autorizado', 401)

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return apiError('JSON inválido', 400) }

  const { descricao, valor, data, tipo, category_id, appointment_id, lead_id,
    forma_pagamento, status, notas } = body

  if (!descricao || !valor || !data || !tipo) return apiError('Campos obrigatórios: descricao, valor, data, tipo', 422)

  const { data: entry, error } = await supabase
    .from('financial_entries')
    .insert({
      descricao, valor: Number(valor), data, tipo,
      category_id: category_id || null,
      appointment_id: appointment_id || null,
      lead_id: lead_id || null,
      forma_pagamento: forma_pagamento || null,
      status: status || 'confirmado',
      notas: notas || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return apiError(error.message, 500)
  return apiResponse(entry, 201)
}

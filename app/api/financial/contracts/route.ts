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

export async function GET(req: NextRequest) {
  const { user, supabase } = await getAuth()
  if (!user) return apiError('Não autorizado', 401)

  const { searchParams } = new URL(req.url)
  const leadId = searchParams.get('lead_id')
  const status = searchParams.get('status')

  let query = supabase
    .from('contratos')
    .select(`
      *,
      leads(id, nome, whatsapp, especialidade),
      financial_entries(id, valor, status, parcela_numero, tipo, data)
    `)
    .order('created_at', { ascending: false })

  if (leadId) query = query.eq('lead_id', leadId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query.limit(200)
  if (error) return apiError(error.message, 500)

  return apiResponse(data)
}

export async function POST(req: NextRequest) {
  const { user, supabase } = await getAuth()
  if (!user) return apiError('Não autorizado', 401)

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return apiError('JSON inválido', 400) }

  const { lead_id, descricao, valor_total, parcelas, valor_entrada, data_inicio, notas } = body

  if (!lead_id || !descricao || !valor_total) {
    return apiError('Campos obrigatórios: lead_id, descricao, valor_total', 422)
  }

  const totalNum = Number(valor_total)
  const entradaNum = Number(valor_entrada ?? 0)
  if (isNaN(totalNum) || totalNum <= 0) return apiError('valor_total deve ser positivo', 422)
  if (entradaNum < 0) return apiError('valor_entrada não pode ser negativo', 422)
  if (entradaNum > totalNum) return apiError('valor_entrada não pode ser maior que o valor total', 422)

  const { data, error } = await supabase
    .from('contratos')
    .insert({
      lead_id,
      descricao,
      valor_total: Number(valor_total),
      parcelas: Number(parcelas ?? 1),
      valor_entrada: Number(valor_entrada ?? 0),
      data_inicio: data_inicio || new Date().toISOString().split('T')[0],
      notas: notas || null,
      created_by: user.id,
    })
    .select(`*, leads(id, nome, whatsapp, especialidade), financial_entries(id, valor, status, parcela_numero, tipo, data)`)
    .single()

  if (error) return apiError(error.message, 500)
  return apiResponse(data, 201)
}

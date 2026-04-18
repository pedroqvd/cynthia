/**
 * GET  /api/leads/[id]/tasks  → lista tarefas do paciente
 * POST /api/leads/[id]/tasks  → cria nova tarefa
 */
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils'

async function getAuth() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { user, supabase }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase } = await getAuth()
  if (!user) return apiError('Não autorizado', 401)

  const { data, error } = await supabase
    .from('patient_tasks')
    .select('id, titulo, descricao, status, vencimento, created_at')
    .eq('lead_id', params.id)
    .order('status', { ascending: true })
    .order('vencimento', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) return apiError(error.message, 500)
  return apiResponse(data)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase } = await getAuth()
  if (!user) return apiError('Não autorizado', 401)

  let body: { titulo?: string; descricao?: string; vencimento?: string | null }
  try {
    body = await req.json()
  } catch {
    return apiError('JSON inválido', 400)
  }

  if (!body.titulo?.trim()) return apiError('Título é obrigatório', 422)

  const { data, error } = await supabase
    .from('patient_tasks')
    .insert({
      lead_id: params.id,
      titulo: body.titulo.trim(),
      descricao: body.descricao?.trim() || null,
      vencimento: body.vencimento || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return apiError(error.message, 500)
  return apiResponse(data, 201)
}

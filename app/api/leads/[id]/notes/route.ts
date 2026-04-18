/**
 * GET  /api/leads/[id]/notes  → lista notas de evolução
 * POST /api/leads/[id]/notes  → cria nova nota
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
    .from('clinical_notes')
    .select('id, titulo, conteudo, appointment_id, created_at')
    .eq('lead_id', params.id)
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

  let body: { titulo?: string; conteudo?: string; appointment_id?: string | null }
  try {
    body = await req.json()
  } catch {
    return apiError('JSON inválido', 400)
  }

  if (!body.titulo?.trim()) return apiError('Título é obrigatório', 422)
  if (!body.conteudo?.trim()) return apiError('Conteúdo é obrigatório', 422)

  const { data, error } = await supabase
    .from('clinical_notes')
    .insert({
      lead_id: params.id,
      titulo: body.titulo.trim(),
      conteudo: body.conteudo.trim(),
      appointment_id: body.appointment_id ?? null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return apiError(error.message, 500)
  return apiResponse(data, 201)
}

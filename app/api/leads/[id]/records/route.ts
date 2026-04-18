/**
 * GET  /api/leads/[id]/records  → busca ficha clínica
 * PUT  /api/leads/[id]/records  → cria ou atualiza (upsert)
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

  const { data } = await supabase
    .from('patient_records')
    .select('*')
    .eq('lead_id', params.id)
    .single()

  return apiResponse(data ?? null)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase } = await getAuth()
  if (!user) return apiError('Não autorizado', 401)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return apiError('JSON inválido', 400)
  }

  const ALLOWED_FIELDS = [
    'queixa_principal', 'alergias', 'medicamentos',
    'doencas_sistemicas', 'historico_odontologico', 'plano_tratamento',
  ]
  const patch = Object.fromEntries(
    Object.entries(body).filter(([k]) => ALLOWED_FIELDS.includes(k))
  )

  const { data, error } = await supabase
    .from('patient_records')
    .upsert(
      { lead_id: params.id, ...patch, updated_at: new Date().toISOString() },
      { onConflict: 'lead_id' }
    )
    .select()
    .single()

  if (error) return apiError(error.message, 500)
  return apiResponse(data)
}

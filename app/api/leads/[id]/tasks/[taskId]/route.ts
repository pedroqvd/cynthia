/**
 * PATCH  /api/leads/[id]/tasks/[taskId] → atualiza status ou campos
 * DELETE /api/leads/[id]/tasks/[taskId] → remove tarefa
 */
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils'

async function getAuth() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { user, supabase }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const { user, supabase } = await getAuth()
  if (!user) return apiError('Não autorizado', 401)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return apiError('JSON inválido', 400)
  }

  const ALLOWED = ['titulo', 'descricao', 'status', 'vencimento']
  const patch = Object.fromEntries(
    Object.entries(body).filter(([k]) => ALLOWED.includes(k))
  )

  const { data, error } = await supabase
    .from('patient_tasks')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', params.taskId)
    .eq('lead_id', params.id)
    .select()
    .single()

  if (error) return apiError(error.message, 500)
  return apiResponse(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const { user, supabase } = await getAuth()
  if (!user) return apiError('Não autorizado', 401)

  const { error } = await supabase
    .from('patient_tasks')
    .delete()
    .eq('id', params.taskId)
    .eq('lead_id', params.id)

  if (error) return apiError(error.message, 500)
  return apiResponse({ deleted: true })
}

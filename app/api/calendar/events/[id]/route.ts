/**
 * PATCH /api/calendar/events/[id]  → atualiza status do agendamento
 * DELETE /api/calendar/events/[id] → cancela e remove do Google Calendar
 */
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteEvent, updateEvent } from '@/lib/google-calendar'
import { apiResponse, apiError } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Não autorizado', 401)

  let body: unknown
  try { body = await request.json() } catch { return apiError('JSON inválido', 400) }

  const { status, procedimento, data_hora, duracao_min, notas } = body as Record<string, string>

  // Busca o appointment para pegar o google_event_id
  const { data: appt, error: fetchErr } = await supabase
    .from('appointments')
    .select('google_event_id, lead_id, procedimento, data_hora, duracao_min')
    .eq('id', params.id)
    .single()

  if (fetchErr || !appt) return apiError('Agendamento não encontrado', 404)

  // Atualiza no Supabase
  const updateData: Record<string, unknown> = {}
  if (status) updateData.status = status
  if (procedimento) updateData.procedimento = procedimento
  if (data_hora) updateData.data_hora = data_hora
  if (duracao_min) updateData.duracao_min = Number(duracao_min)
  if (notas !== undefined) updateData.notas = notas || null

  const { data: updated, error } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return apiError(error.message, 500)

  // Sincroniza com Google Calendar se tiver google_event_id e dados mudaram
  if (appt.google_event_id && (procedimento || data_hora || duracao_min)) {
    try {
      const newProcedimento = procedimento ?? appt.procedimento
      const newDataHora = data_hora ?? appt.data_hora
      const newDuracao = Number(duracao_min ?? appt.duracao_min)
      const endIso = new Date(new Date(newDataHora).getTime() + newDuracao * 60000).toISOString()

      await updateEvent(appt.google_event_id, {
        title: newProcedimento,
        startIso: newDataHora,
        endIso,
      })
    } catch (err) {
      console.error('[Calendar] Erro ao atualizar evento:', err)
      // Não falha a requisição — DB já foi atualizado
    }
  }

  revalidatePath('/admin/agenda')
  return apiResponse(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Não autorizado', 401)

  // Busca o google_event_id antes de deletar
  const { data: appt } = await supabase
    .from('appointments')
    .select('google_event_id, lead_id')
    .eq('id', params.id)
    .single()

  // Remove do Google Calendar
  if (appt?.google_event_id) {
    try {
      await deleteEvent(appt.google_event_id)
    } catch (err) {
      console.error('[Calendar] Erro ao remover evento:', err)
    }
  }

  // Remove do Supabase (ou marca como cancelado)
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelado' })
    .eq('id', params.id)

  if (error) return apiError(error.message, 500)

  // Log de atividade
  if (appt?.lead_id) {
    await supabase.from('activity_log').insert({
      lead_id: appt.lead_id,
      user_id: user.id,
      acao: 'consulta_cancelada',
      detalhes: { appointment_id: params.id },
    })
  }

  revalidatePath('/admin/agenda')
  return apiResponse({ ok: true })
}

import { createAdminClient } from '@/lib/supabase/server'
import { listEvents } from '@/lib/google-calendar'

/** Sincroniza eventos do Google Calendar com a tabela appointments */
export async function syncCalendarToSupabase() {
  const supabase = createAdminClient()

  const events = await listEvents(60) // próximos 60 dias

  for (const event of events) {
    const { data: existingAppt, error: existingErr } = await supabase
      .from('appointments')
      .select('id')
      .eq('google_event_id', event.id)
      .maybeSingle()

    if (existingErr) {
      console.error('[sync-calendar] Erro ao buscar appointment:', existingErr)
      continue
    }

    const payload = {
      google_event_id: event.id,
      procedimento: event.procedimento ?? event.title,
      data_hora: event.start,
      duracao_min: calcDuration(event.start, event.end),
      lead_id: event.leadId ?? null,
      status: 'agendado' as const,
    }

    if (existingAppt) {
      await supabase
        .from('appointments')
        .update({ data_hora: payload.data_hora, duracao_min: payload.duracao_min })
        .eq('id', existingAppt.id)
    } else {
      await supabase.from('appointments').insert(payload)
    }
  }
}

function calcDuration(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(diff / 60000)
}

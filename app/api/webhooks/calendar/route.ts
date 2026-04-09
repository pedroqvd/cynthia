/**
 * Webhook — Google Calendar Push Notifications
 * POST /api/webhooks/calendar → sincroniza eventos alterados
 */
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listEvents } from '@/lib/google-calendar'
import { apiResponse } from '@/lib/utils'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // O Google envia headers de notificação — valida o canal
  const channelId = request.headers.get('x-goog-channel-id')
  const resourceState = request.headers.get('x-goog-resource-state')

  if (!channelId) {
    return apiResponse({ received: true })
  }

  // sync = verificação inicial, exists/not_exists = mudança real
  if (resourceState === 'sync') {
    return apiResponse({ received: true })
  }

  try {
    await syncCalendarToSupabase()
  } catch (err) {
    console.error('[Calendar Webhook] Erro na sincronização:', err)
  }

  return apiResponse({ received: true })
}

/** Sincroniza eventos do Google Calendar com a tabela appointments */
export async function syncCalendarToSupabase() {
  const supabase = createAdminClient()

  const events = await listEvents(60) // próximos 60 dias

  for (const event of events) {
    const existing = await supabase
      .from('appointments')
      .select('id')
      .eq('google_event_id', event.id)
      .single()

    const payload = {
      google_event_id: event.id,
      procedimento: event.procedimento ?? event.title,
      data_hora: event.start,
      duracao_min: calcDuration(event.start, event.end),
      lead_id: event.leadId ?? null,
      status: 'agendado' as const,
    }

    if (existing.data) {
      // Atualiza evento existente
      await supabase
        .from('appointments')
        .update({ data_hora: payload.data_hora, duracao_min: payload.duracao_min })
        .eq('google_event_id', event.id)
    } else {
      // Insere novo evento
      await supabase.from('appointments').insert(payload)
    }
  }
}

function calcDuration(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(diff / 60000)
}

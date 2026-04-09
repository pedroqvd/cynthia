/**
 * Webhook — Google Calendar Push Notifications
 * POST /api/webhooks/calendar → sincroniza eventos alterados
 */
import { NextRequest } from 'next/server'
import { apiResponse } from '@/lib/utils'
import { syncCalendarToSupabase } from '@/lib/sync-calendar'

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


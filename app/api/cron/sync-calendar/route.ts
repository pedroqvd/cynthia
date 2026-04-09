/**
 * Vercel Cron: a cada 15 minutos
 * Fallback de sincronização Google Calendar → Supabase
 */
import { syncCalendarToSupabase } from '@/app/api/webhooks/calendar/route'
import { apiResponse, apiError } from '@/lib/utils'

export const maxDuration = 30

export async function GET() {
  try {
    await syncCalendarToSupabase()
    return apiResponse({ synced: true, timestamp: new Date().toISOString() })
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Erro na sincronização', 500)
  }
}

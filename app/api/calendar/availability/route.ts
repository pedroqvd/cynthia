/**
 * GET /api/calendar/availability?date=YYYY-MM-DD
 * Retorna horários disponíveis no dia
 */
import { NextRequest } from 'next/server'
import { getAvailability } from '@/lib/google-calendar'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(request: NextRequest) {
  // Rate limiting
  const ip = getClientIP(request)
  const rl = await checkRateLimit(`availability:${ip}`)
  if (rl) return rl

  const date = request.nextUrl.searchParams.get('date')

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return apiError('Parâmetro "date" inválido (esperado: YYYY-MM-DD)', 400)
  }

  // Não permite buscar datas no passado
  const now = new Date()
  const requested = new Date(date + 'T00:00:00-03:00')
  if (requested < new Date(now.toDateString())) {
    return apiResponse([])
  }

  try {
    const slots = await getAvailability(date)
    return apiResponse(slots)
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Erro ao buscar disponibilidade', 500)
  }
}

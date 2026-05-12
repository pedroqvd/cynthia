/**
 * Vercel Cron: diário às 12h BRT
 * Envia WhatsApp pedindo avaliação 24-48h após consulta realizada.
 */
import { createAdminClient } from '@/lib/supabase/server'
import { sendTextMessage } from '@/lib/whatsapp'
import { apiResponse, apiError } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const GOOGLE_REVIEWS_URL = process.env.GOOGLE_REVIEWS_URL ?? 'https://g.page/r/CXXXreview'

export async function GET() {
  const supabase = createAdminClient()

  const agora = new Date()
  const h24atras = new Date(agora.getTime() - 24 * 60 * 60 * 1000)
  const h48atras = new Date(agora.getTime() - 48 * 60 * 60 * 1000)

  // Consultas realizadas entre 24h e 48h atrás
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id, lead_id, procedimento, data_hora, avaliacao_enviada, leads(nome, whatsapp)')
    .eq('status', 'realizado')
    .eq('avaliacao_enviada', false)
    .gte('data_hora', h48atras.toISOString())
    .lt('data_hora', h24atras.toISOString())

  if (error) return apiError(error.message, 500)

  const results = await Promise.allSettled(
    (appointments ?? []).map(async (appt) => {
      const lead = Array.isArray(appt.leads) ? appt.leads[0] : appt.leads as { nome: string; whatsapp: string } | null
      if (!lead?.whatsapp) return

      await sendTextMessage({
        to: lead.whatsapp,
        text: `Olá, ${lead.nome}! 😊\n\nEsperamos que sua consulta com a Dra. Cynthia tenha sido incrível!\n\nSua opinião é muito importante para nós. Poderia nos deixar uma avaliação? Leva menos de 1 minuto 🙏\n\n⭐ ${GOOGLE_REVIEWS_URL}\n\nObrigada pela confiança! 🦷✨`,
      })

      // Marca como enviada para não reenviar
      await supabase
        .from('appointments')
        .update({ avaliacao_enviada: true })
        .eq('id', appt.id)
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return apiResponse({ sent, total: appointments?.length ?? 0 })
}

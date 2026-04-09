/**
 * Vercel Cron: toda segunda às 10h BRT
 * Reativação de leads inativos há 30+ dias
 */
import { createAdminClient } from '@/lib/supabase/server'
import { sendTemplateMessage, TEMPLATES, sendTextMessage } from '@/lib/whatsapp'
import { apiResponse, apiError } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET() {
  const supabase = createAdminClient()

  const trintaDiasAtras = new Date()
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, nome, whatsapp')
    .not('status', 'eq', 'fechado')
    .or(`last_seen.is.null,last_seen.lt.${trintaDiasAtras.toISOString()}`)
    .limit(50) // Limita para evitar spam

  if (error) return apiError(error.message, 500)

  const results = await Promise.allSettled(
    (leads ?? []).map(async (lead) => {
      try {
        await sendTemplateMessage({
          to: lead.whatsapp,
          ...TEMPLATES.reativacao30d(lead.nome),
        })
      } catch {
        await sendTextMessage({
          to: lead.whatsapp,
          text: `Olá, ${lead.nome}! 😊\n\nFaz um tempo que não conversamos. A Dra. Cynthia está com agenda disponível em Brasília.\n\nGostaria de retomar o contato? Estamos à disposição para agendar sua avaliação! 🦷✨`,
        })
      }

      await Promise.all([
        supabase
          .from('leads')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', lead.id),
        supabase.from('activity_log').insert({
          lead_id: lead.id,
          acao: 'reativacao_30d_enviada',
          detalhes: {},
        }),
      ])
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return apiResponse({ sent, total: leads?.length ?? 0 })
}

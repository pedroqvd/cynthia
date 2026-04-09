/**
 * Vercel Cron: diário às 09h BRT
 * Follow-up de leads sem resposta há 3 dias
 */
import { createAdminClient } from '@/lib/supabase/server'
import { sendTemplateMessage, TEMPLATES, sendTextMessage } from '@/lib/whatsapp'
import { apiResponse, apiError } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET() {
  const supabase = createAdminClient()

  const tresdiasAtras = new Date()
  tresdiasAtras.setDate(tresdiasAtras.getDate() - 3)

  // Leads em 'novo' ou 'em_contato' sem mensagem há 3 dias
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, nome, whatsapp')
    .in('status', ['novo', 'em_contato'])
    .or(`last_seen.is.null,last_seen.lt.${tresdiasAtras.toISOString()}`)

  if (error) return apiError(error.message, 500)

  const results = await Promise.allSettled(
    (leads ?? []).map(async (lead) => {
      try {
        await sendTemplateMessage({
          to: lead.whatsapp,
          ...TEMPLATES.followUp3d(lead.nome),
        })
      } catch {
        await sendTextMessage({
          to: lead.whatsapp,
          text: `Olá, ${lead.nome}! 😊\n\nPassou pelo nosso consultório da Dra. Cynthia recentemente. Gostaríamos de saber se ainda tem interesse em agendar sua avaliação.\n\nEstamos à disposição! 🦷`,
        })
      }

      // Atualiza status para 'em_contato' e registra log
      await Promise.all([
        supabase
          .from('leads')
          .update({ status: 'em_contato', last_seen: new Date().toISOString() })
          .eq('id', lead.id),
        supabase.from('activity_log').insert({
          lead_id: lead.id,
          acao: 'followup_3d_enviado',
          detalhes: {},
        }),
      ])
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return apiResponse({ sent, total: leads?.length ?? 0 })
}

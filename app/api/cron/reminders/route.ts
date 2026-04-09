/**
 * Vercel Cron: diário às 08h BRT
 * Envia lembretes de consulta 24h antes
 */
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendTemplateMessage, TEMPLATES, sendTextMessage } from '@/lib/whatsapp'
import { formatDateTime } from '@/lib/utils'
import { apiResponse, apiError } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  // Autenticado via middleware pelo header Authorization: Bearer CRON_SECRET
  const supabase = createAdminClient()

  const amanha = new Date()
  amanha.setDate(amanha.getDate() + 1)
  amanha.setHours(0, 0, 0, 0)

  const depoisDeAmanha = new Date(amanha)
  depoisDeAmanha.setDate(depoisDeAmanha.getDate() + 1)

  // Busca consultas de amanhã com status agendado ou confirmado
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id, lead_id, procedimento, data_hora, leads(nome, whatsapp, email)')
    .in('status', ['agendado', 'confirmado'])
    .gte('data_hora', amanha.toISOString())
    .lt('data_hora', depoisDeAmanha.toISOString())

  if (error) {
    return apiError(error.message, 500)
  }

  const results = await Promise.allSettled(
    (appointments ?? []).map(async (appt) => {
      const lead = Array.isArray(appt.leads) ? appt.leads[0] : appt.leads
      if (!lead?.whatsapp) return

      const dataFormatada = formatDateTime(appt.data_hora)

      try {
        await sendTemplateMessage({
          to: lead.whatsapp,
          ...TEMPLATES.lembrete24h(lead.nome, dataFormatada),
        })
      } catch {
        // Fallback para texto livre
        await sendTextMessage({
          to: lead.whatsapp,
          text: `Olá, ${lead.nome}! 🦷\n\n*Lembrete de consulta*\n\nSua consulta com a Dra. Cynthia é *amanhã* às ${dataFormatada}.\n\nLocal: Brasília — Asa Sul, DF\n\nConfirme respondendo *SIM* ou nos avise se precisar reagendar. 😊`,
        })
      }

      // Log
      await supabase.from('activity_log').insert({
        lead_id: appt.lead_id,
        acao: 'lembrete_24h_enviado',
        detalhes: { appointment_id: appt.id, data_hora: appt.data_hora },
      })
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return apiResponse({ sent, failed, total: appointments?.length ?? 0 })
}

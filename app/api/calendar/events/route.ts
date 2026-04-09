/**
 * GET  /api/calendar/events  → lista eventos
 * POST /api/calendar/events  → cria evento
 */
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listEvents, createEvent } from '@/lib/google-calendar'
import { appointmentSchema } from '@/lib/schemas'
import { sendTemplateMessage, TEMPLATES } from '@/lib/whatsapp'
import { sendConfirmationEmail } from '@/lib/resend'
import { formatDateTime } from '@/lib/utils'
import { apiResponse, apiError } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Não autorizado', 401)

  const days = parseInt(request.nextUrl.searchParams.get('days') ?? '30')

  try {
    const events = await listEvents(Math.min(days, 90))
    return apiResponse(events)
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Erro ao buscar eventos', 500)
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Não autorizado', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('JSON inválido', 400)
  }

  const parsed = appointmentSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422)
  }

  const { lead_id, procedimento, data_hora, duracao_min, notas } = parsed.data

  // Busca dados do lead (se informado)
  let leadNome = 'Paciente'
  let leadWhatsApp: string | null = null
  let leadEmail: string | null = null

  if (lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('nome, whatsapp, email')
      .eq('id', lead_id)
      .single()

    if (lead) {
      leadNome = lead.nome
      leadWhatsApp = lead.whatsapp
      leadEmail = lead.email
    }
  }

  // Calcula horário de fim
  const endDate = new Date(new Date(data_hora).getTime() + duracao_min * 60000)

  // Cria evento no Google Calendar
  let googleEventId: string | null = null
  try {
    const event = await createEvent({
      title: `${procedimento} — ${leadNome}`,
      description: [
        `Procedimento: ${procedimento}`,
        leadWhatsApp ? `WhatsApp: ${leadWhatsApp}` : '',
        notas ? `Observações: ${notas}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      startIso: data_hora,
      endIso: endDate.toISOString(),
      procedimento: procedimento.toLowerCase(),
      leadId: lead_id,
      guestEmail: leadEmail ?? undefined,
    })
    googleEventId = event.id
  } catch (err) {
    console.error('[Calendar] Erro ao criar evento:', err)
    // Continua sem criar no Google Calendar
  }

  // Salva no Supabase
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      lead_id: lead_id ?? null,
      google_event_id: googleEventId,
      procedimento,
      data_hora,
      duracao_min,
      status: 'agendado',
      notas: notas ?? null,
    })
    .select()
    .single()

  if (error) return apiError(error.message, 500)

  // Atualiza status do lead
  if (lead_id) {
    await supabase.from('leads').update({ status: 'agendado' }).eq('id', lead_id)
  }

  const dataFormatada = formatDateTime(data_hora)
  const ENDERECO = 'Brasília — Asa Sul, DF'

  // Envia confirmações (assíncrono)
  Promise.allSettled([
    // WhatsApp de confirmação
    leadWhatsApp
      ? sendTemplateMessage({
          to: leadWhatsApp,
          ...TEMPLATES.confirmacaoConsulta(leadNome, dataFormatada, ENDERECO),
        }).catch(() =>
          // Fallback texto
          import('@/lib/whatsapp').then(({ sendTextMessage }) =>
            sendTextMessage({
              to: leadWhatsApp!,
              text: `Olá, ${leadNome}! 🦷\n\nSua consulta está confirmada:\n📅 ${dataFormatada}\n📍 ${ENDERECO}\n\nQualquer dúvida, é só responder aqui. Até lá! 😊`,
            })
          )
        )
      : Promise.resolve(),

    // E-mail de confirmação
    leadEmail
      ? sendConfirmationEmail({
          to: leadEmail,
          nome: leadNome,
          procedimento,
          dataHora: dataFormatada,
          endereco: ENDERECO,
        })
      : Promise.resolve(),

    // Log
    supabase.from('activity_log').insert({
      lead_id: lead_id ?? null,
      user_id: user.id,
      acao: 'consulta_agendada',
      detalhes: { procedimento, data_hora, google_event_id: googleEventId },
    }),
  ])

  revalidatePath('/admin/agenda')
  return apiResponse(appointment, 201)
}

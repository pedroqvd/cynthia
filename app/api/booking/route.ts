/**
 * POST /api/booking
 * Endpoint público: cria/atualiza lead + agenda consulta no Google Calendar.
 * Usado pelo formulário de agendamento do site quando paciente escolhe horário.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { leadSchema } from '@/lib/schemas'
import { createEvent } from '@/lib/google-calendar'
import { sendConfirmationEmail } from '@/lib/resend'
import { sendTextMessage } from '@/lib/whatsapp'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'
import { apiResponse, apiError } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  const rl = await checkRateLimit(`booking:${ip}`)
  if (rl) return rl

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return apiError('JSON inválido', 400)
  }

  // Valida campos do lead
  const parsed = leadSchema.safeParse({ ...body, status: 'novo' })
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422)
  }

  // Valida data/hora (obrigatória nessa rota)
  const dataHora = body.data_hora as string | undefined
  if (!dataHora) return apiError('data_hora obrigatória', 400)

  const dataDate = new Date(dataHora)
  if (isNaN(dataDate.getTime()) || dataDate < new Date()) {
    return apiError('data_hora inválida ou no passado', 400)
  }

  const supabase = createAdminClient()
  const data = parsed.data

  // Cria ou atualiza lead
  let leadId: string
  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('whatsapp', data.whatsapp)
    .single()

  if (existing) {
    leadId = existing.id
    await supabase.from('leads').update({
      nome: data.nome,
      email: data.email || null,
      especialidade: data.especialidade || null,
      status: 'agendado',
      last_seen: new Date().toISOString(),
    }).eq('id', leadId)
  } else {
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert({
        nome: data.nome,
        whatsapp: data.whatsapp,
        email: data.email || null,
        especialidade: data.especialidade || null,
        origem: 'site',
        status: 'agendado',
        last_seen: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !newLead) return apiError('Erro ao criar lead', 500)
    leadId = newLead.id
  }

  // Cria evento no Google Calendar
  const duracao = 60 // minutos
  const endDate = new Date(dataDate.getTime() + duracao * 60000)
  let googleEventId: string | null = null

  try {
    const event = await createEvent({
      title: `Avaliação — ${data.nome}`,
      description: [
        `Especialidade: ${data.especialidade ?? 'A definir'}`,
        `WhatsApp: ${data.whatsapp}`,
        data.email ? `Email: ${data.email}` : '',
      ].filter(Boolean).join('\n'),
      startIso: dataDate.toISOString(),
      endIso: endDate.toISOString(),
      procedimento: 'avaliação',
      leadId,
      guestEmail: data.email || undefined,
    })
    googleEventId = event.id
  } catch (err) {
    console.error('[booking] Falha Google Calendar:', err)
    // Continua sem calendário — não bloqueia o agendamento
  }

  // Salva appointment
  await supabase.from('appointments').insert({
    lead_id: leadId,
    google_event_id: googleEventId,
    procedimento: `Avaliação inicial${data.especialidade ? ` — ${data.especialidade}` : ''}`,
    data_hora: dataDate.toISOString(),
    duracao_min: duracao,
    status: 'agendado',
  })

  const dataFormatada = dataDate.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Notificações assíncronas
  Promise.allSettled([
    sendTextMessage({
      to: data.whatsapp,
      text: `Olá, ${data.nome}! 🦷\n\nSua consulta com a Dra. Cynthia está confirmada:\n📅 ${dataFormatada}\n📍 Brasília — Asa Sul, DF\n\nQualquer dúvida, é só nos chamar. Até lá! 😊`,
    }),
    data.email
      ? sendConfirmationEmail({
          to: data.email,
          nome: data.nome,
          procedimento: 'Avaliação inicial',
          dataHora: dataFormatada,
          endereco: 'Brasília — Asa Sul, DF',
        })
      : Promise.resolve(),
  ])

  return apiResponse({ leadId, agendado: true, dataHora: dataDate.toISOString() }, 201)
}

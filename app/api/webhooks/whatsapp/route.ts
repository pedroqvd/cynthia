/**
 * Webhook — Meta WhatsApp Business Cloud API
 * GET  /api/webhooks/whatsapp  → verificação do webhook
 * POST /api/webhooks/whatsapp  → recebimento de eventos
 */
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validateWebhookSignature, mensagemBoasVindas, mensagemAusencia, sendTextMessage } from '@/lib/whatsapp'
import { sendNewLeadEmail } from '@/lib/resend'
import { apiResponse, apiError } from '@/lib/utils'

export const runtime = 'edge'

// ── GET: verificação do webhook pela Meta ─────────────────────────
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const mode = params.get('hub.mode')
  const token = params.get('hub.verify_token')
  const challenge = params.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }

  return apiError('Verificação falhou', 403)
}

// ── POST: eventos de mensagens ────────────────────────────────────
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-hub-signature-256') ?? ''

  // Valida assinatura HMAC
  const isValid = await validateWebhookSignature(rawBody, signature)
  if (!isValid) {
    return apiError('Assinatura inválida', 401)
  }

  let payload: WhatsAppWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return apiError('Payload inválido', 400)
  }

  // Processa cada entrada do webhook
  const entry = payload.entry?.[0]
  const changes = entry?.changes?.[0]
  const value = changes?.value

  if (!value?.messages?.length) {
    // Pode ser status update (delivered, read) — atualiza status da mensagem
    const statuses = value?.statuses ?? []
    if (statuses.length > 0) {
      await handleStatusUpdates(statuses)
    }
    return apiResponse({ received: true })
  }

  const supabase = createAdminClient()

  for (const msg of value.messages) {
    await processIncomingMessage(supabase, msg, value.contacts?.[0])
  }

  return apiResponse({ received: true })
}

// ── Processa mensagem recebida ────────────────────────────────────
async function processIncomingMessage(
  supabase: ReturnType<typeof createAdminClient>,
  msg: WppMessage,
  contact: WppContact | undefined
) {
  const phone = msg.from
  const nome = contact?.profile?.name ?? 'Paciente'
  const text = msg.text?.body ?? msg.type

  // Verifica se lead já existe
  const { data: existingLead } = await supabase
    .from('leads')
    .select('id, nome, status')
    .eq('whatsapp', phone)
    .single()

  let leadId: string

  if (existingLead) {
    leadId = existingLead.id
    // Atualiza last_seen
    await supabase.from('leads').update({ last_seen: new Date().toISOString() }).eq('id', leadId)
  } else {
    // Cria novo lead
    const { data: newLead } = await supabase
      .from('leads')
      .insert({
        nome,
        whatsapp: phone,
        status: 'novo',
        origem: 'whatsapp',
        last_seen: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (!newLead) return

    leadId = newLead.id

    // Notifica por e-mail
    try {
      await sendNewLeadEmail({ nome, whatsapp: phone, especialidade: 'A qualificar', origem: 'whatsapp' })
    } catch { /* silencioso */ }

    // Envia boas-vindas (verifica horário comercial)
    const agora = new Date()
    const horaLocal = agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false })
    const hora = parseInt(horaLocal)
    const diaUtil = agora.getDay() >= 1 && agora.getDay() <= 5

    const dentroHorario = diaUtil && hora >= 8 && hora < 18

    try {
      if (dentroHorario) {
        await sendTextMessage({ to: phone, text: mensagemBoasVindas(nome) })
      } else {
        await sendTextMessage({ to: phone, text: mensagemAusencia() })
      }
    } catch { /* silencioso — não bloqueia processamento */ }
  }

  // Salva a mensagem no banco
  await supabase.from('messages').insert({
    lead_id: leadId,
    direction: 'in',
    content: text,
    type: msg.type === 'text' ? 'text' : 'interactive',
    whatsapp_message_id: msg.id,
    status: 'received',
  })
}

// ── Atualiza status de mensagens enviadas ─────────────────────────
async function handleStatusUpdates(
  statuses: WppStatus[]
) {
  const supabase = createAdminClient()
  for (const s of statuses) {
    await supabase
      .from('messages')
      .update({ status: s.status as 'sent' | 'delivered' | 'read' | 'failed' })
      .eq('whatsapp_message_id', s.id)
  }
}

// ── Tipos do payload da Meta ──────────────────────────────────────
interface WhatsAppWebhookPayload {
  object: string
  entry: Array<{
    changes: Array<{
      value: {
        messages?: WppMessage[]
        contacts?: WppContact[]
        statuses?: WppStatus[]
      }
    }>
  }>
}

interface WppMessage {
  id: string
  from: string
  type: string
  text?: { body: string }
  interactive?: {
    type: string
    list_reply?: { id: string; title: string }
    button_reply?: { id: string; title: string }
  }
}

interface WppContact {
  profile: { name: string }
  wa_id: string
}

interface WppStatus {
  id: string
  status: string
  timestamp: string
  recipient_id: string
}

/**
 * Integração com Meta WhatsApp Business Cloud API
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const BASE_URL = 'https://graph.facebook.com/v19.0'

interface WppTextMessage {
  to: string
  text: string
}

interface WppTemplateMessage {
  to: string
  templateName: string
  languageCode?: string
  components?: WppTemplateComponent[]
}

interface WppTemplateComponent {
  type: 'header' | 'body' | 'button'
  parameters: WppTemplateParameter[]
  sub_type?: string
  index?: number
}

interface WppTemplateParameter {
  type: 'text' | 'image' | 'document'
  text?: string
  image?: { link: string }
}

interface WppSendResult {
  messages: Array<{ id: string }>
  contacts: Array<{ wa_id: string }>
}

/** Envia mensagem de texto livre */
export async function sendTextMessage({ to, text }: WppTextMessage): Promise<WppSendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formatPhone(to),
    type: 'text',
    text: { preview_url: false, body: text },
  }

  const res = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`WhatsApp API error: ${JSON.stringify(err)}`)
  }

  return res.json()
}

/** Envia mensagem de template aprovado */
export async function sendTemplateMessage({
  to,
  templateName,
  languageCode = 'pt_BR',
  components = [],
}: WppTemplateMessage): Promise<WppSendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!

  const payload = {
    messaging_product: 'whatsapp',
    to: formatPhone(to),
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  }

  const res = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`WhatsApp API error (template): ${JSON.stringify(err)}`)
  }

  return res.json()
}

/** Valida assinatura HMAC-SHA256 do webhook da Meta */
export async function validateWebhookSignature(
  body: string,
  signature: string
): Promise<boolean> {
  const appSecret = process.env.WHATSAPP_APP_SECRET!
  const encoder = new TextEncoder()

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const receivedSignature = signature.replace('sha256=', '')
  return expectedSignature === receivedSignature
}

/** Normaliza número para formato internacional: 5561999999999 */
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Adiciona código do Brasil se não tiver
  if (digits.length === 11 && digits.startsWith('0')) {
    return `55${digits.slice(1)}`
  }
  if (digits.length === 11) {
    return `55${digits}`
  }
  return digits
}

/** Templates para envio automático */
export const TEMPLATES = {
  boasVindas: (nome: string) => ({
    templateName: 'boasvindas_qualificacao',
    components: [
      {
        type: 'body' as const,
        parameters: [{ type: 'text' as const, text: nome }],
      },
    ],
  }),

  confirmacaoConsulta: (nome: string, dataHora: string, endereco: string) => ({
    templateName: 'confirmacao_consulta',
    components: [
      {
        type: 'body' as const,
        parameters: [
          { type: 'text' as const, text: nome },
          { type: 'text' as const, text: dataHora },
          { type: 'text' as const, text: endereco },
        ],
      },
    ],
  }),

  lembrete24h: (nome: string, dataHora: string) => ({
    templateName: 'lembrete_24h',
    components: [
      {
        type: 'body' as const,
        parameters: [
          { type: 'text' as const, text: nome },
          { type: 'text' as const, text: dataHora },
        ],
      },
    ],
  }),

  followUp3d: (nome: string) => ({
    templateName: 'follow_up_3d',
    components: [
      {
        type: 'body' as const,
        parameters: [{ type: 'text' as const, text: nome }],
      },
    ],
  }),

  reativacao30d: (nome: string) => ({
    templateName: 'reativacao_30d',
    components: [
      {
        type: 'body' as const,
        parameters: [{ type: 'text' as const, text: nome }],
      },
    ],
  }),
}

/** Mensagem de boas-vindas automática (texto livre — fallback se template não aprovado) */
export function mensagemBoasVindas(nome: string): string {
  return `Olá, ${nome}! 😊

Obrigada pelo seu contato! Sou a equipe da *Dra. Cynthia*, especialista em Estética Dental, Cirurgia Bucomaxilofacial e Prótese em Brasília.

Para te atender melhor, qual é o principal motivo do seu interesse?

1️⃣ Estética & Design do Sorriso (facetas, clareamento)
2️⃣ Cirurgia & Implantes (implantes, cirurgia)
3️⃣ Prótese, DTM ou Bruxismo

Responda com o número da opção. 🙏`
}

/** Mensagem de ausência (fora do horário comercial) */
export function mensagemAusencia(): string {
  return `Olá! 👋

Obrigada pelo seu contato com o consultório da *Dra. Cynthia*.

No momento estamos fora do horário de atendimento (segunda a sexta, 8h–18h). Sua mensagem foi recebida e retornaremos em breve.

Para urgências, ligue: *+55 61 9999-9999*`
}

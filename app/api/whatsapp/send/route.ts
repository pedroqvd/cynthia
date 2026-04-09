/**
 * POST /api/whatsapp/send — Envia mensagem WhatsApp (autenticado)
 */
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTextMessage, sendTemplateMessage, TEMPLATES } from '@/lib/whatsapp'
import { sendMessageSchema } from '@/lib/schemas'
import { apiResponse, apiError } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return apiError('Não autorizado', 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('JSON inválido', 400)
  }

  const parsed = sendMessageSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422)
  }

  const { lead_id, type, content, template_name, template_vars } = parsed.data

  // Busca o WhatsApp do lead
  const { data: lead } = await supabase
    .from('leads')
    .select('id, nome, whatsapp')
    .eq('id', lead_id)
    .single()

  if (!lead) {
    return apiError('Lead não encontrado', 404)
  }

  try {
    let wppMessageId: string | null = null

    if (type === 'text') {
      const result = await sendTextMessage({ to: lead.whatsapp, text: content })
      wppMessageId = result.messages[0]?.id ?? null
    } else if (type === 'template' && template_name) {
      const result = await sendTemplateMessage({
        to: lead.whatsapp,
        templateName: template_name,
        components: template_vars
          ? [
              {
                type: 'body',
                parameters: Object.values(template_vars).map((v) => ({
                  type: 'text' as const,
                  text: v,
                })),
              },
            ]
          : [],
      })
      wppMessageId = result.messages[0]?.id ?? null
    }

    // Salva mensagem no banco
    const { data: msg } = await supabase
      .from('messages')
      .insert({
        lead_id,
        direction: 'out',
        content,
        type,
        template_name: template_name ?? null,
        whatsapp_message_id: wppMessageId,
        status: 'sent',
      })
      .select()
      .single()

    // Log de atividade
    await supabase.from('activity_log').insert({
      lead_id,
      user_id: user.id,
      acao: 'mensagem_enviada',
      detalhes: { type, template_name },
    })

    return apiResponse(msg)
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Erro ao enviar mensagem', 500)
  }
}

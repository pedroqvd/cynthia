/**
 * POST /api/ai/suggest-reply
 * Usa Claude (Anthropic API) para sugerir resposta personalizada ao lead.
 * Requer autenticação admin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { leadId } = await req.json()
  if (!leadId) return NextResponse.json({ error: 'leadId obrigatório' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })

  // Busca dados do lead + histórico de mensagens
  const { data: lead } = await supabase
    .from('leads')
    .select('nome, especialidade, urgencia, status, observacoes, messages(direction, content, created_at)')
    .eq('id', leadId)
    .order('created_at', { referencedTable: 'messages', ascending: true })
    .single()

  if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })

  const messages = (lead.messages ?? []) as { direction: string; content: string; created_at: string }[]
  const historico = messages
    .slice(-10) // últimas 10 mensagens
    .map((m) => `${m.direction === 'in' ? lead.nome : 'Consultório'}: ${m.content}`)
    .join('\n')

  const prompt = `Você é assistente da Dra. Cynthia Quevedo, cirurgiã-dentista especialista em estética dental, cirurgia bucomaxilofacial e prótese em Brasília-DF.

Dados do paciente:
- Nome: ${lead.nome}
- Especialidade de interesse: ${lead.especialidade ?? 'não informada'}
- Urgência: ${lead.urgencia ?? 'não informada'}
- Status: ${lead.status}
${lead.observacoes ? `- Observações: ${lead.observacoes}` : ''}

Histórico da conversa (WhatsApp):
${historico || '(sem mensagens ainda)'}

Escreva UMA resposta curta e natural (máximo 3 frases) para o WhatsApp do paciente.
Tom: caloroso, profissional, objetivo. Use português brasileiro informal mas elegante.
Não use "prezado(a)", não repita o nome várias vezes. Responda diretamente à última mensagem do paciente.
Se não há histórico, dê uma saudação de boas-vindas personalizada com base no interesse declarado.
Responda APENAS com o texto da mensagem, sem explicações adicionais.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[AI suggest-reply]', err)
    return NextResponse.json({ error: 'Erro ao chamar IA' }, { status: 502 })
  }

  const json = await res.json() as { content: Array<{ type: string; text: string }> }
  const suggestion = json.content?.[0]?.text?.trim() ?? ''

  return NextResponse.json({ suggestion })
}

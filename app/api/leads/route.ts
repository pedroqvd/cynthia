/**
 * GET  /api/leads  → lista leads (autenticado)
 * POST /api/leads  → cria lead (público — formulário do site)
 */
import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { leadSchema } from '@/lib/schemas'
import { sendNewLeadEmail, sendConfirmationEmail } from '@/lib/resend'
import { sendTextMessage, mensagemBoasVindas } from '@/lib/whatsapp'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'
import { apiResponse, apiError } from '@/lib/utils'

// ── GET: lista leads (admin) ──────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return apiError('Não autorizado', 401)
  }

  const url = request.nextUrl
  const format = url.searchParams.get('format')
  const status = url.searchParams.get('status')
  const search = url.searchParams.get('q')
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 100)

  // Export CSV — sem paginação, retorna todos
  if (format === 'csv') {
    const { data: allLeads, error } = await supabase
      .from('leads')
      .select('id, nome, whatsapp, email, especialidade, urgencia, origem, status, ticket_estimado, observacoes, created_at, last_seen')
      .order('created_at', { ascending: false })
      .limit(5000)

    if (error) return apiError(error.message, 500)

    const headers = ['ID', 'Nome', 'WhatsApp', 'Email', 'Especialidade', 'Urgência', 'Origem', 'Status', 'Ticket (R$)', 'Observações', 'Criado em', 'Último contato']
    const rows = (allLeads ?? []).map((l) => [
      l.id,
      l.nome,
      l.whatsapp,
      l.email ?? '',
      l.especialidade ?? '',
      l.urgencia ?? '',
      l.origem ?? '',
      l.status,
      l.ticket_estimado ?? '',
      (l.observacoes ?? '').replace(/"/g, '""'),
      l.created_at ? new Date(l.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '',
      l.last_seen ? new Date(l.last_seen).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '',
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\r\n')

    const today = new Date().toISOString().slice(0, 10)
    return new Response('\uFEFF' + csv, {  // BOM para Excel reconhecer UTF-8
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-${today}.csv"`,
      },
    })
  }

  let query = supabase
    .from('leads')
    .select('*, messages(count)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)
  if (search) query = query.or(`nome.ilike.%${search}%,whatsapp.ilike.%${search}%`)

  const { data, error } = await query

  if (error) return apiError(error.message, 500)
  return apiResponse(data)
}

// ── POST: cria lead (formulário público) ─────────────────────────
export async function POST(request: NextRequest) {
  // Rate limiting por IP
  const ip = getClientIP(request)
  const rateLimitResponse = await checkRateLimit(`leads:${ip}`)
  if (rateLimitResponse) return rateLimitResponse

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('JSON inválido', 400)
  }

  const parsed = leadSchema.safeParse({ ...body, status: 'novo' })
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422)
  }

  const data = parsed.data
  const supabase = createAdminClient()

  // Verifica se já existe lead com esse WhatsApp
  const { data: existing } = await supabase
    .from('leads')
    .select('id, status')
    .eq('whatsapp', data.whatsapp)
    .single()

  if (existing) {
    // Atualiza dados e retorna o lead existente
    await supabase
      .from('leads')
      .update({
        nome: data.nome,
        email: data.email || null,
        especialidade: data.especialidade || null,
        urgencia: data.urgencia || null,
        observacoes: data.observacoes || null,
        last_seen: new Date().toISOString(),
      })
      .eq('id', existing.id)

    return apiResponse({ id: existing.id, isNew: false })
  }

  // Cria novo lead
  const { data: newLead, error } = await supabase
    .from('leads')
    .insert({
      nome: data.nome,
      cpf: (data as Record<string, unknown>)['cpf'] as string || null,
      whatsapp: data.whatsapp,
      email: data.email || null,
      especialidade: data.especialidade || null,
      urgencia: data.urgencia || null,
      convenio: (data as Record<string, unknown>)['convenio'] as string || null,
      origem: (body as Record<string, string>)['origem'] ?? 'site',
      status: 'novo',
      observacoes: data.observacoes || null,
      last_seen: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !newLead) {
    return apiError(error?.message ?? 'Erro ao criar lead', 500)
  }

  // Ações paralelas pós-criação (não bloqueia resposta)
  Promise.allSettled([
    // Notificação por e-mail para a equipe
    sendNewLeadEmail({
      nome: data.nome,
      whatsapp: data.whatsapp,
      especialidade: data.especialidade ?? 'Não informada',
      origem: (body as Record<string, string>)['origem'] ?? 'site',
    }),

    // E-mail de confirmação para o paciente (se informou e-mail)
    data.email
      ? sendConfirmationEmail({
          to: data.email,
          nome: data.nome,
          procedimento: 'Avaliação inicial',
          dataHora: 'A definir — nossa equipe entrará em contato',
          endereco: 'Brasília — Asa Sul, DF',
        })
      : Promise.resolve(),

    // Mensagem de boas-vindas pelo WhatsApp
    sendTextMessage({
      to: data.whatsapp,
      text: mensagemBoasVindas(data.nome),
    }),
  ])

  return apiResponse({ id: newLead.id, isNew: true }, 201)
}

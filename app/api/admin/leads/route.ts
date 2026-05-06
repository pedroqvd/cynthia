import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { leadSchema } from '@/lib/schemas'
import { apiResponse, apiError } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Não autorizado', 401)

  let body: unknown
  try { body = await request.json() } catch { return apiError('JSON inválido', 400) }

  const parsed = leadSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422)

  const data = parsed.data

  const normalizePhone = (p: string) => p.replace(/\D/g, '')
  const whatsappNorm = normalizePhone(data.whatsapp)

  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('whatsapp', whatsappNorm)
    .maybeSingle()

  if (existing) return apiError('Já existe um paciente com este WhatsApp.', 409)

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      nome: data.nome,
      cpf: data.cpf || null,
      whatsapp: whatsappNorm,
      email: data.email || null,
      especialidade: data.especialidade || null,
      urgencia: data.urgencia || null,
      origem: 'admin',
      status: data.status ?? 'novo',
      ticket_estimado: data.ticket_estimado ?? null,
      observacoes: data.observacoes || null,
      data_nascimento: data.data_nascimento || null,
      convenio: data.convenio || null,
      indicado_por: data.indicado_por || null,
    })
    .select()
    .single()

  if (error) return apiError(error.message, 500)
  return apiResponse(lead, 201)
}

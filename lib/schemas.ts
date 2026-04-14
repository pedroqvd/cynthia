import { z } from 'zod'

const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/

export const ESPECIALIDADES = [
  { value: 'estetica', label: 'Estética & Design do Sorriso' },
  { value: 'implante', label: 'Implantes Dentários' },
  { value: 'aparelho', label: 'Ortodontia & Aparelho' },
  { value: 'clareamento', label: 'Clareamento Dental' },
  { value: 'protese', label: 'Prótese & Reabilitação' },
  { value: 'canal', label: 'Tratamento de Canal' },
  { value: 'restauracao', label: 'Restaurações' },
  { value: 'cirurgia', label: 'Cirurgia Oral' },
  { value: 'outro', label: 'Outro / Não sei' },
] as const

export type EspecialidadeValue = typeof ESPECIALIDADES[number]['value']

/** Formulário de agendamento no site público */
export const agendamentoSchema = z.object({
  nome: z.string().min(2, 'Nome muito curto').max(100, 'Nome muito longo'),
  cpf: z.string().regex(cpfRegex, 'CPF inválido (ex: 000.000.000-00)'),
  whatsapp: z
    .string()
    .min(10, 'WhatsApp inválido')
    .regex(/^\+?[\d\s\-()]+$/, 'Formato inválido'),
  email: z.string().email('E-mail inválido'),
  especialidade: z.enum(
    ESPECIALIDADES.map((e) => e.value) as [EspecialidadeValue, ...EspecialidadeValue[]],
    { required_error: 'Selecione uma especialidade' }
  ),
  urgencia: z.enum(['alta', 'media', 'baixa']).default('media'),
  convenio: z.string().max(100).optional().or(z.literal('')),
  mensagem: z.string().max(500).optional(),
  lgpd: z.boolean().refine((v) => v === true, {
    message: 'Você deve aceitar a política de privacidade',
  }),
})

export type AgendamentoInput = z.infer<typeof agendamentoSchema>

/** Criação/edição de lead no painel */
export const leadSchema = z.object({
  nome: z.string().min(2).max(100),
  cpf: z.string().regex(cpfRegex, 'CPF inválido').optional().or(z.literal('')),
  whatsapp: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
  especialidade: z.string().optional(),
  urgencia: z.enum(['alta', 'media', 'baixa']).optional(),
  origem: z.string().optional(),
  status: z.enum(['novo', 'em_contato', 'agendado', 'proposta', 'fechado']),
  ticket_estimado: z.number().nonnegative().optional(),
  observacoes: z.string().max(2000).optional(),
  data_nascimento: z.string().optional().or(z.literal('')),
  convenio: z.string().max(100).optional().or(z.literal('')),
  indicado_por: z.string().max(200).optional().or(z.literal('')),
})

export type LeadInput = z.infer<typeof leadSchema>

/** Criação de consulta / evento */
export const appointmentSchema = z.object({
  lead_id: z.string().uuid().optional(),
  procedimento: z.string().min(2).max(200),
  data_hora: z.string().datetime({ offset: true }),
  duracao_min: z.number().int().min(15).max(480).default(60),
  notas: z.string().max(2000).optional(),
})

export type AppointmentInput = z.infer<typeof appointmentSchema>

/** Envio de mensagem WhatsApp */
export const sendMessageSchema = z.object({
  lead_id: z.string().uuid(),
  type: z.enum(['text', 'template']),
  content: z.string().min(1).max(4096),
  template_name: z.string().optional(),
  template_vars: z.record(z.string()).optional(),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>

/** Upload de imagem */
export const uploadSchema = z.object({
  bucket: z.enum(['before_after', 'testimonials', 'site']),
  file_name: z.string(),
})

/** Configurações do site */
export const siteConfigSchema = z.object({
  consultorio_nome: z.string().optional(),
  consultorio_endereco: z.string().optional(),
  consultorio_telefone: z.string().optional(),
  consultorio_whatsapp: z.string().optional(),
  horario_abertura: z.string().optional(),
  horario_fechamento: z.string().optional(),
  hero_headline: z.string().optional(),
  hero_subtitulo: z.string().optional(),
  sobre_texto: z.string().optional(),
  cal_link: z.string().url().optional(),
})

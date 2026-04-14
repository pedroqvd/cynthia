import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formata número de WhatsApp para exibição: +55 61 9 9999-9999 */
export function formatWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 13) {
    // +55 DD 9 NNNN-NNNN
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 5)} ${digits.slice(5, 9)}-${digits.slice(9)}`
  }
  return raw
}

/** Retorna URL do WhatsApp para envio de mensagem */
export function whatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

/** Formata data/hora em pt-BR */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso))
}

/** Formata data em pt-BR */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso))
}

/** Gera resposta de API padronizada */
export function apiResponse<T>(data: T, status = 200): Response {
  return Response.json({ data, error: null }, { status })
}

/** Gera resposta de erro de API padronizada */
export function apiError(message: string, status = 400): Response {
  return Response.json({ data: null, error: message }, { status })
}

/** Máscaras de urgência */
export const URGENCIA_LABELS: Record<string, string> = {
  alta: 'Urgente',
  media: 'Normal',
  baixa: 'Sem pressa',
}

export const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo Lead',
  em_contato: 'Em Contato',
  agendado: 'Agendado',
  proposta: 'Proposta Enviada',
  fechado: 'Fechado',
}

export const ESPECIALIDADE_LABELS: Record<string, string> = {
  estetica: 'Estética & Design do Sorriso',
  implante: 'Implantes Dentários',
  aparelho: 'Ortodontia & Aparelho',
  clareamento: 'Clareamento Dental',
  protese: 'Prótese & Reabilitação',
  canal: 'Tratamento de Canal',
  restauracao: 'Restaurações',
  cirurgia: 'Cirurgia Oral',
  outro: 'Outro / Não sei',
}

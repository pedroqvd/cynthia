export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: Lead
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Lead, 'id' | 'created_at'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at'>>
      }
      appointments: {
        Row: Appointment
        Insert: Omit<Appointment, 'id' | 'created_at'>
        Update: Partial<Omit<Appointment, 'id' | 'created_at'>>
      }
      before_after: {
        Row: BeforeAfter
        Insert: Omit<BeforeAfter, 'id' | 'created_at'>
        Update: Partial<Omit<BeforeAfter, 'id' | 'created_at'>>
      }
      testimonials: {
        Row: Testimonial
        Insert: Omit<Testimonial, 'id'>
        Update: Partial<Omit<Testimonial, 'id'>>
      }
      activity_log: {
        Row: ActivityLog
        Insert: Omit<ActivityLog, 'id' | 'created_at'>
        Update: never
      }
      site_config: {
        Row: SiteConfig
        Insert: SiteConfig
        Update: Partial<SiteConfig>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export interface Lead {
  id: string
  nome: string
  whatsapp: string
  email: string | null
  especialidade: string | null
  urgencia: 'alta' | 'media' | 'baixa' | null
  origem: string | null
  status: 'novo' | 'em_contato' | 'agendado' | 'proposta' | 'fechado'
  ticket_estimado: number | null
  observacoes: string | null
  created_at: string
  updated_at: string
  last_seen: string | null
}

export interface Message {
  id: string
  lead_id: string
  direction: 'in' | 'out'
  content: string
  type: 'text' | 'template' | 'interactive' | 'image' | 'audio'
  template_name: string | null
  whatsapp_message_id: string | null
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received'
  created_at: string
}

export interface Appointment {
  id: string
  lead_id: string | null
  google_event_id: string | null
  procedimento: string
  data_hora: string
  duracao_min: number
  status: 'agendado' | 'confirmado' | 'realizado' | 'cancelado'
  notas: string | null
  created_at: string
}

export interface BeforeAfter {
  id: string
  procedimento: string
  descricao: string | null
  foto_antes_url: string
  foto_depois_url: string
  ativo: boolean
  ordem: number
  created_at: string
}

export interface Testimonial {
  id: string
  nome: string
  cargo: string | null
  texto: string
  foto_url: string | null
  nota: number
  ativo: boolean
  ordem: number
}

export interface ActivityLog {
  id: string
  lead_id: string | null
  user_id: string | null
  acao: string
  detalhes: Json | null
  created_at: string
}

export interface SiteConfig {
  key: string
  value: string
  updated_at: string
}

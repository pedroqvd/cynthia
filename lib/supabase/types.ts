export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
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
        Insert: {
          id?: string
          nome: string
          whatsapp: string
          email?: string | null
          especialidade?: string | null
          urgencia?: 'alta' | 'media' | 'baixa' | null
          origem?: string | null
          status?: 'novo' | 'em_contato' | 'agendado' | 'proposta' | 'fechado'
          ticket_estimado?: number | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
          last_seen?: string | null
        }
        Update: {
          id?: string
          nome?: string
          whatsapp?: string
          email?: string | null
          especialidade?: string | null
          urgencia?: 'alta' | 'media' | 'baixa' | null
          origem?: string | null
          status?: 'novo' | 'em_contato' | 'agendado' | 'proposta' | 'fechado'
          ticket_estimado?: number | null
          observacoes?: string | null
          updated_at?: string
          last_seen?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          lead_id: string | null
          direction: 'in' | 'out'
          content: string
          type: 'text' | 'template' | 'interactive' | 'image' | 'audio'
          template_name: string | null
          whatsapp_message_id: string | null
          status: 'sent' | 'delivered' | 'read' | 'failed' | 'received' | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          direction: 'in' | 'out'
          content: string
          type?: 'text' | 'template' | 'interactive' | 'image' | 'audio'
          template_name?: string | null
          whatsapp_message_id?: string | null
          status?: 'sent' | 'delivered' | 'read' | 'failed' | 'received' | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          direction?: 'in' | 'out'
          content?: string
          type?: 'text' | 'template' | 'interactive' | 'image' | 'audio'
          template_name?: string | null
          whatsapp_message_id?: string | null
          status?: 'sent' | 'delivered' | 'read' | 'failed' | 'received' | null
        }
        Relationships: [
          {
            foreignKeyName: 'messages_lead_id_fkey'
            columns: ['lead_id']
            referencedRelation: 'leads'
            referencedColumns: ['id']
          }
        ]
      }
      appointments: {
        Row: {
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
        Insert: {
          id?: string
          lead_id?: string | null
          google_event_id?: string | null
          procedimento: string
          data_hora: string
          duracao_min?: number
          status?: 'agendado' | 'confirmado' | 'realizado' | 'cancelado'
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          google_event_id?: string | null
          procedimento?: string
          data_hora?: string
          duracao_min?: number
          status?: 'agendado' | 'confirmado' | 'realizado' | 'cancelado'
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'appointments_lead_id_fkey'
            columns: ['lead_id']
            referencedRelation: 'leads'
            referencedColumns: ['id']
          }
        ]
      }
      before_after: {
        Row: {
          id: string
          procedimento: string
          descricao: string | null
          foto_antes_url: string
          foto_depois_url: string
          ativo: boolean
          ordem: number
          created_at: string
        }
        Insert: {
          id?: string
          procedimento: string
          descricao?: string | null
          foto_antes_url: string
          foto_depois_url: string
          ativo?: boolean
          ordem?: number
          created_at?: string
        }
        Update: {
          id?: string
          procedimento?: string
          descricao?: string | null
          foto_antes_url?: string
          foto_depois_url?: string
          ativo?: boolean
          ordem?: number
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          id: string
          nome: string
          cargo: string | null
          texto: string
          foto_url: string | null
          nota: number
          ativo: boolean
          ordem: number
        }
        Insert: {
          id?: string
          nome: string
          cargo?: string | null
          texto: string
          foto_url?: string | null
          nota?: number
          ativo?: boolean
          ordem?: number
        }
        Update: {
          id?: string
          nome?: string
          cargo?: string | null
          texto?: string
          foto_url?: string | null
          nota?: number
          ativo?: boolean
          ordem?: number
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          id: string
          lead_id: string | null
          user_id: string | null
          acao: string
          detalhes: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          user_id?: string | null
          acao: string
          detalhes?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          user_id?: string | null
          acao?: string
          detalhes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'activity_log_lead_id_fkey'
            columns: ['lead_id']
            referencedRelation: 'leads'
            referencedColumns: ['id']
          }
        ]
      }
      site_config: {
        Row: {
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          user_id: string
          role: 'admin' | 'secretaria'
          nome: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          role: 'admin' | 'secretaria'
          nome?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          role?: 'admin' | 'secretaria'
          nome?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          id: string
          nome: string
          tipo: 'receita' | 'despesa'
          cor: string
          ordem: number
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          tipo: 'receita' | 'despesa'
          cor?: string
          ordem?: number
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          tipo?: 'receita' | 'despesa'
          cor?: string
          ordem?: number
          ativo?: boolean
        }
        Relationships: []
      }
      financial_entries: {
        Row: {
          id: string
          tipo: 'receita' | 'despesa'
          descricao: string
          valor: number
          data: string
          categoria_id: string | null
          lead_id: string | null
          appointment_id: string | null
          forma_pagamento: string | null
          status: 'pendente' | 'confirmado' | 'cancelado'
          notas: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tipo: 'receita' | 'despesa'
          descricao: string
          valor: number
          data: string
          categoria_id?: string | null
          lead_id?: string | null
          appointment_id?: string | null
          forma_pagamento?: string | null
          status?: 'pendente' | 'confirmado' | 'cancelado'
          notas?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tipo?: 'receita' | 'despesa'
          descricao?: string
          valor?: number
          data?: string
          categoria_id?: string | null
          lead_id?: string | null
          appointment_id?: string | null
          forma_pagamento?: string | null
          status?: 'pendente' | 'confirmado' | 'cancelado'
          notas?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'financial_entries_categoria_id_fkey'
            columns: ['categoria_id']
            referencedRelation: 'financial_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_entries_lead_id_fkey'
            columns: ['lead_id']
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_entries_appointment_id_fkey'
            columns: ['appointment_id']
            referencedRelation: 'appointments'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      leads_por_dia: {
        Args: { dias: number }
        Returns: { data: string; total: number }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Lead = Database['public']['Tables']['leads']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type BeforeAfter = Database['public']['Tables']['before_after']['Row']
export type Testimonial = Database['public']['Tables']['testimonials']['Row']
export type ActivityLog = Database['public']['Tables']['activity_log']['Row']
export type SiteConfig = Database['public']['Tables']['site_config']['Row']
export type UserRole = Database['public']['Tables']['user_roles']['Row']
export type FinancialCategory = Database['public']['Tables']['financial_categories']['Row']
export type FinancialEntry = Database['public']['Tables']['financial_entries']['Row']

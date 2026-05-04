'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ESPECIALIDADES } from '@/lib/schemas'

const URGENCIAS = [
  { value: 'alta',  label: 'Alta — dor ou urgência', color: '#ef4444' },
  { value: 'media', label: 'Média — consulta planejada', color: '#f59e0b' },
  { value: 'baixa', label: 'Baixa — sem pressa', color: '#10b981' },
]

const STATUS_OPCOES = [
  { value: 'novo',       label: 'Primeiro contato' },
  { value: 'em_contato', label: 'Em contato' },
  { value: 'agendado',   label: 'Agendado' },
  { value: 'proposta',   label: 'Proposta enviada' },
  { value: 'fechado',    label: 'Paciente ativo' },
]

export default function NovoPacientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    nome: '',
    whatsapp: '',
    cpf: '',
    email: '',
    data_nascimento: '',
    especialidade: '',
    urgencia: 'media' as 'alta' | 'media' | 'baixa',
    status: 'novo',
    ticket_estimado: '',
    convenio: '',
    indicado_por: '',
    observacoes: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim() || !form.whatsapp.trim()) {
      toast.error('Nome e WhatsApp são obrigatórios.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ticket_estimado: form.ticket_estimado ? Number(form.ticket_estimado) : undefined,
          cpf: form.cpf || undefined,
          email: form.email || undefined,
          data_nascimento: form.data_nascimento || undefined,
          especialidade: form.especialidade || undefined,
          convenio: form.convenio || undefined,
          indicado_por: form.indicado_por || undefined,
          observacoes: form.observacoes || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Erro ao criar paciente.')
        return
      }
      toast.success(`Paciente "${form.nome}" criado com sucesso.`)
      router.push(`/admin/leads/${json.data?.id ?? json.id}`)
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', maxWidth: '760px' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1.5rem' }}>
        <Link href="/admin/leads" style={{ fontSize: '.78rem', color: '#7a7570', textDecoration: 'none' }}>
          Pacientes
        </Link>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4 2l4 4-4 4" stroke="#b8b4af" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: '.78rem', color: '#0f0e0c' }}>Novo paciente</span>
      </div>

      <h1 style={{ fontSize: '1.45rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '.3rem' }}>Novo paciente</h1>
      <p style={{ fontSize: '.82rem', color: '#7a7570', marginBottom: '2rem' }}>
        Cadastre um novo paciente diretamente no painel.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Dados principais */}
        <Section title="Dados principais">
          <div style={grid2}>
            <Field label="Nome completo *">
              <input required value={form.nome} onChange={(e) => set('nome', e.target.value)}
                placeholder="Ex: Maria Silva" style={inputStyle} />
            </Field>
            <Field label="WhatsApp *">
              <input required value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)}
                placeholder="11 99999-9999" style={inputStyle} />
            </Field>
          </div>
          <div style={grid2}>
            <Field label="CPF">
              <input value={form.cpf} onChange={(e) => set('cpf', e.target.value)}
                placeholder="000.000.000-00" style={inputStyle} />
            </Field>
            <Field label="E-mail">
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                placeholder="paciente@email.com" style={inputStyle} />
            </Field>
          </div>
          <div style={grid2}>
            <Field label="Data de nascimento">
              <input type="date" value={form.data_nascimento} onChange={(e) => set('data_nascimento', e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Convênio">
              <input value={form.convenio} onChange={(e) => set('convenio', e.target.value)}
                placeholder="Ex: Amil, Unimed..." style={inputStyle} />
            </Field>
          </div>
          <Field label="Indicado por">
            <input value={form.indicado_por} onChange={(e) => set('indicado_por', e.target.value)}
              placeholder="Ex: Dr. João, paciente Maria..." style={inputStyle} />
          </Field>
        </Section>

        {/* Tratamento */}
        <Section title="Tratamento e pipeline">
          <Field label="Especialidade de interesse">
            <select value={form.especialidade} onChange={(e) => set('especialidade', e.target.value)} style={inputStyle}>
              <option value="">— Não informado —</option>
              {ESPECIALIDADES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </Field>

          <Field label="Urgência">
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              {URGENCIAS.map((u) => (
                <button
                  key={u.value} type="button"
                  onClick={() => set('urgencia', u.value)}
                  style={{
                    flex: 1, minWidth: '140px', padding: '.55rem .75rem',
                    border: `1px solid ${form.urgencia === u.value ? `${u.color}50` : '#ebebea'}`,
                    borderRadius: '6px', cursor: 'pointer', fontSize: '.78rem',
                    background: form.urgencia === u.value ? `${u.color}0d` : '#fff',
                    color: form.urgencia === u.value ? u.color : '#7a7570',
                    fontWeight: form.urgencia === u.value ? 500 : 400,
                    textAlign: 'left', display: 'flex', alignItems: 'center', gap: '.5rem',
                  }}
                >
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: u.color, flexShrink: 0 }} />
                  {u.label}
                </button>
              ))}
            </div>
          </Field>

          <div style={grid2}>
            <Field label="Status no funil">
              <select value={form.status} onChange={(e) => set('status', e.target.value)} style={inputStyle}>
                {STATUS_OPCOES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Ticket estimado (R$)">
              <input type="number" min="0" step="100" value={form.ticket_estimado}
                onChange={(e) => set('ticket_estimado', e.target.value)}
                placeholder="Ex: 3500" style={inputStyle} />
            </Field>
          </div>
        </Section>

        {/* Observações */}
        <Section title="Observações">
          <textarea
            value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)}
            rows={4} placeholder="Anotações sobre o caso, histórico, preferências do paciente..."
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'DM Sans, sans-serif' }}
          />
        </Section>

        {/* Ações */}
        <div style={{ display: 'flex', gap: '.75rem', paddingTop: '.5rem' }}>
          <Link href="/admin/leads" style={{
            padding: '.65rem 1.25rem', border: '1px solid #ebebea', borderRadius: '6px',
            background: '#fff', color: '#7a7570', fontSize: '.82rem', textDecoration: 'none',
            display: 'flex', alignItems: 'center',
          }}>
            Cancelar
          </Link>
          <button
            type="submit" disabled={loading}
            style={{
              padding: '.65rem 1.5rem', background: loading ? '#6b6960' : '#0f0e0c',
              color: '#f5f0e8', border: 'none', borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '.82rem', fontWeight: 500,
            }}
          >
            {loading ? 'Criando paciente...' : 'Criar paciente'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #ebebea', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ fontSize: '.68rem', fontWeight: 600, color: '#b8b4af', textTransform: 'uppercase', letterSpacing: '.08em' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
      <label style={{ fontSize: '.72rem', color: '#4a4a48', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #e5e5e3', borderRadius: '6px',
  padding: '.6rem .9rem', fontSize: '.85rem', outline: 'none',
  background: '#fff', color: '#0f0e0c', boxSizing: 'border-box',
  fontFamily: 'DM Sans, sans-serif',
}

const grid2: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
}

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface Props {
  config: Record<string, string>
}

const SECTIONS = [
  {
    title: 'Dados do consultório',
    fields: [
      { key: 'consultorio_nome', label: 'Nome do consultório' },
      { key: 'consultorio_endereco', label: 'Endereço' },
      { key: 'consultorio_telefone', label: 'Telefone' },
      { key: 'consultorio_whatsapp', label: 'WhatsApp (apenas números, com DDI: 5561999999999)' },
      { key: 'cro_numero', label: 'Número CRO' },
    ],
  },
  {
    title: 'Horário de funcionamento',
    fields: [
      { key: 'horario_abertura', label: 'Abertura (HH:MM)', type: 'time' },
      { key: 'horario_fechamento', label: 'Fechamento (HH:MM)', type: 'time' },
    ],
  },
  {
    title: 'Textos do site',
    fields: [
      { key: 'hero_headline', label: 'Headline principal (Hero)' },
      { key: 'hero_subtitulo', label: 'Subtítulo (Hero)', type: 'textarea' },
      { key: 'sobre_texto', label: 'Texto sobre a Dra. Cynthia', type: 'textarea' },
      { key: 'cal_link', label: 'Link do Cal.com / Calendly' },
    ],
  },
  {
    title: 'Mensagens automáticas WhatsApp',
    fields: [
      { key: 'msg_boasvindas', label: 'Mensagem de boas-vindas (deixe vazio para usar o padrão)', type: 'textarea' },
      { key: 'msg_ausencia', label: 'Mensagem fora do horário (deixe vazio para usar o padrão)', type: 'textarea' },
    ],
  },
]

export function ConfigForm({ config: initialConfig }: Props) {
  const [config, setConfig] = useState(initialConfig)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    const supabase = createClient()

    const updates = Object.entries(config).map(([key, value]) =>
      supabase.from('site_config').upsert({ key, value, updated_at: new Date().toISOString() })
    )

    try {
      await Promise.all(updates)
      toast.success('Configurações salvas com sucesso!')
    } catch {
      toast.error('Erro ao salvar configurações.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {SECTIONS.map((section) => (
        <div key={section.title} style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '.82rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#7a7570', marginBottom: '1rem', paddingBottom: '.5rem', borderBottom: '1px solid #e5e5e3' }}>
            {section.title}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {section.fields.map((field) => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: '.75rem', letterSpacing: '.08em', color: '#7a7570', marginBottom: '.4rem' }}>
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={config[field.key] ?? ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    rows={3}
                    style={inputStyle}
                  />
                ) : (
                  <input
                    type={field.type ?? 'text'}
                    value={config[field.key] ?? ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    style={inputStyle}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e5e5e3' }}>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            background: loading ? '#7a7570' : '#b8965a',
            color: '#0f0e0c',
            border: 'none',
            padding: '.8rem 2rem',
            borderRadius: '2px',
            fontSize: '.78rem',
            fontWeight: 500,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background .2s',
          }}
        >
          {loading ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #e5e5e3',
  borderRadius: '2px',
  padding: '.65rem .9rem',
  fontSize: '.85rem',
  outline: 'none',
  fontFamily: 'DM Sans, sans-serif',
  resize: 'vertical',
}

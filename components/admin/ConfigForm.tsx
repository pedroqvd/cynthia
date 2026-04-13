'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ImageCropper } from './ImageCropper'

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
  {
    title: 'Imagens Principais do Site',
    fields: [
      { key: 'img_hero', label: 'Foto Principal (Início do site) - 3:4', type: 'image', aspect: 3/4 },
      { key: 'img_sobre', label: 'Foto Seção Sobre - 3:4', type: 'image', aspect: 3/4 },
      { key: 'img_cta', label: 'Foto Agendamento (CTA) - 4:5', type: 'image', aspect: 4/5 },
    ],
  },
]

export function ConfigForm({ config: initialConfig }: Props) {
  const [config, setConfig] = useState(initialConfig)
  const [loading, setLoading] = useState(false)
  const [cropTarget, setCropTarget] = useState<{ file?: File, imageUrl?: string, key: string, aspect: number } | null>(null)

  const fallbacks: Record<string, string> = {
    img_hero: '/images/cynthia-hero.jpg',
    img_sobre: '/images/cynthia-sobre.jpg',
    img_cta: '/images/cynthia-cta.jpg',
  }

  function handleFileSelectConfig(e: React.ChangeEvent<HTMLInputElement>, key: string, aspect: number) {
    const file = e.target.files?.[0]
    if (file) {
      setCropTarget({ file, key, aspect })
    }
    e.target.value = ''
  }

  async function handleCropConfirm(croppedFile: File) {
    if (!cropTarget) return
    const { key } = cropTarget
    setCropTarget(null)
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', croppedFile)
      formData.append('bucket', 'site')

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const { data } = await res.json()

      if (!res.ok) throw new Error(data?.error)

      setConfig((prev) => ({ ...prev, [key]: data.url }))
      toast.success('Imagem pronta! Salve as configurações.')
    } catch (err) {
      toast.error('Erro ao enviar imagem.')
    } finally {
      setLoading(false)
    }
  }

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
    <>
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
                  {field.type === 'image' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '.5rem' }}>
                      <div style={{ width: '140px', aspectRatio: field.aspect as number, borderRadius: '4px', overflow: 'hidden', border: '1px solid #e5e5e3' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={config[field.key] || fallbacks[field.key]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => setCropTarget({ imageUrl: config[field.key] || fallbacks[field.key], key: field.key, aspect: field.aspect as number })} disabled={loading} style={{ padding: '.5rem .8rem', background: '#f5f5f5', border: '1px solid #e5e5e3', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '.75rem', color: '#0f0e0c', fontWeight: 500 }}>
                          Ajustar Imagem Atual
                        </button>
                        <label style={{ display: 'inline-block', padding: '.5rem .8rem', background: '#f5f5f5', border: '1px solid #e5e5e3', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '.75rem', width: 'max-content', color: '#0f0e0c', fontWeight: 500 }}>
                          {loading ? 'Processando...' : 'Novo Upload'}
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileSelectConfig(e, field.key, field.aspect as number)} disabled={loading} />
                        </label>
                      </div>
                    </div>
                  ) : field.type === 'textarea' ? (
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

      <ImageCropper
        imageFile={cropTarget?.file || null}
        imageUrl={cropTarget?.imageUrl || null}
        aspectRatio={cropTarget?.aspect || 1}
        onCancel={() => setCropTarget(null)}
        onConfirm={handleCropConfirm}
      />
    </>
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

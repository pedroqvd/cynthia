'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { BeforeAfter, Testimonial } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  beforeAfter: BeforeAfter[]
  testimonials: Testimonial[]
}

export function ConteudoManager({ beforeAfter: initBA, testimonials: initTD }: Props) {
  const [tab, setTab] = useState<'before_after' | 'testimonials'>('before_after')
  const [beforeAfter, setBeforeAfter] = useState(initBA)
  const [testimonials, setTestimonials] = useState(initTD)
  const [uploading, setUploading] = useState(false)

  async function handleUploadBA(e: React.ChangeEvent<HTMLInputElement>, field: 'antes' | 'depois', id?: string) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'before_after')

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const { data } = await res.json()

      if (!res.ok) throw new Error(data?.error)

      toast.success('Imagem enviada!')
      if (data?.url) {
        toast.info(`URL: ${data.url}`, { duration: 8000 })
      }
    } catch (err) {
      toast.error('Erro ao enviar imagem.')
    } finally {
      setUploading(false)
    }
  }

  async function toggleBA(id: string, ativo: boolean) {
    const supabase = createClient()
    await supabase.from('before_after').update({ ativo }).eq('id', id)
    setBeforeAfter((prev) => prev.map((b) => b.id === id ? { ...b, ativo } : b))
    toast.success(ativo ? 'Caso ativado' : 'Caso desativado')
  }

  async function toggleTestimonial(id: string, ativo: boolean) {
    const supabase = createClient()
    await supabase.from('testimonials').update({ ativo }).eq('id', id)
    setTestimonials((prev) => prev.map((t) => t.id === id ? { ...t, ativo } : t))
    toast.success(ativo ? 'Depoimento ativado' : 'Depoimento desativado')
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '2rem', borderBottom: '1px solid #e5e5e3' }}>
        {[
          { id: 'before_after', label: 'Antes/Depois' },
          { id: 'testimonials', label: 'Depoimentos' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            style={{
              padding: '.75rem 1.5rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '.85rem',
              color: tab === t.id ? '#b8965a' : '#7a7570',
              borderBottom: tab === t.id ? '2px solid #b8965a' : '2px solid transparent',
              marginBottom: '-1px',
              fontWeight: tab === t.id ? 500 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'before_after' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '.85rem', color: '#7a7570' }}>
              Gerencie os casos de antes/depois exibidos no site.
            </p>
            <label
              style={{
                fontSize: '.75rem',
                padding: '.5rem 1rem',
                background: '#b8965a',
                color: '#0f0e0c',
                borderRadius: '2px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? .7 : 1,
              }}
            >
              {uploading ? 'Enviando...' : '+ Upload de imagem'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUploadBA(e, 'antes')} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {beforeAfter.map((ba) => (
              <div key={ba.id} style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '160px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ba.foto_antes_url} alt="Antes" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ba.foto_depois_url} alt="Depois" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '1rem' }}>
                  <p style={{ fontSize: '.82rem', fontWeight: 500, color: '#0f0e0c' }}>{ba.procedimento}</p>
                  <p style={{ fontSize: '.75rem', color: '#7a7570', marginTop: '.25rem' }}>{ba.descricao}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginTop: '.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.75rem', color: '#7a7570', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={ba.ativo}
                        onChange={(e) => toggleBA(ba.id, e.target.checked)}
                        style={{ accentColor: '#b8965a' }}
                      />
                      Ativo no site
                    </label>
                  </div>
                </div>
              </div>
            ))}

            {beforeAfter.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: '#7a7570', fontSize: '.9rem' }}>
                Nenhum caso cadastrado ainda. Faça upload das fotos para começar.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'testimonials' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {testimonials.map((t) => (
              <div
                key={t.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e5e5e3',
                  borderRadius: '4px',
                  padding: '1.25rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  opacity: t.ativo ? 1 : .5,
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#b8965a22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b8965a', fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.1rem', flexShrink: 0 }}>
                  {t.nome.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.9rem', fontWeight: 500, color: '#0f0e0c' }}>{t.nome}</div>
                  <div style={{ fontSize: '.75rem', color: '#7a7570' }}>{t.cargo}</div>
                  <p style={{ fontSize: '.82rem', color: '#7a7570', marginTop: '.5rem', fontStyle: 'italic' }}>"{t.texto}"</p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.75rem', color: '#7a7570', cursor: 'pointer', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={t.ativo}
                    onChange={(e) => toggleTestimonial(t.id, e.target.checked)}
                    style={{ accentColor: '#b8965a' }}
                  />
                  Ativo
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

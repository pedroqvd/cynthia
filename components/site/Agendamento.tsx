'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { agendamentoSchema, type AgendamentoInput } from '@/lib/schemas'

export function Agendamento() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AgendamentoInput>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: { urgencia: 'media' },
  })

  async function onSubmit(data: AgendamentoInput) {
    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, origem: 'site' }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao enviar')
      }

      setSuccess(true)
      reset()
      toast.success('Recebemos seu contato! Entraremos em breve pelo WhatsApp.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar. Tente pelo WhatsApp.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      id="cta"
      style={{
        background: '#163D32',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        minHeight: '700px',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="max-md:!grid-cols-1"
    >
      {/* ── Lado esquerdo: foto ── */}
      <div
        style={{ position: 'relative', minHeight: '500px' }}
        className="max-md:hidden"
      >
        {/* Foto da Dra. Cynthia — blusa tiffany, fundo preto */}
        <Image
          src="/images/cynthia-cta.jpg"
          alt="Dra. Cynthia Quevedo"
          fill
          sizes="50vw"
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
        />
        {/* Gradiente lateral */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, transparent 60%, #163D32 100%)',
          }}
        />
        {/* Monograma flutuante */}
        <div
          style={{
            position: 'absolute',
            bottom: '3rem',
            left: '3rem',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '4rem',
            fontWeight: 300,
            color: 'rgba(201,169,110,0.25)',
            lineHeight: 1,
            letterSpacing: '-.02em',
          }}
        >
          CQ
        </div>
      </div>

      {/* ── Lado direito: formulário ── */}
      <div
        style={{ padding: '6rem 5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        className="max-md:!px-6 max-md:!py-16"
      >
        <div
          className="section-eyebrow"
          style={{ color: '#C9A96E' }}
        >
          Agende sua avaliação
        </div>
        <h2
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(2.2rem, 4vw, 3.5rem)',
            fontWeight: 400,
            lineHeight: 1.1,
            color: '#F5F0E6',
            marginBottom: '1rem',
          }}
        >
          Seu próximo passo<br />
          começa com uma{' '}
          <em style={{ fontStyle: 'italic', color: '#C9A96E' }}>conversa</em>.
        </h2>
        <p style={{ fontSize: '.88rem', color: 'rgba(245,240,230,0.65)', maxWidth: '420px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
          A consulta de avaliação é o momento em que a Dra. Cynthia entende seu caso e define com
          você o caminho ideal. Sem compromisso.
        </p>

        {success ? (
          <div style={{ border: '1px solid rgba(201,169,110,0.4)', padding: '2rem', background: 'rgba(201,169,110,.08)', borderRadius: '4px' }}>
            <p style={{ fontSize: '1.1rem', color: '#C9A96E', fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic' }}>
              Mensagem recebida com sucesso!
            </p>
            <p style={{ fontSize: '.85rem', color: 'rgba(245,240,230,0.65)', marginTop: '.75rem' }}>
              Entraremos em contato em breve pelo WhatsApp informado.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }} className="max-md:!grid-cols-1">
              <FormField label="Nome completo" error={errors.nome?.message}>
                <input {...register('nome')} placeholder="Seu nome" style={inputStyle} />
              </FormField>
              <FormField label="WhatsApp" error={errors.whatsapp?.message}>
                <input {...register('whatsapp')} placeholder="+55 61 9 9999-9999" style={inputStyle} />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }} className="max-md:!grid-cols-1">
              <FormField label="E-mail (opcional)" error={errors.email?.message}>
                <input {...register('email')} type="email" placeholder="seu@email.com" style={inputStyle} />
              </FormField>
              <FormField label="Especialidade de interesse" error={errors.especialidade?.message}>
                <select {...register('especialidade')} style={inputStyle}>
                  <option value="">Selecione...</option>
                  <option value="estetica">Estética & Design do Sorriso</option>
                  <option value="cirurgia">Cirurgia & Implantes</option>
                  <option value="protese">Prótese, DTM & Reabilitação</option>
                  <option value="outro">Outro / Não sei</option>
                </select>
              </FormField>
            </div>

            <FormField label="Mensagem (opcional)" error={errors.mensagem?.message}>
              <textarea
                {...register('mensagem')}
                rows={3}
                placeholder="Conte brevemente o que você precisa..."
                style={{ ...inputStyle, resize: 'none' }}
              />
            </FormField>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                {...register('lgpd')}
                style={{ marginTop: '3px', accentColor: '#C9A96E', width: '14px', height: '14px', flexShrink: 0 }}
              />
              <span style={{ fontSize: '.78rem', color: 'rgba(245,240,230,0.55)', lineHeight: 1.6 }}>
                Concordo com a{' '}
                <a href="/privacidade" style={{ color: '#C9A96E', textDecoration: 'none' }}>
                  política de privacidade
                </a>{' '}
                e autorizo o contato por WhatsApp para fins de agendamento.
              </span>
            </label>
            {errors.lgpd && (
              <span style={{ fontSize: '.72rem', color: '#ef4444' }}>{errors.lgpd.message}</span>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '.25rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '.75rem',
                  fontSize: '.78rem',
                  fontWeight: 500,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  background: loading ? '#2A5444' : '#C9A96E',
                  color: '#163D32',
                  padding: '1rem 2rem',
                  borderRadius: '3px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background .2s',
                  fontFamily: 'Jost, sans-serif',
                }}
              >
                {loading ? 'Enviando...' : 'Agendar avaliação'}
              </button>

              <a
                href={`https://wa.me/5561999999999?text=${encodeURIComponent('Olá! Gostaria de agendar uma avaliação com a Dra. Cynthia Quevedo.')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '.6rem',
                  fontSize: '.78rem',
                  fontWeight: 400,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(245,240,230,0.75)',
                  padding: '1rem 1.5rem',
                  border: '1px solid rgba(201,169,110,0.3)',
                  borderRadius: '3px',
                  textDecoration: 'none',
                  transition: 'border-color .2s, color .2s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: .7 }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M11.5 2C6.262 2 2 6.262 2 11.5c0 1.986.569 3.84 1.551 5.4L2 22l5.269-1.525A9.449 9.449 0 0011.5 21c5.238 0 9.5-4.262 9.5-9.5S16.738 2 11.5 2z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </form>
        )}

        <p style={{ marginTop: '1.75rem', fontSize: '.7rem', color: 'rgba(245,240,230,0.4)', letterSpacing: '.08em' }}>
          Brasília — DF · Atendimento particular · Sem convênio
        </p>
      </div>
    </section>
  )
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
      <label style={{ fontSize: '.68rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,230,0.55)' }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: '.7rem', color: '#ef4444' }}>{error}</span>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(245,240,230,0.07)',
  border: '1px solid rgba(201,169,110,0.25)',
  borderRadius: '3px',
  padding: '.75rem 1rem',
  color: '#F5F0E6',
  fontSize: '.85rem',
  fontFamily: 'Jost, sans-serif',
  outline: 'none',
  transition: 'border-color .2s',
}

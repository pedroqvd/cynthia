'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { agendamentoSchema, ESPECIALIDADES, type AgendamentoInput } from '@/lib/schemas'

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10)
}

function minDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return toYMD(d)
}

function maxDate() {
  const d = new Date()
  d.setDate(d.getDate() + 60)
  return toYMD(d)
}

export function Agendamento({ imgUrl }: { imgUrl?: string }) {
  const src = imgUrl || '/images/cynthia-cta.jpg'
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AgendamentoInput>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: { urgencia: 'media' },
  })

  // Busca horários disponíveis quando o usuário escolhe uma data
  useEffect(() => {
    if (!selectedDate) { setSlots([]); return }
    setLoadingSlots(true)
    setSelectedSlot('')
    fetch(`/api/calendar/availability?date=${selectedDate}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((json: { data?: string[] }) => setSlots(json.data ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [selectedDate])

  async function onSubmit(data: AgendamentoInput) {
    setLoading(true)
    try {
      // Se selecionou horário → cria lead + agendamento no calendar
      const endpoint = selectedSlot ? '/api/booking' : '/api/leads'
      const payload = selectedSlot
        ? { ...data, origem: 'site', data_hora: selectedSlot }
        : { ...data, origem: 'site' }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao enviar')
      }

      setSuccess(true)
      reset()
      toast.success(
        selectedSlot
          ? 'Consulta agendada! Você receberá confirmação pelo WhatsApp.'
          : 'Recebemos seu contato! Entraremos em breve pelo WhatsApp.'
      )
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
      {/* ── Lado esquerdo: foto flutuante ── */}
      <div
        style={{ 
          position: 'relative', 
          minHeight: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6rem 4rem'
        }}
        className="max-md:hidden"
      >
        {/* Moldura offset deslocada levemente para diagonal invertida (esquerda-baixo) */}
        <div
          style={{
            position: 'absolute',
            inset: '6rem 4rem',
            border: '1px solid rgba(201,169,110,0.35)',
            transform: 'translate(-1.5rem, 1.5rem)',
            borderRadius: '12px',
            zIndex: 1,
          }}
        />

        {/* Wrapper dinâmico da imagem */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '12px',
            overflow: 'hidden',
            zIndex: 2,
            boxShadow: '0 30px 60px -15px rgba(0,0,0, 0.45)',
          }}
        >
          {/* Foto da Dra. Cynthia — blusa tiffany, fundo preto */}
          <Image
            src={src}
            alt="Dra. Cynthia Quevedo"
            fill
            sizes="50vw"
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
          />
        </div>

        {/* Monograma flutuante (fora da foto sobrepondo tudo como uma marca d'água) */}
        <div
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '2.5rem',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '4.5rem',
            fontWeight: 300,
            color: 'rgba(201,169,110,0.3)',
            lineHeight: 1,
            letterSpacing: '-.02em',
            zIndex: 3,
            pointerEvents: 'none'
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
              <FormField label="Nome completo *" error={errors.nome?.message}>
                <input {...register('nome')} placeholder="Nome completo" style={inputStyle} />
              </FormField>
              <FormField label="CPF *" error={errors.cpf?.message}>
                <input {...register('cpf')} placeholder="000.000.000-00" style={inputStyle} />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }} className="max-md:!grid-cols-1">
              <FormField label="WhatsApp *" error={errors.whatsapp?.message}>
                <input {...register('whatsapp')} placeholder="+55 61 9 9999-9999" style={inputStyle} />
              </FormField>
              <FormField label="E-mail *" error={errors.email?.message}>
                <input {...register('email')} type="email" placeholder="seu@email.com" style={inputStyle} />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }} className="max-md:!grid-cols-1">
              <FormField label="Especialidade de interesse *" error={errors.especialidade?.message}>
                <select {...register('especialidade')} style={selectStyle}>
                  <option value="" style={optionStyle}>Selecione...</option>
                  {ESPECIALIDADES.map((e) => (
                    <option key={e.value} value={e.value} style={optionStyle}>{e.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Convênio (opcional)" error={errors.convenio?.message}>
                <input {...register('convenio')} placeholder="Nome do convênio, se houver" style={inputStyle} />
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

            {/* Seletor de horário (opcional) */}
            <div style={{ borderTop: '1px solid rgba(201,169,110,0.2)', paddingTop: '1.25rem', marginTop: '.25rem' }}>
              <p style={{ fontSize: '.75rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(245,240,230,0.45)', marginBottom: '.9rem' }}>
                Horário preferido <span style={{ opacity: .6 }}>(opcional)</span>
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }} className="max-md:!grid-cols-1">
                <FormField label="Data">
                  <input
                    type="date"
                    value={selectedDate}
                    min={minDate()}
                    max={maxDate()}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </FormField>
                <FormField label="Horário disponível">
                  {loadingSlots ? (
                    <div style={{ ...inputStyle, color: 'rgba(245,240,230,0.4)', display: 'flex', alignItems: 'center' }}>
                      Carregando horários...
                    </div>
                  ) : !selectedDate ? (
                    <div style={{ ...inputStyle, color: 'rgba(245,240,230,0.3)', display: 'flex', alignItems: 'center' }}>
                      Selecione uma data
                    </div>
                  ) : slots.length === 0 ? (
                    <div style={{ ...inputStyle, color: 'rgba(245,240,230,0.4)', display: 'flex', alignItems: 'center' }}>
                      Sem horários disponíveis
                    </div>
                  ) : (
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="" style={optionStyle}>Escolha um horário...</option>
                      {slots.map((slot) => (
                        <option key={slot} value={slot} style={optionStyle}>
                          {new Date(slot).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                        </option>
                      ))}
                    </select>
                  )}
                </FormField>
              </div>
              {selectedSlot && (
                <p style={{ fontSize: '.75rem', color: '#10b981', marginTop: '.5rem' }}>
                  Horário selecionado:{' '}
                  {new Date(selectedSlot).toLocaleString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                </p>
              )}
            </div>

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
                  background: loading ? '#2A5444' : '#1B6B5A',
                  color: '#FFFFFF',
                  padding: '14px 28px',
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
                {/* Logo oficial WhatsApp */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.975-1.412A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="#25D366"/>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="white"/>
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

// Select usa fundo sólido para garantir legibilidade das options no popup nativo do browser
const selectStyle: React.CSSProperties = {
  ...inputStyle,
  background: '#1a3a2a',
  color: '#F5F0E6',
  cursor: 'pointer',
}

const optionStyle: React.CSSProperties = {
  background: '#1a3a2a',
  color: '#F5F0E6',
}

'use client'

import { useReveal } from '@/hooks/useReveal'

const CREDENTIALS = [
  'Especialização em Estética Dental',
  'Especialização em Cirurgia Bucomaxilofacial',
  'Especialização em Prótese Dentária',
  'Membro da Sociedade Brasileira de Cirurgia Bucomaxilofacial',
]

export function Sobre() {
  const { ref: refVisual } = useReveal()
  const { ref: refContent } = useReveal()

  return (
    <section
      id="sobre"
      style={{
        padding: '8rem 4rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8rem',
        alignItems: 'center',
      }}
      className="max-md:!grid-cols-1 max-md:!px-8 max-md:!py-20 max-md:!gap-12"
    >
      {/* ── Coluna visual ── */}
      <div ref={refVisual} className="reveal" style={{ position: 'relative' }}>
        {/* Canto decorativo */}
        <div
          style={{
            position: 'absolute',
            top: '-2rem',
            right: '-2rem',
            width: '180px',
            height: '180px',
            border: '1px solid rgba(184,150,90,0.25)',
          }}
          className="max-md:hidden"
        />

        {/* Frame da foto */}
        <div
          style={{
            width: '100%',
            aspectRatio: '3/4',
            background: '#1a1916',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'radial-gradient(ellipse 70% 60% at 40% 35%, #26221d 0%, #0f0e0c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: .35 }}>
              <circle cx="24" cy="18" r="8" stroke="#b8965a" strokeWidth="1"/>
              <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#b8965a" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            <span
              style={{
                fontSize: '.65rem',
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: '#7a7570',
                opacity: .6,
              }}
            >
              Foto profissional
            </span>
          </div>
        </div>

        {/* Badge anos */}
        <div
          style={{
            position: 'absolute',
            bottom: '-2rem',
            left: '-2rem',
            background: '#b8965a',
            color: '#0f0e0c',
            padding: '1.5rem',
            textAlign: 'center',
          }}
          className="max-md:relative max-md:bottom-auto max-md:left-auto max-md:mt-4 max-md:inline-block"
        >
          <div
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '2.2rem',
              fontWeight: 400,
              lineHeight: 1,
            }}
          >
            +12
          </div>
          <div
            style={{
              fontSize: '.65rem',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              marginTop: '.3rem',
              fontWeight: 500,
            }}
          >
            Anos de especialização
          </div>
        </div>
      </div>

      {/* ── Coluna de conteúdo ── */}
      <div ref={refContent} className="reveal" style={{ paddingTop: '2rem' }}>
        <div className="section-eyebrow">Sobre a Dra. Cynthia</div>
        <h2
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            fontWeight: 300,
            lineHeight: 1.15,
            color: '#f5f0e8',
            marginBottom: '2rem',
          }}
        >
          Formação excepcional.<br />
          Resultados que <em style={{ fontStyle: 'italic', color: '#b8965a' }}>falam</em>.
        </h2>

        <p style={{ fontSize: '.9rem', color: '#7a7570', lineHeight: 1.9 }}>
          Em um mercado onde cada especialidade dental é tratada isoladamente, a Dra. Cynthia
          construiu uma trajetória rara: domínio profundo em estética dental, cirurgia
          bucomaxilofacial e reabilitação protética. O resultado é uma profissional capaz de
          conduzir casos complexos com uma visão que nenhum especialista isolado consegue oferecer.
        </p>
        <p style={{ fontSize: '.9rem', color: '#7a7570', lineHeight: 1.9, marginTop: '1rem' }}>
          Atende em Brasília pacientes que buscam mais do que um tratamento — buscam uma
          transformação definitiva, planejada com rigor e executada com refinamento.
        </p>

        <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {CREDENTIALS.map((c) => (
            <div
              key={c}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', fontSize: '.82rem', color: '#7a7570' }}
            >
              <div
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#b8965a',
                  marginTop: '.55rem',
                  flexShrink: 0,
                }}
              />
              {c}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

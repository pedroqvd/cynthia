'use client'

import Image from 'next/image'
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
        padding: '8rem 5rem',
        background: '#F5F0E6',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '7rem',
        alignItems: 'center',
      }}
      className="max-md:!grid-cols-1 max-md:!px-6 max-md:!py-20 max-md:!gap-12"
    >
      {/* ── Coluna visual ── */}
      <div ref={refVisual} className="reveal" style={{ position: 'relative' }}>
        {/* Canto decorativo */}
        <div
          style={{
            position: 'absolute',
            top: '-2rem',
            left: '-2rem',
            width: '120px',
            height: '120px',
            border: '1px solid rgba(201,169,110,0.4)',
          }}
          className="max-md:hidden"
        />

        {/* Frame da foto */}
        <div
          style={{
            width: '100%',
            aspectRatio: '3/4',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '4px',
          }}
        >
          {/* Foto da Dra. Cynthia — sentada, blusa azul */}
          <Image
            src="/images/cynthia-sobre.jpg"
            alt="Dra. Cynthia Quevedo — Cirurgiã-Dentista em Brasília"
            fill
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
          />
        </div>

        {/* Badge anos */}
        <div
          style={{
            position: 'absolute',
            bottom: '-2rem',
            right: '-2rem',
            background: '#1B6B5A',
            color: '#F5F0E6',
            padding: '1.5rem',
            textAlign: 'center',
            borderRadius: '3px',
          }}
          className="max-md:hidden"
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
              fontSize: '.62rem',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              marginTop: '.3rem',
              fontWeight: 500,
              opacity: .85,
            }}
          >
            Anos de especialização
          </div>
        </div>
      </div>

      {/* ── Coluna de conteúdo ── */}
      <div ref={refContent} className="reveal" style={{ paddingTop: '1rem' }}>
        <div className="section-eyebrow">Sobre a Dra. Cynthia Quevedo</div>
        <h2
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            fontWeight: 400,
            lineHeight: 1.15,
            color: '#1C1C1C',
            marginBottom: '2rem',
          }}
        >
          Formação excepcional.<br />
          Resultados que <em style={{ fontStyle: 'italic', color: '#1B6B5A' }}>falam</em>.
        </h2>

        <p style={{ fontSize: '.9rem', color: '#6B6B6B', lineHeight: 1.9 }}>
          Em um mercado onde cada especialidade dental é tratada isoladamente, a Dra. Cynthia
          Quevedo construiu uma trajetória rara: domínio profundo em estética dental, cirurgia
          bucomaxilofacial e reabilitação protética. O resultado é uma profissional capaz de
          conduzir casos complexos com uma visão que nenhum especialista isolado consegue oferecer.
        </p>
        <p style={{ fontSize: '.9rem', color: '#6B6B6B', lineHeight: 1.9, marginTop: '1rem' }}>
          Atende em Brasília pacientes que buscam mais do que um tratamento — buscam uma
          transformação definitiva, planejada com rigor e executada com refinamento.
        </p>

        {/* Separador dourado */}
        <div style={{ width: '48px', height: '1px', background: '#C9A96E', margin: '2rem 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
          {CREDENTIALS.map((c) => (
            <div
              key={c}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', fontSize: '.83rem', color: '#1C1C1C' }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#1B6B5A',
                  marginTop: '.5rem',
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

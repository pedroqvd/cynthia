'use client'

import { useState, useRef, useCallback } from 'react'
import { useStaggerReveal } from '@/hooks/useReveal'

interface BeforeAfterItem {
  procedimento: string
  descricao: string
  foto_antes_url?: string
  foto_depois_url?: string
}

// Dados padrão enquanto não há fotos cadastradas no painel
const DEFAULT_ITEMS: BeforeAfterItem[] = [
  {
    procedimento: 'Facetas de porcelana · 10 unidades',
    descricao: 'Transformação completa do sorriso com harmonização de cor e formato',
  },
  {
    procedimento: 'Reabilitação oral total · All-on-4',
    descricao: 'Da cirurgia à prótese final em uma única equipe especializada',
  },
  {
    procedimento: 'Tratamento DTM + Botox terapêutico',
    descricao: 'Resolução de dor crônica orofacial com abordagem integrada',
  },
]

export function Resultados({ items = DEFAULT_ITEMS }: { items?: BeforeAfterItem[] }) {
  const { ref } = useStaggerReveal()

  return (
    <section
      id="resultados"
      style={{ padding: '8rem 4rem' }}
      className="max-md:!px-8 max-md:!py-20"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'end',
          marginBottom: '4rem',
        }}
        className="max-md:!grid-cols-1 max-md:!gap-4"
      >
        <div>
          <div className="section-eyebrow">Casos tratados</div>
          <h2
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(2rem, 3.5vw, 3rem)',
              fontWeight: 300,
              lineHeight: 1.15,
              color: '#f5f0e8',
            }}
          >
            Resultados <em style={{ fontStyle: 'italic', color: '#b8965a' }}>reais</em>
          </h2>
        </div>
        <p
          style={{
            fontSize: '.78rem',
            color: '#7a7570',
            textAlign: 'right',
            maxWidth: '260px',
            lineHeight: 1.6,
          }}
          className="max-md:!text-left max-md:!max-w-full"
        >
          Cada resultado é planejado individualmente. Fotos disponíveis mediante solicitação na
          consulta de avaliação.
        </p>
      </div>

      <div
        ref={ref}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem',
        }}
        className="max-md:!grid-cols-1"
      >
        {items.map((item, i) => (
          <ResultadoCard key={i} {...item} />
        ))}
      </div>

      <p
        style={{
          marginTop: '2rem',
          fontSize: '.72rem',
          color: '#7a7570',
          textAlign: 'center',
          letterSpacing: '.05em',
        }}
      >
        * Resultados individuais podem variar. Imagens meramente ilustrativas.
      </p>
    </section>
  )
}

function ResultadoCard({ procedimento, descricao, foto_antes_url, foto_depois_url }: BeforeAfterItem) {
  const [sliderPos, setSliderPos] = useState(50)
  const dragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.min(100, Math.max(0, (x / rect.width) * 100))
    setSliderPos(pct)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const pct = Math.min(100, Math.max(0, (x / rect.width) * 100))
    setSliderPos(pct)
  }, [])

  const hasPhotos = foto_antes_url && foto_depois_url

  return (
    <div
      style={{
        background: '#131210',
        border: '1px solid rgba(184,150,90,0.25)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Área de imagem */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          aspectRatio: '1',
          position: 'relative',
          overflow: 'hidden',
          cursor: hasPhotos ? 'ew-resize' : 'default',
        }}
        onMouseDown={() => { dragging.current = true }}
        onMouseUp={() => { dragging.current = false }}
        onMouseLeave={() => { dragging.current = false }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {hasPhotos ? (
          <>
            {/* Foto depois (base) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={foto_depois_url}
              alt="Depois"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Foto antes (cortada) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                width: `${sliderPos}%`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto_antes_url}
                alt="Antes"
                style={{ position: 'absolute', inset: 0, width: containerRef.current?.clientWidth ?? 300, height: '100%', objectFit: 'cover', maxWidth: 'none' }}
              />
            </div>
            {/* Handle */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${sliderPos}%`,
                width: '2px',
                background: '#b8965a',
                transform: 'translateX(-50%)',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#b8965a',
                  border: '2px solid #0f0e0c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4 2L1 6l3 4M8 2l3 4-3 4" stroke="#0f0e0c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            {/* Labels */}
            <span style={{ position: 'absolute', top: '1rem', left: '1rem', fontSize: '.6rem', letterSpacing: '.15em', textTransform: 'uppercase', color: '#7a7570', background: 'rgba(15,14,12,.7)', padding: '.2rem .5rem' }}>Antes</span>
            <span style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '.6rem', letterSpacing: '.15em', textTransform: 'uppercase', color: '#b8965a', background: 'rgba(15,14,12,.7)', padding: '.2rem .5rem' }}>Depois</span>
          </>
        ) : (
          /* Placeholder sem foto */
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
            }}
          >
            <div
              style={{
                background: '#161412',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '.5rem',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px solid #2a2520',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="8" r="4" stroke="#4a4540" strokeWidth="1"/>
                  <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#4a4540" strokeWidth="1"/>
                </svg>
              </div>
              <span style={{ fontSize: '.6rem', letterSpacing: '.2em', textTransform: 'uppercase', color: '#7a7570' }}>Antes</span>
            </div>
            <div
              style={{
                background: '#1c1814',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '.5rem',
                borderLeft: '1px solid #b8965a',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px solid rgba(184,150,90,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="8" r="4" stroke="#b8965a" strokeWidth="1"/>
                  <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#b8965a" strokeWidth="1"/>
                </svg>
              </div>
              <span style={{ fontSize: '.6rem', letterSpacing: '.2em', textTransform: 'uppercase', color: '#b8965a' }}>Depois</span>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ fontSize: '.7rem', letterSpacing: '.15em', textTransform: 'uppercase', color: '#b8965a', marginBottom: '.3rem' }}>
          {procedimento}
        </div>
        <p style={{ fontSize: '.82rem', color: '#7a7570' }}>{descricao}</p>
      </div>
    </div>
  )
}

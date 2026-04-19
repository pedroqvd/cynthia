'use client'

import { useState, useRef } from 'react'
import { useStaggerReveal } from '@/hooks/useReveal'

interface Testimonial {
  nome: string
  cargo: string | null
  texto: string
  nota: number
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    nome: 'Ana Clara M.',
    cargo: 'Executiva — Brasília',
    texto: 'Passei anos com vergonha do meu sorriso. Em um único lugar, fiz a cirurgia e as facetas. O resultado superou tudo que eu imaginava.',
    nota: 5,
  },
  {
    nome: 'Roberto S.',
    cargo: 'Empresário — Brasília',
    texto: 'Eu precisava de implantes e nunca encontrava alguém que entendesse tanto de cirurgia quanto de estética. A Dra. Cynthia é essa pessoa.',
    nota: 5,
  },
  {
    nome: 'Luciana F.',
    cargo: 'Médica — Brasília',
    texto: 'Sofria com dor na mandíbula há anos. Em três meses de tratamento com ela, resolvi algo que nenhum outro especialista tinha conseguido.',
    nota: 5,
  },
]

export function Depoimentos({ items = DEFAULT_TESTIMONIALS }: { items?: Testimonial[] }) {
  const { ref } = useStaggerReveal()
  const [activeIdx, setActiveIdx] = useState(0)
  const touchStartX = useRef(0)

  const prev = () => setActiveIdx((i) => Math.max(0, i - 1))
  const next = () => setActiveIdx((i) => Math.min(items.length - 1, i + 1))

  return (
    <section
      id="depoimentos"
      style={{ padding: '8rem 5rem', background: '#F5F0E6' }}
      className="max-md:!px-6 max-md:!py-14"
    >
      <div className="section-eyebrow">Depoimentos</div>
      <h2
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(2rem, 3.5vw, 3rem)',
          fontWeight: 400,
          lineHeight: 1.15,
          color: '#1C1C1C',
        }}
      >
        O que os <em style={{ fontStyle: 'italic', color: '#7B1D3A' }}>pacientes</em> dizem
      </h2>

      {/* Desktop grid */}
      <div
        ref={ref}
        className="reveal hidden md:grid"
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem',
          marginTop: '4rem',
        }}
      >
        {items.map((t) => (
          <DepCard key={t.nome} {...t} />
        ))}
      </div>

      {/* Mobile swipe carousel */}
      <div className="md:hidden" style={{ marginTop: '2.5rem' }}>
        <div
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touchStartX.current
            if (dx < -50) next()
            else if (dx > 50) prev()
          }}
          style={{ userSelect: 'none' }}
        >
          <DepCard {...items[activeIdx]} />
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '.5rem', marginTop: '1.5rem' }}>
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              style={{
                width: i === activeIdx ? '22px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: i === activeIdx ? '#1B6B5A' : 'rgba(27,107,90,0.2)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'width 0.25s ease, background 0.25s ease',
              }}
            />
          ))}
        </div>

        {/* Arrow nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem' }}>
          <button
            onClick={prev}
            disabled={activeIdx === 0}
            style={{
              background: 'none',
              border: '1px solid rgba(201,169,110,0.4)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: activeIdx === 0 ? 'default' : 'pointer',
              opacity: activeIdx === 0 ? 0.3 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="#1C1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <span style={{ fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#6B6B6B', alignSelf: 'center' }}>
            {activeIdx + 1} / {items.length}
          </span>

          <button
            onClick={next}
            disabled={activeIdx === items.length - 1}
            style={{
              background: 'none',
              border: '1px solid rgba(201,169,110,0.4)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: activeIdx === items.length - 1 ? 'default' : 'pointer',
              opacity: activeIdx === items.length - 1 ? 0.3 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="#1C1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Swipe hint */}
        <p style={{ textAlign: 'center', fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(107,107,107,0.6)', marginTop: '1rem' }}>
          deslize para navegar
        </p>
      </div>
    </section>
  )
}

function DepCard({ nome, cargo, texto, nota }: Testimonial) {
  const initial = nome.charAt(0).toUpperCase()

  return (
    <div
      style={{
        background: '#EDE7D9',
        border: '0.5px solid #EAE3D2',
        borderRadius: '10px',
        padding: '2.5rem',
        position: 'relative',
      }}
    >
      {/* Borda esquerda bordeaux */}
      <div
        style={{
          position: 'absolute',
          top: '2rem',
          bottom: '2rem',
          left: 0,
          width: '3px',
          background: '#7B1D3A',
          borderRadius: '0 2px 2px 0',
        }}
      />

      {/* Estrelas */}
      <div
        style={{
          position: 'absolute',
          top: '1.75rem',
          right: '2rem',
          color: '#C9A96E',
          fontSize: '.75rem',
          letterSpacing: '.05em',
        }}
      >
        {'★'.repeat(nota)}
      </div>

      {/* Citação */}
      <p
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '1.05rem',
          fontWeight: 300,
          fontStyle: 'italic',
          color: '#1C1C1C',
          lineHeight: 1.75,
          marginBottom: '2rem',
        }}
      >
        <span
          style={{
            fontSize: '3rem',
            lineHeight: 0,
            verticalAlign: '-.6em',
            color: '#7B1D3A',
            marginRight: '.15rem',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            opacity: .6,
          }}
        >
          "
        </span>
        {texto}
      </p>

      {/* Separador */}
      <div style={{ width: '32px', height: '1px', background: '#C9A96E', marginBottom: '1.25rem' }} />

      {/* Autor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(27,107,90,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '1rem',
            color: '#1B6B5A',
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <div>
          <div style={{ fontSize: '.82rem', color: '#1C1C1C', fontWeight: 400 }}>{nome}</div>
          <div style={{ fontSize: '.7rem', color: '#6B6B6B', marginTop: '1px' }}>{cargo}</div>
        </div>
      </div>
    </div>
  )
}

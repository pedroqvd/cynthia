'use client'

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

  return (
    <section
      id="depoimentos"
      style={{ padding: '8rem 5rem', background: '#F5F0E6' }}
      className="max-md:!px-6 max-md:!py-20"
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

      <div
        ref={ref}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem',
          marginTop: '4rem',
        }}
        className="max-md:!grid-cols-1"
      >
        {items.map((t) => (
          <DepCard key={t.nome} {...t} />
        ))}
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

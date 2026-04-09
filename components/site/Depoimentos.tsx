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
      style={{ padding: '8rem 4rem', background: '#131210' }}
      className="max-md:!px-8 max-md:!py-20"
    >
      <div className="section-eyebrow">Depoimentos</div>
      <h2
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(2rem, 3.5vw, 3rem)',
          fontWeight: 300,
          lineHeight: 1.15,
          color: '#f5f0e8',
        }}
      >
        O que os <em style={{ fontStyle: 'italic', color: '#b8965a' }}>pacientes</em> dizem
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
        border: '1px solid rgba(184,150,90,0.25)',
        padding: '2.5rem',
        position: 'relative',
      }}
    >
      {/* Estrelas */}
      <div
        style={{
          position: 'absolute',
          top: '2rem',
          right: '2rem',
          color: '#b8965a',
          fontSize: '.75rem',
          letterSpacing: '.1em',
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
          color: '#f5f0e8',
          lineHeight: 1.7,
          marginBottom: '2rem',
        }}
      >
        <span
          style={{
            fontSize: '3rem',
            lineHeight: 0,
            verticalAlign: '-.6em',
            color: '#b8965a',
            marginRight: '.25rem',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
          }}
        >
          "
        </span>
        {texto}
      </p>

      {/* Autor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(184,150,90,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '1rem',
            color: '#b8965a',
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <div>
          <div style={{ fontSize: '.82rem', color: '#f5f0e8', fontWeight: 400 }}>{nome}</div>
          <div style={{ fontSize: '.72rem', color: '#7a7570', marginTop: '1px' }}>{cargo}</div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useStaggerReveal } from '@/hooks/useReveal'

const CARDS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2C7 2 4 5 4 9c0 5 7 11 7 11s7-6 7-11c0-4-3-7-7-7z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
        <circle cx="11" cy="9" r="2" stroke="currentColor" strokeWidth="1"/>
      </svg>
    ),
    title: 'Estética Dental & Design do Sorriso',
    body: 'Transformações completas que equilibram proporção, cor e harmonia facial — com planejamento digital e materiais de alta performance.',
    list: [
      'Facetas e lentes de contato dental',
      'Clareamento profissional avançado',
      'Restaurações em cerâmica',
      'Harmonização do sorriso',
      'Gengivoplastia estética',
    ],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 18L18 4M8 4h10M18 4v10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="5" cy="17" r="2" stroke="currentColor" strokeWidth="1"/>
      </svg>
    ),
    title: 'Cirurgia Bucomaxilofacial & Implantes',
    body: 'Procedimentos cirúrgicos de alta complexidade, planejados com visão estética desde o início — sem separar a cirurgia do resultado final.',
    list: [
      'Implantes dentários unitários e múltiplos',
      'All-on-4 e All-on-6',
      'Enxerto ósseo e membrana',
      'Exodontias complexas',
      'Cirurgia ortognática',
    ],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="8" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1"/>
        <path d="M7 8V6a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        <path d="M9 13h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Prótese, Reabilitação & DTM',
    body: 'Reabilitação oral completa para casos complexos — incluindo tratamento de bruxismo, DTM e dor orofacial com abordagem multidisciplinar.',
    list: [
      'Próteses sobre implante',
      'Reabilitação oral total',
      'Tratamento de DTM e bruxismo',
      'Placa oclusal personalizada',
      'Botox terapêutico para dor facial',
    ],
  },
]

export function Especialidades() {
  const { ref } = useStaggerReveal()

  return (
    <section
      id="especialidades"
      style={{ padding: '8rem 4rem', background: '#131210' }}
      className="max-md:!px-8 max-md:!py-20"
    >
      <div className="section-eyebrow">Especialidades</div>
      <h2
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(2rem, 3.5vw, 3rem)',
          fontWeight: 300,
          lineHeight: 1.15,
          color: '#f5f0e8',
        }}
      >
        O que a Dra. Cynthia trata
      </h2>

      <div
        ref={ref}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1px',
          marginTop: '4rem',
          background: 'rgba(184,150,90,0.25)',
          border: '1px solid rgba(184,150,90,0.25)',
        }}
        className="max-md:!grid-cols-1"
      >
        {CARDS.map((card) => (
          <EspCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  )
}

function EspCard({
  icon,
  title,
  body,
  list,
}: {
  icon: React.ReactNode
  title: string
  body: string
  list: string[]
}) {
  return (
    <div
      style={{
        background: '#0f0e0c',
        padding: '3rem',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'background .3s',
      }}
      className="group max-md:!p-8"
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#1a1916')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#0f0e0c')}
    >
      {/* Linha dourada no hover */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: 0,
          height: '1px',
          background: '#b8965a',
          transition: 'width .4s ease',
        }}
        className="group-hover:!w-full"
      />

      {/* Ícone */}
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '1px solid rgba(184,150,90,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem',
          color: '#b8965a',
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '1.3rem',
          fontWeight: 400,
          color: '#f5f0e8',
          marginBottom: '1rem',
          lineHeight: 1.2,
        }}
      >
        {title}
      </div>

      <p style={{ fontSize: '.82rem', color: '#7a7570', lineHeight: 1.8 }}>{body}</p>

      <ul style={{ marginTop: '1.5rem', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        {list.map((item) => (
          <li
            key={item}
            style={{ fontSize: '.78rem', color: '#7a7570', display: 'flex', alignItems: 'center', gap: '.75rem' }}
          >
            <span style={{ width: '16px', height: '1px', background: '#b8965a', flexShrink: 0, display: 'block' }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

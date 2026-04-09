'use client'

import { useStaggerReveal } from '@/hooks/useReveal'

const CARDS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2C7 2 4 5 4 9c0 5 7 11 7 11s7-6 7-11c0-4-3-7-7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <circle cx="11" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/>
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
        <path d="M4 18L18 4M8 4h10M18 4v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="5" cy="17" r="2" stroke="currentColor" strokeWidth="1.5"/>
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
        <rect x="3" y="8" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 8V6a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
      style={{ padding: '8rem 5rem', background: '#F5F0E6' }}
      className="max-md:!px-6 max-md:!py-20"
    >
      <div className="section-eyebrow">Especialidades</div>
      <h2
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(2rem, 3.5vw, 3rem)',
          fontWeight: 400,
          lineHeight: 1.15,
          color: '#1C1C1C',
          maxWidth: '440px',
        }}
      >
        O que a Dra. Cynthia Quevedo trata
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
        background: '#EDE7D9',
        padding: '2.5rem',
        borderRadius: '10px',
        border: '0.5px solid #EAE3D2',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'box-shadow .3s, transform .3s',
      }}
      className="max-md:!p-7"
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 8px 40px rgba(27,107,90,0.1)'
        el.style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = 'none'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Linha esmeralda no topo */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #1B6B5A 0%, #C9A96E 100%)',
        }}
      />

      {/* Ícone */}
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '1px solid rgba(27,107,90,0.2)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.75rem',
          color: '#1B6B5A',
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '1.25rem',
          fontWeight: 400,
          color: '#1C1C1C',
          marginBottom: '.75rem',
          lineHeight: 1.25,
        }}
      >
        {title}
      </div>

      <p style={{ fontSize: '.82rem', color: '#6B6B6B', lineHeight: 1.8 }}>{body}</p>

      <ul style={{ marginTop: '1.5rem', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        {list.map((item) => (
          <li
            key={item}
            style={{ fontSize: '.78rem', color: '#1C1C1C', display: 'flex', alignItems: 'center', gap: '.75rem' }}
          >
            <span style={{ width: '14px', height: '1px', background: '#C9A96E', flexShrink: 0, display: 'block' }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

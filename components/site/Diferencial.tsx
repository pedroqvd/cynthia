'use client'

import { useReveal } from '@/hooks/useReveal'

const ITEMS = [
  {
    num: '01',
    title: 'Visão completa do seu caso',
    body: 'A maioria dos tratamentos exige vários especialistas em série — cada um vendo apenas a sua parte. Aqui, o diagnóstico, o plano e a execução vêm de uma profissional que enxerga o todo.',
    tags: ['Diagnóstico integrado', 'Menos encaminhamentos'],
  },
  {
    num: '02',
    title: 'Cirurgia e resultado estético alinhados',
    body: 'Poucos dentistas conseguem planejar a cirurgia já pensando no resultado final em prótese e estética. Essa rara combinação elimina retrabalho e garante resultados mais previsíveis.',
    tags: ['Planejamento cirúrgico estético', 'Resultado previsível'],
  },
  {
    num: '03',
    title: 'Atendimento exclusivo e personalizado',
    body: 'Sem filas, sem protocolos genéricos. Cada paciente tem um plano feito sob medida — desde o primeiro diagnóstico até o acompanhamento pós-tratamento.',
    tags: ['Agenda restrita', 'Plano sob medida'],
  },
]

export function Diferencial() {
  const { ref } = useReveal()

  return (
    <section
      id="diferencial"
      style={{
        padding: '8rem 5rem',
        background: '#EDE7D9',
        borderTop: '1px solid rgba(201,169,110,0.3)',
        borderBottom: '1px solid rgba(201,169,110,0.3)',
      }}
      className="max-md:!px-6 max-md:!py-20"
    >
      <div className="section-eyebrow">Por que é diferente</div>
      <h2
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(2rem, 3.5vw, 3rem)',
          fontWeight: 400,
          lineHeight: 1.15,
          color: '#1C1C1C',
          maxWidth: '480px',
        }}
      >
        Três especialidades.{' '}
        <em style={{ fontStyle: 'italic', color: '#1B6B5A' }}>Uma</em> profissional.
      </h2>

      <div
        ref={ref}
        className="reveal"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
          gap: 0,
          marginTop: '5rem',
        }}
      >
        {ITEMS.map((item, i) => (
          <>
            <div
              key={item.num}
              style={{
                padding: i === 0 ? '0 3.5rem 0 0' : i === 2 ? '0 0 0 3.5rem' : '0 3.5rem',
              }}
              className="max-md:!p-0 max-md:mb-10"
            >
              <div
                style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: '4rem',
                  fontWeight: 300,
                  color: 'rgba(201,169,110,0.4)',
                  lineHeight: 1,
                  marginBottom: '2rem',
                }}
              >
                {item.num}
              </div>
              <div
                style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: '1.35rem',
                  fontWeight: 400,
                  color: '#1C1C1C',
                  marginBottom: '1rem',
                  lineHeight: 1.2,
                }}
              >
                {item.title}
              </div>
              <p style={{ fontSize: '.85rem', color: '#6B6B6B', lineHeight: 1.8 }}>
                {item.body}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '1.5rem' }}>
                {item.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: '.66rem',
                      letterSpacing: '.1em',
                      textTransform: 'uppercase',
                      color: '#1B6B5A',
                      border: '1px solid rgba(27,107,90,0.25)',
                      padding: '.3rem .8rem',
                      borderRadius: '2px',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            {i < 2 && (
              <div
                key={`div-${i}`}
                style={{ background: 'rgba(201,169,110,0.3)', alignSelf: 'stretch' }}
                className="max-md:hidden"
              />
            )}
          </>
        ))}
      </div>
    </section>
  )
}

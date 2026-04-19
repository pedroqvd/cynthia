import type { Metadata } from 'next'
import { Nav } from '@/components/site/Nav'
import { Agendamento } from '@/components/site/Agendamento'
import { Footer } from '@/components/site/Footer'

export const metadata: Metadata = {
  title: 'Agendar Consulta | Dra. Cynthia Quevedo',
  description:
    'Agende sua avaliação com a Dra. Cynthia Quevedo — cirurgiã-dentista especialista em estética, cirurgia e reabilitação oral em Brasília.',
  openGraph: {
    title: 'Agendar Consulta | Dra. Cynthia Quevedo',
    description: 'Agende sua avaliação com a Dra. Cynthia Quevedo em Brasília.',
  },
}

export default function AgendamentoPage() {
  return (
    <>
      <Nav />

      {/* Mini hero — contexto antes do formulário */}
      <section
        style={{
          background: '#F5F0E6',
          padding: '8rem 5rem 4rem',
          maxWidth: '860px',
          margin: '0 auto',
        }}
        className="max-md:!px-6 max-md:!pt-20 max-md:!pb-6"
      >
        <div className="section-eyebrow">Consulta de avaliação</div>
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(2.4rem, 5vw, 4rem)',
            fontWeight: 300,
            lineHeight: 1.1,
            color: '#1C1C1C',
            marginBottom: '1.25rem',
          }}
        >
          O primeiro passo para o
          <br />
          sorriso que você <em style={{ fontStyle: 'italic', color: '#1B6B5A' }}>merece</em>.
        </h1>
        <p
          style={{
            fontSize: '.95rem',
            color: '#6B6B6B',
            maxWidth: '520px',
            lineHeight: 1.8,
            marginBottom: '3rem',
          }}
        >
          Preencha o formulário abaixo ou nos chame pelo WhatsApp. A consulta de avaliação é o
          momento em que a Dra. Cynthia entende seu caso e traça com você o caminho ideal.
          Sem compromisso.
        </p>

        {/* Diferenciais rápidos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(201,169,110,0.3)',
          }}
          className="max-md:!grid-cols-1"
        >
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8.5" stroke="#1B6B5A" strokeWidth="1.2"/>
                  <path d="M6.5 10l2.5 2.5 4.5-5" stroke="#1B6B5A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              title: 'Avaliação gratuita',
              desc: 'Sem custo para a primeira consulta de diagnóstico.',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2.5L3 8v9h5v-5h4v5h5V8l-7-5.5z" stroke="#1B6B5A" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
              ),
              title: 'Brasília — Asa Sul',
              desc: 'Atendimento presencial, com agendamento facilitado.',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="4" width="16" height="13" rx="1.5" stroke="#1B6B5A" strokeWidth="1.2"/>
                  <path d="M6 2v4M14 2v4M2 8h16" stroke="#1B6B5A" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              ),
              title: 'Segunda a sexta',
              desc: 'Horários flexíveis das 8h às 18h.',
            },
          ].map((item) => (
            <div key={item.title} style={{ display: 'flex', gap: '.9rem', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, marginTop: '2px' }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: '.85rem', fontWeight: 500, color: '#1C1C1C', marginBottom: '.25rem' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '.78rem', color: '#6B6B6B', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Formulário de agendamento (componente já existente) */}
      <Agendamento />

      <Footer />
    </>
  )
}

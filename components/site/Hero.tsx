'use client'

import Image from 'next/image'

export function Hero() {
  return (
    <section
      id="hero"
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'end',
        background: '#F5F0E6',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="max-md:!grid-cols-1"
    >
      {/* Linha central decorativa */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: '1px',
          background: 'rgba(201,169,110,0.3)',
        }}
        className="max-md:hidden"
      />

      {/* ── Lado esquerdo ── */}
      <div
        style={{ padding: '14rem 5rem 7rem 5rem', position: 'relative', zIndex: 2 }}
        className="max-md:!px-6 max-md:!pt-36 max-md:!pb-12"
      >
        <div
          style={{
            fontSize: '.7rem',
            fontWeight: 400,
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: '#1B6B5A',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            animation: 'fadeIn .8s ease both',
          }}
        >
          <span style={{ width: '32px', height: '1px', background: '#C9A96E', display: 'block' }} />
          Especialista em Brasília — DF
        </div>

        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(3rem, 5vw, 4.8rem)',
            fontWeight: 400,
            lineHeight: 1.08,
            color: '#1C1C1C',
            marginBottom: '2rem',
            animation: 'fadeUp .9s .2s ease both',
          }}
        >
          Onde a precisão<br />
          encontra a{' '}
          <em style={{ fontStyle: 'italic', color: '#1B6B5A' }}>beleza</em>.
        </h1>

        <p
          style={{
            fontSize: '.9rem',
            color: '#6B6B6B',
            maxWidth: '380px',
            lineHeight: 1.9,
            marginBottom: '3rem',
            animation: 'fadeUp .9s .35s ease both',
          }}
        >
          Estética dental, cirurgia bucomaxilofacial e prótese. Uma especialista rara que conduz
          seu caso do início ao fim, com visão completa e resultado planejado.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            animation: 'fadeUp .9s .5s ease both',
            flexWrap: 'wrap',
          }}
        >
          <a
            href="#cta"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '.75rem',
              fontSize: '.78rem',
              fontWeight: 500,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              background: '#1B6B5A',
              color: '#FFFFFF',
              padding: '14px 28px',
              borderRadius: '3px',
              textDecoration: 'none',
              transition: 'background .2s, transform .2s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = '#163D32'
              el.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = '#1B6B5A'
              el.style.transform = 'translateY(0)'
            }}
          >
            Agendar avaliação
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <a
            href="#resultados"
            style={{
              fontSize: '.78rem',
              fontWeight: 400,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: '#6B6B6B',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(201,169,110,0.4)',
              paddingBottom: '2px',
              transition: 'color .2s, border-color .2s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.color = '#1B6B5A'
              el.style.borderColor = '#C9A96E'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.color = '#6B6B6B'
              el.style.borderColor = 'rgba(201,169,110,0.4)'
            }}
          >
            Ver resultados
          </a>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: '3rem',
            marginTop: '4rem',
            paddingTop: '2.5rem',
            borderTop: '1px solid rgba(201,169,110,0.3)',
            animation: 'fadeIn 1s .7s ease both',
          }}
        >
          {[
            { num: '+12', label: 'Anos de especialização' },
            { num: '3', label: 'Especializações' },
            { num: '2mil+', label: 'Casos tratados' },
          ].map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: '1.8rem',
                  fontWeight: 400,
                  color: '#1B6B5A',
                  lineHeight: 1,
                }}
              >
                {s.num}
              </div>
              <div style={{ fontSize: '.68rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#6B6B6B', marginTop: '.3rem' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Lado direito — foto ── */}
      <div
        style={{
          position: 'relative',
          height: '100vh',
          overflow: 'hidden',
          animation: 'fadeIn 1.2s .3s ease both',
        }}
        className="max-md:hidden"
      >
        {/* Foto da Dra. Cynthia — jaleco branco, fundo rosa */}
        <Image
          src="/images/cynthia-hero.jpg"
          alt="Dra. Cynthia Quevedo — Especialista em Estética Dental, Cirurgia e Prótese"
          fill
          sizes="50vw"
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
          priority
        />

        {/* Overlay gradiente inferior */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '35%',
            background: 'linear-gradient(to top, #F5F0E6 0%, transparent 100%)',
            zIndex: 2,
          }}
        />

        {/* Caption */}
        <div style={{ position: 'absolute', bottom: '3rem', left: '2.5rem', zIndex: 3 }}>
          <div
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '1.2rem',
              fontWeight: 400,
              color: '#1C1C1C',
            }}
          >
            Dra. Cynthia Quevedo
          </div>
          <div
            style={{
              fontSize: '.68rem',
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: '#1B6B5A',
              marginTop: '.2rem',
            }}
          >
            Estética · Cirurgia Oral · Prótese
          </div>
        </div>
      </div>
    </section>
  )
}

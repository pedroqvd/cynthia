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
        padding: '0 4rem',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="max-md:!grid-cols-1 max-md:!px-8"
    >
      {/* Linha central decorativa */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: '1px',
          background: 'rgba(184,150,90,0.25)',
        }}
        className="max-md:hidden"
      />

      {/* ── Lado esquerdo ── */}
      <div
        style={{ padding: '14rem 4rem 7rem 0', position: 'relative', zIndex: 2 }}
        className="max-md:!p-0 max-md:pt-40 max-md:pb-16"
      >
        <div
          style={{
            fontSize: '.72rem',
            fontWeight: 400,
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: '#b8965a',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            animation: 'fadeIn .8s ease both',
          }}
        >
          <span style={{ width: '32px', height: '1px', background: '#b8965a', display: 'block' }} />
          Especialista em Brasília — DF
        </div>

        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(3.2rem, 5.5vw, 5rem)',
            fontWeight: 300,
            lineHeight: 1.08,
            color: '#f5f0e8',
            marginBottom: '2rem',
            animation: 'fadeUp .9s .2s ease both',
          }}
        >
          O sorriso que você<br />
          quer — feito por<br />
          quem <em style={{ fontStyle: 'italic', color: '#b8965a' }}>entende tudo</em><br />
          do que envolve.
        </h1>

        <p
          style={{
            fontSize: '.9rem',
            color: '#7a7570',
            maxWidth: '380px',
            lineHeight: 1.8,
            marginBottom: '3rem',
            animation: 'fadeUp .9s .35s ease both',
          }}
        >
          Estética dental, cirurgia bucomaxilofacial e prótese. Uma especialista rara que conduz
          seu caso do início ao fim, sem encaminhamentos.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
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
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              background: '#b8965a',
              color: '#0f0e0c',
              padding: '1rem 2rem',
              borderRadius: '2px',
              textDecoration: 'none',
              transition: 'background .2s, transform .2s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = '#d4b07a'
              el.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = '#b8965a'
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
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: '#7a7570',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(184,150,90,0.25)',
              paddingBottom: '2px',
              transition: 'color .2s, border-color .2s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.color = '#f5f0e8'
              el.style.borderColor = '#b8965a'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.color = '#7a7570'
              el.style.borderColor = 'rgba(184,150,90,0.25)'
            }}
          >
            Ver resultados
          </a>
        </div>
      </div>

      {/* ── Lado direito — foto ── */}
      <div
        style={{
          position: 'relative',
          height: '100vh',
          display: 'flex',
          alignItems: 'flex-end',
          animation: 'fadeIn 1.2s .3s ease both',
        }}
        className="max-md:hidden"
      >
        <div
          style={{
            width: '100%',
            height: '85%',
            background: '#1a1916',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Placeholder — substituir por next/image com a foto real */}
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'radial-gradient(ellipse 60% 80% at 55% 40%, #2a2520 0%, transparent 70%), linear-gradient(160deg, #1e1b17 0%, #0f0e0c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '1px solid rgba(184,150,90,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: .5,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="12" r="5" stroke="#b8965a" strokeWidth="1"/>
                <path d="M6 26c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#b8965a" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </div>
            <span
              style={{
                fontSize: '.7rem',
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: '#7a7570',
                opacity: .6,
              }}
            >
              Foto da Dra. Cynthia
            </span>
          </div>

          {/* Gradiente inferior */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(to top, #0f0e0c 0%, transparent 100%)',
            }}
          />

          {/* Caption */}
          <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem' }}>
            <div
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '1.4rem',
                fontWeight: 300,
                color: '#f5f0e8',
              }}
            >
              Dra. Cynthia
            </div>
            <div
              style={{
                fontSize: '.72rem',
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: '#b8965a',
                marginTop: '.25rem',
              }}
            >
              Estética · Cirurgia Bucomaxilofacial · Prótese
            </div>
          </div>
        </div>

        {/* Estatísticas verticais */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            writingMode: 'vertical-rl',
            display: 'flex',
            gap: '3rem',
            paddingRight: '1.5rem',
          }}
        >
          {[
            { num: '+12', label: 'Anos de especialização' },
            { num: '3', label: 'Especializações' },
          ].map((s) => (
            <div key={s.label} style={{ fontSize: '.7rem', letterSpacing: '.15em', textTransform: 'uppercase', color: '#7a7570' }}>
              <strong
                style={{
                  display: 'block',
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: '1.4rem',
                  fontWeight: 400,
                  color: '#b8965a',
                  letterSpacing: 0,
                  writingMode: 'vertical-rl',
                  marginBottom: '.5rem',
                }}
              >
                {s.num}
              </strong>
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

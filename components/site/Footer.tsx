import Link from 'next/link'

export function Footer() {
  return (
    <footer
      style={{
        background: '#F5F0E6',
        borderTop: '1px solid #C9A96E',
        padding: '3rem 5rem',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: '2rem',
      }}
      className="max-md:!grid-cols-1 max-md:!px-6 max-md:text-center"
    >
      <div style={{ fontSize: '.75rem', color: '#6B6B6B', lineHeight: 1.8 }}>
        © {new Date().getFullYear()} Dra. Cynthia Quevedo · CRO-DF 00000<br />
        Todos os direitos reservados.{' '}
        <Link href="/privacidade" style={{ color: '#1B6B5A', textDecoration: 'none' }}>
          Privacidade
        </Link>
      </div>

      {/* Monograma central */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '1.6rem',
            fontWeight: 400,
            color: '#1C1C1C',
            letterSpacing: '.04em',
          }}
        >
          Dra. Cynthia <span style={{ color: '#1B6B5A' }}>Quevedo</span>
        </div>
        <div
          style={{
            fontSize: '.62rem',
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: '#6B6B6B',
            marginTop: '.25rem',
          }}
        >
          Onde a precisão encontra a beleza
        </div>
      </div>

      <div
        style={{ fontSize: '.72rem', color: '#6B6B6B', textAlign: 'right', lineHeight: 1.8 }}
        className="max-md:!text-center"
      >
        Brasília · Asa Sul<br />
        Segunda a sexta, 8h–18h<br />
        <a
          href="https://wa.me/5561999999999"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1B6B5A', textDecoration: 'none' }}
        >
          +55 61 9999-9999
        </a>
      </div>
    </footer>
  )
}

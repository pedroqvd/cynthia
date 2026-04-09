import Link from 'next/link'

export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(184,150,90,0.25)',
        padding: '3rem 4rem',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: '2rem',
      }}
      className="max-md:!grid-cols-1 max-md:!px-8 max-md:text-center"
    >
      <div style={{ fontSize: '.75rem', color: '#7a7570', lineHeight: 1.8 }}>
        © {new Date().getFullYear()} Dra. Cynthia · CRO-DF 00000<br />
        Todos os direitos reservados.{' '}
        <Link href="/privacidade" style={{ color: '#b8965a', textDecoration: 'none' }}>
          Privacidade
        </Link>
      </div>

      <div
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '1rem',
          color: '#7a7570',
          textAlign: 'center',
        }}
      >
        Dra. <span style={{ color: '#b8965a' }}>Cynthia</span>
      </div>

      <div
        style={{
          fontSize: '.72rem',
          color: '#7a7570',
          textAlign: 'right',
          lineHeight: 1.8,
        }}
        className="max-md:!text-center"
      >
        Brasília · Asa Sul<br />
        Atendimento de segunda a sexta<br />
        <a
          href="https://wa.me/5561999999999"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#b8965a', textDecoration: 'none' }}
        >
          +55 61 9999-9999
        </a>
      </div>
    </footer>
  )
}

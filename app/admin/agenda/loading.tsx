export default function AgendaLoading() {
  return (
    <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={sk({ width: '100px', height: '28px' })} />
      </div>
      <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.5rem' }}>
          <div style={sk({ width: '80px', height: '32px', borderRadius: '2px' })} />
          <div style={sk({ width: '80px', height: '32px', borderRadius: '2px' })} />
          <div style={sk({ width: '80px', height: '32px', borderRadius: '2px' })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} style={sk({ height: '80px', borderRadius: '2px' })} />
          ))}
        </div>
      </div>
    </div>
  )
}

function sk(style: React.CSSProperties): React.CSSProperties {
  return {
    background: 'linear-gradient(90deg, #f0f0ee 25%, #e8e8e5 50%, #f0f0ee 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '3px',
    ...style,
  }
}

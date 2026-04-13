export default function LeadsLoading() {
  return (
    <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <div style={sk({ width: '140px', height: '28px', marginBottom: '8px' })} />
          <div style={sk({ width: '100px', height: '14px' })} />
        </div>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <div style={sk({ width: '120px', height: '36px', borderRadius: '2px' })} />
          <div style={sk({ width: '100px', height: '36px', borderRadius: '2px' })} />
        </div>
      </div>

      {/* Colunas Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(240px, 1fr))', gap: '1rem', flex: 1 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ background: '#f5f4f2', borderRadius: '4px', padding: '.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.75rem', paddingBottom: '.75rem', borderBottom: '2px solid #e5e5e3' }}>
              <div style={sk({ width: '80px', height: '14px' })} />
              <div style={sk({ width: '24px', height: '20px', borderRadius: '10px' })} />
            </div>
            {Array.from({ length: i === 0 ? 3 : i === 1 ? 2 : 1 }).map((_, j) => (
              <div key={j} style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '3px', padding: '.75rem', marginBottom: '.5rem' }}>
                <div style={sk({ width: '120px', height: '14px', marginBottom: '.5rem' })} />
                <div style={sk({ width: '80px', height: '11px', marginBottom: '.5rem' })} />
                <div style={sk({ width: '60px', height: '11px' })} />
              </div>
            ))}
          </div>
        ))}
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

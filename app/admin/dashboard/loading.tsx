export default function DashboardLoading() {
  return (
    <div style={{ padding: '2rem' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={sk({ width: '160px', height: '28px', marginBottom: '8px' })} />
        <div style={sk({ width: '220px', height: '16px' })} />
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.75rem' }}>
              <div style={sk({ width: '100px', height: '12px' })} />
              <div style={sk({ width: '20px', height: '20px', borderRadius: '4px' })} />
            </div>
            <div style={sk({ width: '70px', height: '32px', marginBottom: '.4rem' })} />
            <div style={sk({ width: '80px', height: '10px' })} />
          </div>
        ))}
      </div>

      {/* Gráficos placeholder */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.5rem', height: '280px' }}>
          <div style={sk({ width: '160px', height: '16px', marginBottom: '1.5rem' })} />
          <div style={sk({ width: '100%', height: '200px', borderRadius: '4px' })} />
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.5rem', height: '280px' }}>
          <div style={sk({ width: '120px', height: '16px', marginBottom: '1.5rem' })} />
          <div style={sk({ width: '100%', height: '200px', borderRadius: '4px' })} />
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

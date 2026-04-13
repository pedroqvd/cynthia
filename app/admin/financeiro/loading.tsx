export default function FinanceiroLoading() {
  const shimmer: React.CSSProperties = { animation: 'shimmer 1.4s infinite', borderRadius: '4px' }
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '2rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: '90px', background: '#f5f4f2', ...shimmer }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '2rem' }}>
        <div style={{ height: '240px', background: '#f5f4f2', ...shimmer }} />
        <div style={{ height: '240px', background: '#f5f4f2', ...shimmer }} />
      </div>
      <div style={{ height: '320px', background: '#f5f4f2', ...shimmer }} />
    </div>
  )
}

export function Skeleton({ width = '100%', height = 20, rounded = 8, className = '' }) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: rounded,
        background: 'linear-gradient(90deg, #F0EBE5 25%, #E8E3DD 50%, #F0EBE5 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
      <Skeleton height={60} width="50%" rounded={12} />
      <Skeleton height={24} width="30%" rounded={8} />
      <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
        <Skeleton height={100} rounded={16} />
        <Skeleton height={100} rounded={16} />
        <Skeleton height={100} rounded={16} />
      </div>
      <Skeleton height={200} rounded={16} />
      <Skeleton height={160} rounded={16} />
    </div>
  )
}

export function SessionListSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 24, maxWidth: '56rem', margin: '0 auto', width: '100%' }}>
      {[1,2,3,4].map(i => (
        <Skeleton key={i} height={90} rounded={16} />
      ))}
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'flex-end', maxWidth: '48rem', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Skeleton height={60} width="60%" rounded={16} />
      </div>
      <Skeleton height={80} width="70%" rounded={16} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Skeleton height={48} width="45%" rounded={16} />
      </div>
      <Skeleton height={100} width="75%" rounded={16} />
    </div>
  )
}

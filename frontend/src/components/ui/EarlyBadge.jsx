export function EarlyBadge({ number }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 999,
      background: 'linear-gradient(135deg, rgba(201,107,46,0.15), rgba(232,135,74,0.1))',
      border: '1px solid rgba(201,107,46,0.3)',
      fontSize: 10,
      fontWeight: 700,
      color: '#C96B2E',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      ✦ Early #{String(number).padStart(3,'0')}
    </span>
  )
}

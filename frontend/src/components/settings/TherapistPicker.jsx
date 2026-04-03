const CHARACTERS = [
  {
    id: 'warm_friend',
    name: 'Riley',
    role: 'The Warm Friend',
    behaviour: 'Casual, empathetic, uses your language. Feels like texting your most understanding friend.',
    tone: 'Like a warm friend',
    color: '#E8874A',
    emoji: '🧡',
    avatar: (color) => (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="20" r="11" fill={color} opacity="0.9"/>
        <ellipse cx="28" cy="11" rx="11" ry="5" fill={color}/>
        <path d="M12 52 Q12 38 28 38 Q44 38 44 52" fill={color} opacity="0.7"/>
        <path d="M23 22 Q28 27 33 22" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <circle cx="24" cy="19" r="1.5" fill="white"/>
        <circle cx="32" cy="19" r="1.5" fill="white"/>
      </svg>
    )
  },
  {
    id: 'wise_guide',
    name: 'Sage',
    role: 'The Thoughtful Guide',
    behaviour: 'Structured, insight-focused, helps you understand your own patterns and why you feel what you feel.',
    tone: 'Like a thoughtful guide',
    color: '#3D7A5F',
    emoji: '💚',
    avatar: (color) => (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="20" r="11" fill={color} opacity="0.9"/>
        <rect x="19" y="18" width="7" height="5" rx="2.5" stroke="white" strokeWidth="1.5" fill="none"/>
        <rect x="30" y="18" width="7" height="5" rx="2.5" stroke="white" strokeWidth="1.5" fill="none"/>
        <line x1="26" y1="20.5" x2="30" y2="20.5" stroke="white" strokeWidth="1.5"/>
        <path d="M12 52 Q12 38 28 38 Q44 38 44 52" fill={color} opacity="0.7"/>
        <path d="M24 24 Q28 26 32 24" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    )
  },
  {
    id: 'coach',
    name: 'Alex',
    role: 'The Coach',
    behaviour: 'Direct, action-oriented, keeps you accountable. Less feelings, more momentum.',
    tone: 'Like a coach',
    color: '#C96B2E',
    emoji: '🔥',
    avatar: (color) => (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="20" r="11" fill={color} opacity="0.9"/>
        <path d="M17 17 Q17 9 28 9 Q39 9 39 17" fill={color}/>
        <path d="M10 52 Q10 36 28 36 Q46 36 46 52" fill={color} opacity="0.7"/>
        <line x1="23" y1="24" x2="33" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="24" cy="19" r="1.5" fill="white"/>
        <circle cx="32" cy="19" r="1.5" fill="white"/>
      </svg>
    )
  },
  {
    id: 'mentor',
    name: 'Aura',
    role: 'The Wise Mentor',
    behaviour: 'Reflective, philosophical, patient. Will sit in the hard questions with you without rushing to answers.',
    tone: 'Like a wise mentor',
    color: '#7B5EA7',
    emoji: '✨',
    avatar: (color) => (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="20" r="11" fill={color} opacity="0.9"/>
        <path d="M17 14 Q14 30 16 42" stroke={color} strokeWidth="6" strokeLinecap="round" fill="none"/>
        <path d="M39 14 Q42 30 40 42" stroke={color} strokeWidth="6" strokeLinecap="round" fill="none"/>
        <path d="M12 52 Q12 38 28 38 Q44 38 44 52" fill={color} opacity="0.7"/>
        <path d="M23 23 Q28 27 33 23" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M22 19 Q24 17 26 19" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M30 19 Q32 17 34 19" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    )
  }
]

export function TherapistPicker({ value, onChange }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 12,
    }}>
      {CHARACTERS.map(char => {
        const isSelected = value === char.tone
        return (
          <button
            key={char.id}
            onClick={() => onChange(char.tone)}
            style={{
              padding: '20px 16px',
              borderRadius: 20,
              border: `2px solid ${isSelected ? char.color : '#E8E3DD'}`,
              background: isSelected
                ? `rgba(${hexToRgb(char.color)}, 0.08)`
                : 'rgba(255,252,248,0.7)',
              backdropFilter: 'blur(12px)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 180ms ease',
              transform: isSelected ? 'scale(1.02)' : 'scale(1)',
              boxShadow: isSelected
                ? `0 4px 20px rgba(${hexToRgb(char.color)}, 0.2)`
                : 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: `rgba(${hexToRgb(char.color)}, 0.12)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: isSelected ? `2px solid ${char.color}` : '2px solid transparent',
              transition: 'border 180ms',
            }}>
              {char.avatar(char.color)}
            </div>

            {/* Name */}
            <div style={{
              fontFamily: 'Fraunces, serif',
              fontStyle: 'italic',
              fontSize: 18,
              fontWeight: 300,
              color: isSelected ? char.color : '#1A1714',
              transition: 'color 180ms',
            }}>
              {char.name}
            </div>

            {/* Role */}
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 11,
              fontWeight: 600,
              color: isSelected ? char.color : '#9E8E7E',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              transition: 'color 180ms',
            }}>
              {char.role}
            </div>

            {/* Behaviour */}
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 12,
              color: '#6B6560',
              lineHeight: 1.5,
              textAlign: 'center',
            }}>
              {char.behaviour}
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: char.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 11,
                fontWeight: 700,
                marginTop: 4,
              }}>✓</div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// Helper
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `${r},${g},${b}`
}

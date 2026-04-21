import React, { useState } from 'react';

const CHARACTERS = [
  {
    id: 'warm_friend',
    name: 'Riley',
    role: 'The Warm Friend',
    behaviour: 'Casual, empathetic, uses your language. Feels like texting your most understanding friend.',
    tone: 'Like a warm friend',
    color: '#C96B2E',
    tier: 'free',
  },
  {
    id: 'wise_guide',
    name: 'Sage',
    role: 'The Thoughtful Guide',
    behaviour: 'Structured, insight-focused, helps you understand your own patterns and why you feel what you feel.',
    tone: 'Like a thoughtful guide',
    color: '#3D7A5F',
    tier: 'free',
  },
  {
    id: 'coach',
    name: 'Alex',
    role: 'The Relationship Expert',
    behaviour: 'Knows exactly why your love life is the way it is. Direct, warm, and brutally honest about patterns you keep repeating.',
    tone: 'Like a coach',
    color: '#C96B2E',
    tier: 'free',
  },
  {
    id: 'mentor',
    name: 'Aura',
    role: 'The Wise Mentor',
    behaviour: 'Reflective, philosophical, patient. Will sit in the hard questions with you without rushing to answers.',
    tone: 'Like a wise mentor',
    color: '#7B5EA7',
    tier: 'free',
  },
  {
    id: 'apex',
    name: 'Apex',
    role: 'The Competitor',
    behaviour: 'Zero noise. Every word lands. Turns excuses into action and spirals into focus.',
    tone: 'Like a competitor',
    color: '#1A1A2E',
    accentColor: '#4A90D9',
    tier: 'pro',
  },
  {
    id: 'crest',
    name: 'Crest',
    role: 'The Obsessive',
    behaviour: 'Self-belief as a weapon. Turns every setback into fuel. Helps you build the identity of someone who does not quit.',
    tone: 'Like an obsessive',
    color: '#1A3A2A',
    accentColor: '#2ECC71',
    tier: 'pro',
  },
  {
    id: 'forge',
    name: 'Forge',
    role: 'The Builder',
    behaviour: 'Treats your problems like engineering puzzles. Sharp, witty, occasionally sarcastic. Makes complexity feel solvable.',
    tone: 'Like a builder',
    color: '#2A1A0A',
    accentColor: '#E8A020',
    tier: 'pro',
  },
  {
    id: 'vale',
    name: 'Vale',
    role: 'The Anchor',
    behaviour: 'Steady as gravity. Helps you find your moral ground when everything feels uncertain. Strength that comes from values, not ego.',
    tone: 'Like an anchor',
    color: '#0A1A2A',
    accentColor: '#5B9BD5',
    tier: 'pro',
  },
]

function PersonaImage({ id, name, color, isSelected }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  if (error) {
    // Fallback: show initial letter
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `rgba(${hexToRgb(color)}, 0.15)`,
        fontFamily: 'Fraunces, serif',
        fontStyle: 'italic',
        fontSize: 18,
        color: color,
        fontWeight: 300,
      }}>
        {name[0]}
      </div>
    )
  }

  return (
    <>
      {!loaded && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(
            90deg,
            rgba(${hexToRgb(color)}, 0.08) 25%,
            rgba(${hexToRgb(color)}, 0.15) 50%,
            rgba(${hexToRgb(color)}, 0.08) 75%
          )`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '50%',
        }} />
      )}
      <img
        src={`/personas/${name.toLowerCase()}.jpg`}
        alt={name}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
          display: loaded ? 'block' : 'none',
          transition: 'transform 300ms ease',
          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
        }}
      />
    </>
  )
}

export function TherapistPicker({ value, onChange, isPro }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 10,
    }}>
      <style>{`
        @media (max-width: 340px) {
          .tpicker-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="tpicker-grid persona-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
        gridColumn: '1 / -1'
      }}>
        {CHARACTERS.map(char => {
          const isSelected = value === char.tone
          const isLocked = char.tier === 'pro' && !isPro

          return (
            <button
              key={char.id}
              className="persona-card"
              onClick={() => !isLocked && onChange(char.tone)}
              style={{
                padding: '16px 18px',
                borderRadius: 14,
                border: `1.5px solid ${isSelected
                  ? (char.accentColor || char.color)
                  : '#E8E3DD'}`,
                background: isSelected
                  ? `rgba(${hexToRgb(char.accentColor || char.color)}, 0.08)`
                  : 'rgba(255,252,248,0.8)',
                backdropFilter: 'blur(12px)',
                cursor: isLocked ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textAlign: 'left',
                transition: 'all 180ms ease',
                transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                opacity: isLocked ? 0.6 : 1,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Portrait image with fallback */}
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                overflow: 'hidden',
                border: isSelected
                  ? `2.5px solid ${char.accentColor || char.color}`
                  : '2.5px solid transparent',
                flexShrink: 0,
                transition: 'border-color 200ms ease',
                background: `rgba(${hexToRgb(char.accentColor || char.color)}, 0.1)`,
                position: 'relative',
                boxShadow: isSelected
                  ? `0 0 0 3px rgba(${hexToRgb(char.accentColor || char.color)}, 0.25)`
                  : 'none',
              }}>
                <PersonaImage
                  id={char.id}
                  name={char.name}
                  color={char.accentColor || char.color}
                  isSelected={isSelected}
                />
              </div>

              {/* Text */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="persona-name" style={{
                  fontFamily: 'Fraunces, serif',
                  fontStyle: 'italic',
                  fontSize: 16,
                  fontWeight: 300,
                  color: isSelected
                    ? (char.accentColor || char.color)
                    : '#1A1714',
                  transition: 'color 180ms',
                  marginBottom: 2,
                }}>{char.name}</div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  color: isSelected
                    ? (char.accentColor || char.color)
                    : '#9E8E7E',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  transition: 'color 180ms',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}>{char.role}</div>
              </div>

              {/* Selected checkmark */}
              {isSelected && (
                <div style={{
                  width: 20, height: 20,
                  borderRadius: '50%',
                  background: char.accentColor || char.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>✓</div>
              )}

              {/* Pro lock badge */}
              {isLocked && (
                <div style={{
                  position: 'absolute',
                  top: 8, right: 8,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(201,107,46,0.1)',
                  border: '1px solid rgba(201,107,46,0.2)',
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#C96B2E',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>Pro</div>
              )}
            </button>
          )
        })}
      </div>

      {/* Behaviour description — shows below grid when selected */}
      {(() => {
        const selected = CHARACTERS.find(c => c.tone === value)
        if (!selected) return null
        return (
          <div className="persona-behaviour-panel" style={{
            gridColumn: '1 / -1',
            padding: '14px 16px',
            borderRadius: 12,
            background: `rgba(${hexToRgb(selected.accentColor || selected.color)}, 0.06)`,
            border: `1px solid rgba(${hexToRgb(selected.accentColor || selected.color)}, 0.15)`,
            fontSize: 13,
            color: '#6B6560',
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}>
            {selected.behaviour}
          </div>
        )
      })()}
    </div>
  )
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `${r},${g},${b}`
}

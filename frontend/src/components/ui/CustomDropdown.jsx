import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export function CustomDropdown({ value, onChange, options, placeholder = 'Select...' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'rgba(255,252,248,0.8)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${open ? '#C96B2E' : '#E8E3DD'}`,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 15,
          color: selected ? '#1A1714' : '#9E8E7E',
          transition: 'all 150ms',
          boxShadow: open ? '0 0 0 3px rgba(201,107,46,0.12)' : 'none',
        }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown
          size={16}
          style={{
            color: '#C96B2E',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'rgba(255,252,248,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid #E8E3DD',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(201,107,46,0.15), 0 2px 8px rgba(0,0,0,0.08)',
          zIndex: 200,
          overflow: 'hidden',
          animation: 'dropdownIn 150ms ease',
        }}>
          {options.map((option, i) => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setOpen(false); }}
              style={{
                width: '100%',
                padding: '11px 16px',
                background: value === option.value
                  ? 'rgba(201,107,46,0.08)'
                  : 'transparent',
                border: 'none',
                borderBottom: i < options.length - 1
                  ? '1px solid rgba(232,227,221,0.5)'
                  : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14,
                color: value === option.value ? '#C96B2E' : '#1A1714',
                fontWeight: value === option.value ? 500 : 400,
                textAlign: 'left',
                transition: 'background 100ms',
              }}
              onMouseEnter={e => {
                if (value !== option.value)
                  e.currentTarget.style.background = 'rgba(201,107,46,0.04)'
              }}
              onMouseLeave={e => {
                if (value !== option.value)
                  e.currentTarget.style.background = 'transparent'
              }}
            >
              {option.label}
              {value === option.value && (
                <span style={{ color: '#C96B2E', fontSize: 16 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

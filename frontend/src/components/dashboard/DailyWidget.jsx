import { useState } from 'react'

const CHECK_INS = [
  { emoji: "🧠", text: "real talk — when did you last do something just for you?", cta: "think about it" },
  { emoji: "😮‍💨", text: "on a scale of 1-10, how much are you actually carrying rn?", cta: "start a session" },
  { emoji: "🫥", text: "are you ok or are you 'yeah i'm fine' ok?", cta: "be honest with Sol" },
  { emoji: "🌀", text: "what's living rent free in your head today?", cta: "talk it out" },
  { emoji: "🎭", text: "which version of you showed up today — the real one or the one everyone expects?", cta: "explore this" },
  { emoji: "🔋", text: "energy check: full, half, running on fumes, or actually dead?", cta: "let Sol know" },
  { emoji: "👀", text: "something's been on your mind. you know what it is.", cta: "say it out loud" },
]

const CHALLENGES = [
  { emoji: "🚶", title: "the 10 minute rule", body: "go outside for 10 minutes. no phone. just exist. report back.", cta: "i did it" },
  { emoji: "📵", title: "phone down, feelings up", body: "put your phone face down for 30 mins and sit with whatever comes up. scary? good.", cta: "try it" },
  { emoji: "✍️", title: "3 sentences max", body: "write 3 sentences about how you're actually feeling. no edits, no performance.", cta: "start writing" },
  { emoji: "🧘", title: "box breathing", body: "breathe in 4, hold 4, out 4, hold 4. do it 4 times. your nervous system will thank you.", cta: "do it now" },
  { emoji: "📞", title: "text someone first", body: "text someone you've been meaning to reach out to. just 'hey, thinking of you' counts.", cta: "challenge accepted" },
  { emoji: "🪞", title: "say one kind thing", body: "look in a mirror and say one thing you're proud of yourself for. out loud. yes, really.", cta: "i did the thing" },
  { emoji: "🍃", title: "permission slip", body: "you are officially allowed to rest today without earning it first. you don't have to justify it.", cta: "accepted 🖊️" },
]

const QUOTES = [
  { emoji: "💬", quote: "you are not behind. you're on your own timeline and it's valid.", source: "Sol" },
  { emoji: "🌊", quote: "feelings are not facts. they're visitors. let them pass through.", source: "Sol" },
  { emoji: "🔥", quote: "healing isn't linear. some days you go backwards and that's still progress.", source: "Sol" },
  { emoji: "🪴", quote: "you don't have to be productive to deserve rest. you just have to be human.", source: "Sol" },
  { emoji: "🌙", quote: "the 3am thoughts lie. don't make permanent decisions based on temporary feelings.", source: "Sol" },
  { emoji: "💡", quote: "being self-aware about your problems is not the same as being stuck in them.", source: "Sol" },
  { emoji: "🫂", quote: "asking for help is not weakness. it's just knowing your limits before they know you.", source: "Sol" },
  { emoji: "⚡", quote: "you survived every hard day you thought would break you. 100% success rate so far.", source: "Sol" },
  { emoji: "🎯", quote: "comparison is just suffering with extra steps. stay in your own lane.", source: "Sol" },
  { emoji: "🌤️", quote: "some days just getting out of bed is the win. let it be enough.", source: "Sol" },
]

function getDailyContent(preferredName) {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  const type = dayOfYear % 3 // 0=checkin, 1=challenge, 2=quote

  if (type === 0) {
    const item = CHECK_INS[dayOfYear % CHECK_INS.length]
    return { type: 'checkin', ...item }
  } else if (type === 1) {
    const item = CHALLENGES[dayOfYear % CHALLENGES.length]
    return { type: 'challenge', ...item }
  } else {
    const item = QUOTES[dayOfYear % QUOTES.length]
    return { type: 'quote', ...item }
  }
}

export function DailyWidget({ preferredName, onStartSession }) {
  const content = getDailyContent(preferredName)
  const [ctaDone, setCtaDone] = useState(false)

  const TYPE_CONFIG = {
    checkin: { label: 'daily check-in', labelColor: '#C96B2E', bg: 'rgba(201,107,46,0.06)', border: 'rgba(201,107,46,0.2)' },
    challenge: { label: "today's challenge", labelColor: '#3D7A5F', bg: 'rgba(61,122,95,0.06)', border: 'rgba(61,122,95,0.2)' },
    quote: { label: 'something to sit with', labelColor: '#7B5EA7', bg: 'rgba(123,94,167,0.06)', border: 'rgba(123,94,167,0.2)' },
  }

  const config = TYPE_CONFIG[content.type]

  return (
    <div style={{
      padding: '22px 24px',
      borderRadius: 20,
      background: config.bg,
      border: `1px solid ${config.border}`,
      marginBottom: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: `radial-gradient(ellipse, ${config.border} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Type label */}
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: config.labelColor,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{ fontSize: 14 }}>{content.emoji}</span>
        {config.label}
      </div>

      {/* Content */}
      {content.type === 'checkin' && (
        <>
          <p style={{
            fontSize: 17,
            color: '#1A1714',
            fontWeight: 500,
            lineHeight: 1.45,
            marginBottom: 16,
            fontFamily: 'DM Sans, sans-serif',
          }}>{content.text}</p>
          <button
            onClick={() => { setCtaDone(true); onStartSession?.() }}
            style={{
              padding: '9px 20px',
              borderRadius: 999,
              border: 'none',
              background: '#C96B2E',
              color: 'white',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >{ctaDone ? '✓ on it' : content.cta} →</button>
        </>
      )}

      {content.type === 'challenge' && (
        <>
          <div style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#1A1714',
            marginBottom: 6,
          }}>{content.title}</div>
          <p style={{
            fontSize: 14,
            color: '#6B6560',
            lineHeight: 1.6,
            marginBottom: 16,
          }}>{content.body}</p>
          <button
            onClick={() => setCtaDone(true)}
            style={{
              padding: '9px 20px',
              borderRadius: 999,
              border: `1.5px solid ${config.labelColor}`,
              background: ctaDone ? '#3D7A5F' : 'transparent',
              color: ctaDone ? 'white' : '#3D7A5F',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >{ctaDone ? '✓ done it' : content.cta}</button>
        </>
      )}

      {content.type === 'quote' && (
        <>
          <blockquote style={{
            fontSize: 16,
            color: '#1A1714',
            lineHeight: 1.55,
            fontStyle: 'italic',
            fontFamily: 'Fraunces, serif',
            fontWeight: 300,
            margin: '0 0 10px',
            borderLeft: `3px solid ${config.labelColor}`,
            paddingLeft: 16,
          }}>
            "{content.quote}"
          </blockquote>
          <div style={{ fontSize: 12, color: '#9E8E7E', paddingLeft: 16 }}>
            — {content.source}
          </div>
        </>
      )}
    </div>
  )
}

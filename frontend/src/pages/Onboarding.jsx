import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

const TOTAL_QUESTIONS = 11

const QUESTIONS = [
  {
    id: 'q0',
    field: 'preferred_name',
    title: 'First things first.',
    subtitle: 'What should Sol call you?',
    type: 'text',
    placeholder: 'Your name or nickname...',
    optional: false,
  },
  {
    id: 'q1',
    title: 'When life gets hard, what do you usually do first?',
    subtitle: "There's no right answer — just your honest instinct.",
    type: 'single',
    options: [
      { label: 'I try to figure it out alone', value: 'solo', maps: { coping_style: 'avoidant', attachment_hint: 'avoidant' } },
      { label: 'I talk to someone I trust', value: 'social', maps: { coping_style: 'social', attachment_hint: 'secure' } },
      { label: 'I distract myself until it passes', value: 'distract', maps: { coping_style: 'avoidant' } },
      { label: 'I feel overwhelmed and freeze', value: 'freeze', maps: { coping_style: 'freeze', attachment_hint: 'anxious' } },
    ],
  },
  {
    id: 'q2',
    title: 'How often do you feel like your emotions are too big for the moment?',
    subtitle: 'Like when a small thing hits much harder than it should.',
    type: 'slider',
    min: 1,
    max: 5,
    minLabel: 'Rarely',
    maxLabel: 'Almost always',
    maps: 'neuroticism_score',
  },
  {
    id: 'q3',
    title: 'In close relationships, what worries you most?',
    subtitle: 'This could be friendships, family, or romantic relationships.',
    type: 'single',
    options: [
      { label: "I'll be abandoned or left out", value: 'abandonment', maps: { attachment_hint: 'anxious' } },
      { label: "I'll lose my independence", value: 'independence', maps: { attachment_hint: 'avoidant' } },
      { label: "I'll say the wrong thing and hurt them", value: 'hurting', maps: { attachment_hint: 'anxious' } },
      { label: "Not much — I feel pretty secure", value: 'secure', maps: { attachment_hint: 'secure' } },
    ],
  },
  {
    id: 'q4',
    title: 'When you have a goal, how do you usually approach it?',
    subtitle: 'Think of something you genuinely cared about achieving.',
    type: 'single',
    options: [
      { label: 'I make a plan and stick to it', value: 'planned', maps: { conscientiousness: 'high' } },
      { label: 'I start strong but lose momentum', value: 'loses_momentum', maps: { conscientiousness: 'low' } },
      { label: 'I work in bursts when inspired', value: 'bursts', maps: { conscientiousness: 'low', openness: 'high' } },
      { label: 'I struggle to start even when I want to', value: 'struggles', maps: { conscientiousness: 'low', neuroticism_hint: 'high' } },
    ],
  },
  {
    id: 'q5',
    title: 'Finish this sentence honestly: Deep down, I believe I am...',
    subtitle: 'The first thing that comes to mind is usually the truest.',
    type: 'single',
    options: [
      { label: 'Capable and worthy of good things', value: 'positive', maps: { core_belief_valence: 'positive' } },
      { label: 'Trying my best, but often falling short', value: 'mild_negative', maps: { core_belief_valence: 'mild_negative' } },
      { label: 'A burden to the people around me', value: 'burden', maps: { core_belief_valence: 'negative', flag_needs_care: true } },
      { label: 'Honestly not sure — it changes a lot', value: 'unstable', maps: { core_belief_valence: 'unstable' } },
    ],
  },
  {
    id: 'q6',
    title: 'After a long social day, what does your body ask for?',
    subtitle: 'Not what you think you should want — what you actually crave.',
    type: 'single',
    options: [
      { label: 'More people — energy comes from connection', value: 'extrovert', maps: { extraversion: 'high' } },
      { label: 'Quiet alone time to recharge', value: 'introvert', maps: { extraversion: 'low' } },
      { label: 'One good conversation, then silence', value: 'ambivert', maps: { extraversion: 'mixed' } },
      { label: 'It depends entirely on my mood', value: 'variable', maps: { extraversion: 'mixed' } },
    ],
  },
  {
    id: 'q7',
    title: "What's the area of your life that weighs on you most right now?",
    subtitle: 'This helps Sol know where to show up for you.',
    type: 'multi',
    max: 2,
    options: [
      'Academics', 'Family', 'Friendships', 'Romantic relationships',
      'Self-image', 'Future & career', 'Loneliness', 'Mental health',
      'Finances', 'Something else',
    ],
  },
  {
    id: 'q8',
    title: "When you're really struggling, how do people around you know?",
    subtitle: 'Or do they not know at all?',
    type: 'single',
    options: [
      { label: 'I talk about it openly', value: 'open', maps: { emotional_expression_style: 'open' } },
      { label: 'They can tell from my behaviour', value: 'behaviour', maps: { emotional_expression_style: 'somatic' } },
      { label: "I hide it well — most people don't know", value: 'hidden', maps: { emotional_expression_style: 'masked' } },
      { label: 'I isolate and go quiet', value: 'isolate', maps: { emotional_expression_style: 'withdrawal' } },
    ],
  },
  {
    id: 'q9',
    title: 'What would you most want from Sol?',
    subtitle: 'How can this space be most useful to you?',
    type: 'single',
    options: [
      { label: 'Help me understand why I feel what I feel', value: 'insight_oriented', maps: { therapy_style_preference: 'insight_oriented' } },
      { label: 'Give me tools and strategies to cope', value: 'CBT_oriented', maps: { therapy_style_preference: 'CBT_oriented' } },
      { label: 'Just listen — I need to feel heard', value: 'person_centered', maps: { therapy_style_preference: 'person_centered' } },
      { label: 'Push me to take action and grow', value: 'coaching_oriented', maps: { therapy_style_preference: 'coaching_oriented' } },
    ],
  },
  {
    id: 'q10',
    title: 'Is there anything about you that you wish people understood better?',
    subtitle: "You don't have to answer this. But if something comes to mind, Sol is listening.",
    type: 'text',
    placeholder: 'Take your time...',
    optional: true,
  },
]

function computePersonalityProfile(answers) {
  const profile = {
    attachment_style: 'mixed',
    neuroticism_score: 3,
    extraversion: 'mixed',
    conscientiousness: 'mixed',
    core_belief_valence: 'positive',
    therapy_style_preference: 'person_centered',
    primary_stressor_domains: [],
    emotional_expression_style: 'open',
    coping_style: 'approach',
    free_text_reflection: null,
    flag_needs_care: false,
  }

  // Q0 — name (handled separately, not in profile)

  // Q1 — coping style
  const q1 = answers.q1
  if (q1 === 'solo' || q1 === 'distract') profile.coping_style = 'avoidant'
  else if (q1 === 'social') profile.coping_style = 'social'
  else if (q1 === 'freeze') profile.coping_style = 'freeze'

  // Q2 — neuroticism
  if (answers.q2) profile.neuroticism_score = parseInt(answers.q2)

  // Q3 + Q1 — attachment style
  const q3 = answers.q3
  const attachmentHints = []
  if (q1 === 'solo' || q1 === 'distract') attachmentHints.push('avoidant')
  if (q1 === 'social') attachmentHints.push('secure')
  if (q1 === 'freeze') attachmentHints.push('anxious')
  if (q3 === 'abandonment' || q3 === 'hurting') attachmentHints.push('anxious')
  if (q3 === 'independence') attachmentHints.push('avoidant')
  if (q3 === 'secure') attachmentHints.push('secure')

  const counts = attachmentHints.reduce((acc, h) => {
    acc[h] = (acc[h] || 0) + 1
    return acc
  }, {})
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  profile.attachment_style = sorted[0]?.[0] || 'mixed'

  // Q4 — conscientiousness
  const q4 = answers.q4
  if (q4 === 'planned') profile.conscientiousness = 'high'
  else if (q4 === 'loses_momentum' || q4 === 'struggles') profile.conscientiousness = 'low'
  else profile.conscientiousness = 'mixed'

  // Q5 — core belief
  const q5 = answers.q5
  if (q5) {
    const option = QUESTIONS[5].options.find(o => o.value === q5)
    if (option?.maps?.core_belief_valence)
      profile.core_belief_valence = option.maps.core_belief_valence
    if (option?.maps?.flag_needs_care)
      profile.flag_needs_care = true
  }

  // Q6 — extraversion
  const q6 = answers.q6
  if (q6 === 'extrovert') profile.extraversion = 'high'
  else if (q6 === 'introvert') profile.extraversion = 'low'
  else profile.extraversion = 'mixed'

  // Q7 — stressors
  if (Array.isArray(answers.q7)) {
    profile.primary_stressor_domains = answers.q7.map(s => s.toLowerCase().replace(/ /g, '_'))
  }

  // Q8 — emotional expression
  const q8 = answers.q8
  if (q8) {
    const option = QUESTIONS[8].options.find(o => o.value === q8)
    if (option?.maps?.emotional_expression_style)
      profile.emotional_expression_style = option.maps.emotional_expression_style
  }

  // Q9 — therapy style
  const q9 = answers.q9
  if (q9) profile.therapy_style_preference = q9

  // Q10 — free text
  if (answers.q10?.trim()) profile.free_text_reflection = answers.q10.trim()

  return profile
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const question = QUESTIONS[step]
  const isLastStep = step === TOTAL_QUESTIONS - 1

  const canContinue = () => {
    const q = QUESTIONS[step]
    if (q.optional) return true
    const answer = answers[q.id]
    if (q.type === 'text') return !!answer?.trim()
    if (q.type === 'single') return !!answer
    if (q.type === 'slider') return answer !== undefined
    if (q.type === 'multi') return Array.isArray(answer) && answer.length > 0
    return false
  }

  const handleNext = async () => {
    if (!canContinue() && !QUESTIONS[step].optional) return

    if (isLastStep) {
      await handleSubmit()
      return
    }

    setDirection(1)
    setStep(s => s + 1)
  }

  const handleBack = () => {
    if (step === 0) return
    setDirection(-1)
    setStep(s => s - 1)
  }

  const handleAnswer = (value) => {
    setAnswers(prev => ({ ...prev, [question.id]: value }))
  }

  const handleMultiToggle = (option) => {
    const current = answers[question.id] || []
    const max = question.max || 99
    if (current.includes(option)) {
      handleAnswer(current.filter(o => o !== option))
    } else if (current.length < max) {
      handleAnswer([...current, option])
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const personalityProfile = computePersonalityProfile(answers)
      const preferredName = answers.q0?.trim() || ''

      // Save intake responses
      await api.post('/api/profile/intake', {
        responses: answers,
        personality_profile: personalityProfile,
      })

      // Save preferred name to profile
      if (preferredName) {
        await api.patch('/api/profile/update', {
          preferred_name: preferredName,
        })
      }

      // Refresh profile in AuthContext so OnboardingGuard sees
      // onboarding_completed = true and stops redirecting
      await refreshProfile()

      // Navigate to dashboard
      navigate('/dashboard', { replace: true })

    } catch (err) {
      console.error('[Onboarding] Submit failed:', err)
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const slideVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--mesh-home)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      {/* Logo */}
      <div style={{
        position: 'fixed',
        top: 24,
        left: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#C96B2E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'Fraunces, serif',
          fontStyle: 'italic',
          fontSize: 13,
        }}>S</div>
        <span style={{
          fontFamily: 'Fraunces, serif',
          fontStyle: 'italic',
          fontSize: 18,
          color: '#1A1714',
          fontWeight: 300,
        }}>Sol</span>
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: '#F0EBE5',
        zIndex: 100,
      }}>
        <motion.div
          style={{
            height: '100%',
            background: '#C96B2E',
            borderRadius: '0 2px 2px 0',
          }}
          animate={{ width: `${((step + 1) / TOTAL_QUESTIONS) * 100}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Step counter */}
      <div style={{
        position: 'fixed',
        top: 20,
        right: 32,
        fontSize: 13,
        color: '#9E8E7E',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        {step + 1} / {TOTAL_QUESTIONS}
      </div>

      {/* Question card */}
      <div style={{
        width: '100%',
        maxWidth: 520,
        position: 'relative',
        minHeight: 360,
      }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ width: '100%' }}
          >
            {/* Question text */}
            <div style={{ marginBottom: 32, textAlign: 'center' }}>
              <h2 style={{
                fontFamily: 'Fraunces, serif',
                fontSize: 'clamp(22px, 4vw, 30px)',
                fontWeight: 300,
                color: '#1A1714',
                margin: '0 0 10px',
                lineHeight: 1.25,
              }}>{question.title}</h2>
              {question.subtitle && (
                <p style={{
                  fontSize: 15,
                  color: '#9E8E7E',
                  margin: 0,
                  lineHeight: 1.55,
                }}>{question.subtitle}</p>
              )}
            </div>

            {/* TEXT input */}
            {question.type === 'text' && (
              <div style={{ marginBottom: 24 }}>
                {question.id === 'q10' ? (
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={e => handleAnswer(e.target.value)}
                    placeholder={question.placeholder}
                    rows={4}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: 16,
                      border: '1.5px solid #E8E3DD',
                      background: 'rgba(255,252,248,0.8)',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 15,
                      color: '#1A1714',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 150ms',
                    }}
                    onFocus={e => e.target.style.borderColor = '#C96B2E'}
                    onBlur={e => e.target.style.borderColor = '#E8E3DD'}
                  />
                ) : (
                  <input
                    type="text"
                    value={answers[question.id] || ''}
                    onChange={e => handleAnswer(e.target.value)}
                    placeholder={question.placeholder}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleNext()}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: 16,
                      border: '1.5px solid #E8E3DD',
                      background: 'rgba(255,252,248,0.8)',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 16,
                      color: '#1A1714',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 150ms',
                    }}
                    onFocus={e => e.target.style.borderColor = '#C96B2E'}
                    onBlur={e => e.target.style.borderColor = '#E8E3DD'}
                  />
                )}
              </div>
            )}

            {/* SINGLE SELECT */}
            {question.type === 'single' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginBottom: 24,
              }}>
                {question.options.map(opt => {
                  const isSelected = answers[question.id] === opt.value
                  return (
                    <motion.button
                      key={opt.value}
                      onClick={() => handleAnswer(opt.value)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        padding: '16px 20px',
                        borderRadius: 16,
                        border: `2px solid ${isSelected ? '#C96B2E' : '#E8E3DD'}`,
                        background: isSelected
                          ? 'rgba(201,107,46,0.08)'
                          : 'rgba(255,252,248,0.8)',
                        backdropFilter: 'blur(12px)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 15,
                        color: isSelected ? '#C96B2E' : '#1A1714',
                        fontWeight: isSelected ? 500 : 400,
                        transition: 'all 150ms ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      {opt.label}
                      {isSelected && (
                        <span style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#C96B2E',
                          color: 'white',
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>✓</span>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            )}

            {/* SLIDER */}
            {question.type === 'slider' && (
              <div style={{ marginBottom: 32, padding: '0 8px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 32,
                }}>
                  {[1,2,3,4,5].map(val => (
                    <motion.button
                      key={val}
                      onClick={() => handleAnswer(val)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        border: `2px solid ${answers[question.id] === val
                          ? '#C96B2E' : '#E8E3DD'}`,
                        background: answers[question.id] === val
                          ? '#C96B2E' : 'rgba(255,252,248,0.8)',
                        color: answers[question.id] === val
                          ? 'white' : '#6B6560',
                        fontFamily: 'Fraunces, serif',
                        fontSize: 20,
                        fontWeight: 300,
                        cursor: 'pointer',
                        transition: 'all 150ms',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >{val}</motion.button>
                  ))}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: '#9E8E7E',
                }}>
                  <span>{question.minLabel}</span>
                  <span>{question.maxLabel}</span>
                </div>
              </div>
            )}

            {/* MULTI SELECT */}
            {question.type === 'multi' && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                marginBottom: 24,
                justifyContent: 'center',
              }}>
                {question.options.map(opt => {
                  const selected = (answers[question.id] || []).includes(opt)
                  return (
                    <motion.button
                      key={opt}
                      onClick={() => handleMultiToggle(opt)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 999,
                        border: `2px solid ${selected ? '#C96B2E' : '#E8E3DD'}`,
                        background: selected
                          ? 'rgba(201,107,46,0.08)' : 'rgba(255,252,248,0.8)',
                        color: selected ? '#C96B2E' : '#6B6560',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 14,
                        fontWeight: selected ? 500 : 400,
                        cursor: 'pointer',
                        transition: 'all 150ms',
                      }}
                    >{opt}</motion.button>
                  )
                })}
                <p style={{
                  width: '100%',
                  textAlign: 'center',
                  fontSize: 12,
                  color: '#9E8E7E',
                  margin: '4px 0 0',
                }}>Pick up to {question.max}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(192,57,43,0.08)',
                border: '1px solid rgba(192,57,43,0.2)',
                fontSize: 13,
                color: '#C0392B',
                marginBottom: 16,
                textAlign: 'center',
              }}>{error}</div>
            )}

            {/* Navigation buttons */}
            <div style={{
              display: 'flex',
              gap: 10,
              marginTop: 8,
            }}>
              {step > 0 && (
                <button
                  onClick={handleBack}
                  style={{
                    padding: '14px 20px',
                    borderRadius: 999,
                    border: '1px solid #E8E3DD',
                    background: 'transparent',
                    color: '#9E8E7E',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 15,
                    cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                >← Back</button>
              )}
              <button
                onClick={handleNext}
                disabled={!canContinue() && !question.optional || submitting}
                className="btn-mesh"
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: 15,
                  opacity: (!canContinue() && !question.optional) ? 0.45 : 1,
                }}
              >
                {submitting
                  ? 'Saving...'
                  : isLastStep
                    ? 'Enter Sol →'
                    : question.optional && !answers[question.id]?.trim()
                      ? 'Skip →'
                      : 'Continue →'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

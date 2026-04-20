import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { AppShell } from '../components/layout/AppShell';

export default function Profile() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [feedbackEnabled, setFeedbackEnabled] = useState(false)
  const [feedbackAnswers, setFeedbackAnswers] = useState({})
  const [feedbackMood, setFeedbackMood] = useState(null)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState(null)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  useEffect(() => {
    // Check if feedback is enabled
    api.get('/api/profile/feedback-status')
      .then(r => setFeedbackEnabled(r.data.enabled))
      .catch(() => setFeedbackEnabled(false))
  }, [])

  const FEEDBACK_QUESTIONS = [
    {
      id: 'q1',
      type: 'text',
      question: 'What\'s one thing Sol said that actually stuck with you?',
      placeholder: 'That one response that made you pause...',
      optional: false,
    },
    {
      id: 'q2',
      type: 'text',
      question: 'Be honest — what\'s something Sol gets completely wrong?',
      placeholder: 'We can handle it. Actually tell us.',
      optional: false,
    },
    {
      id: 'q3',
      type: 'single',
      question: 'When you open Sol, what are you actually looking for?',
      options: [
        'Someone to listen without judgment',
        'Help making a decision',
        'To understand why I feel the way I feel',
        'A reality check',
        'Just to not feel alone for a minute',
      ],
      optional: false,
    },
    {
      id: 'q4',
      type: 'text',
      question: 'What would make you open Sol every single day?',
      placeholder: 'What\'s the one thing that would make it unmissable?',
      optional: false,
    },
    {
      id: 'q5',
      type: 'single',
      question: 'Which archetype actually gets you?',
      options: [
        'Riley — feels like talking to a real friend',
        'Sage — helps me understand myself',
        'Alex — cuts through my relationship bs',
        'Aura — makes me feel less lost',
        'Apex — no nonsense, just clarity',
        'Crest — won\'t let me give up on myself',
        'Forge — makes problems feel solvable',
        'Vale — the one that actually grounds me',
        "I haven't found my one yet",
      ],
      optional: true,
    },
    {
      id: 'q6',
      type: 'text',
      question: 'What are you going through right now that Sol doesn\'t know how to help with?',
      placeholder: 'This helps us get better at the things that matter most...',
      optional: true,
    },
    {
      id: 'q7',
      type: 'single',
      question: 'If Sol disappeared tomorrow, what would you actually miss?',
      options: [
        'The fact that it remembers everything',
        'Having somewhere to say things out loud',
        'The specific archetype I use',
        'The check-ins and daily prompts',
        'Honestly? Nothing yet — I\'m still figuring it out',
      ],
      optional: false,
    },
    {
      id: 'q8',
      type: 'scale',
      question: 'How much do you trust Sol with the real stuff?',
      min: 1,
      max: 5,
      minLabel: "I keep it surface level",
      maxLabel: "I've said things here I've never said out loud",
      optional: false,
    },
    {
      id: 'q9',
      type: 'text',
      question: 'What would you tell a friend who\'s struggling but refuses to try Sol?',
      placeholder: 'In your own words...',
      optional: true,
    },
    {
      id: 'q10',
      type: 'text',
      question: 'Last one — what do you wish we asked you that we didn\'t?',
      placeholder: 'Anything. We\'re listening.',
      optional: true,
    },
  ]

  const handleFeedbackSubmit = async () => {
    const required = FEEDBACK_QUESTIONS.filter(q => !q.optional)
    const missing = required.find(q => !feedbackAnswers[q.id])
    if (missing) {
      setFeedbackError(`Please answer: "${missing.question}"`)
      return
    }
    if (!feedbackMood) {
      setFeedbackError('Tell us how you\'re feeling right now first.')
      return
    }

    setFeedbackLoading(true)
    setFeedbackError(null)
    try {
      await api.post('/api/profile/feedback', {
        answers: feedbackAnswers,
        mood_at_time: feedbackMood,
      })
      setFeedbackSubmitted(true)
    } catch (err) {
      const status = err.response?.status
      if (status === 429) {
        setAlreadySubmitted(true)
      } else {
        setFeedbackError(
          err.response?.data?.detail?.message || 'Something went wrong.'
        )
      }
    } finally {
      setFeedbackLoading(false)
    }
  }
  
  const [formData, setFormData] = useState({
    preferred_name: '',
    life_phase: '',
    current_situation: '',
    life_goal: '',
    persistent_context: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        preferred_name: profile.preferred_name || profile.full_name || '',
        life_phase: profile.life_phase || '',
        current_situation: profile.current_situation || '',
        life_goal: profile.life_goal || '',
        persistent_context: profile.persistent_context || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.patch('/api/profile/update', formData);
      await refreshProfile();
      addToast('Profile saved successfully', 'success');
    } catch (err) {
      addToast('Failed to save profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you absolutely sure? This will permanently delete your account, session history, and all memory Sol has of you. This cannot be undone.")) return;
    
    try {
      await api.delete('/api/profile/me');
      await signOut();
      window.location.href = '/';
    } catch (err) {
      addToast('Failed to delete account. You may need to contact support.', 'error');
    }
  };

  return (
    <AppShell>
      <div className="flex-1 bg-sol-bg w-full overflow-y-auto">
        <div className="mobile-quick-nav" style={{
          display: 'none',  /* shown via CSS only on mobile */
        }}>
          <style>{`
            @media (max-width: 768px) {
              .mobile-quick-nav {
                display: flex !important;
                gap: 10px;
                padding: 16px 20px 0;
                flex-wrap: wrap;
              }
            }
          `}</style>
          {[
            { label: '⚙ Settings', path: '/settings' },
            { label: '◈ Memory',   path: '/memory'   },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                padding: '9px 18px',
                borderRadius: 999,
                border: '1px solid #E8E3DD',
                background: 'rgba(255,252,248,0.8)',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                fontWeight: 500,
                color: '#6B6560',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 150ms',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#C96B2E'
                e.currentTarget.style.color = '#C96B2E'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E8E3DD'
                e.currentTarget.style.color = '#6B6560'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-sol-border px-8 flex items-center sticky top-0 z-10">
           <h1 className="text-2xl font-display text-sol-text-primary">Profile</h1>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-12 space-y-12">
           <section>
              <h2 className="text-lg font-medium text-sol-text-primary mb-6">Personal Details</h2>
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col gap-6">
                 <div>
                   <label className="block text-sm font-semibold text-sol-text-secondary mb-2">Preferred Name</label>
                   <input 
                     type="text" 
                     value={formData.preferred_name} 
                     onChange={e => setFormData({...formData, preferred_name: e.target.value})}
                     className="sol-input"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-semibold text-sol-text-secondary mb-2">Life Phase</label>
                   <p className="text-xs text-gray-500 mb-2">Are you a freshman? Graduating soon? Taking a gap year?</p>
                   <input 
                     type="text" 
                     value={formData.life_phase} 
                     onChange={e => setFormData({...formData, life_phase: e.target.value})}
                     className="sol-input"
                     placeholder="e.g., Junior standing, pre-med track"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-semibold text-sol-text-secondary mb-2">Current Situation</label>
                   <textarea 
                     value={formData.current_situation} 
                     onChange={e => setFormData({...formData, current_situation: e.target.value})}
                     className="sol-input h-24 resize-none"
                     placeholder="What's going on logistically right now?"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-semibold text-sol-text-secondary mb-2">Life Goal</label>
                   <input 
                     type="text" 
                     value={formData.life_goal} 
                     onChange={e => setFormData({...formData, life_goal: e.target.value})}
                     className="sol-input"
                     placeholder="What are you working toward right now?"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-semibold text-sol-text-secondary mb-2">Persistent Context</label>
                   <p className="text-xs text-gray-500 mb-2">Is there something Sol should ALWAYS know and factor into its responses? (e.g. "I have ADHD", "I am highly sensitive to rejection")</p>
                   <textarea 
                     value={formData.persistent_context} 
                     onChange={e => setFormData({...formData, persistent_context: e.target.value})}
                     className="sol-input h-24 resize-none"
                   />
                 </div>
                 
                 <div className="pt-4 flex justify-end">
                   <button onClick={handleSave} disabled={loading} className="btn-primary px-8">
                     {loading ? 'Saving...' : 'Save Changes'}
                   </button>
                 </div>
              </div>
           </section>

           {feedbackEnabled && (
             <div style={{
               marginTop: 32,
               padding: '32px 28px',
               borderRadius: 20,
               background: 'rgba(255,252,248,0.7)',
               backdropFilter: 'blur(16px)',
               border: '1px solid rgba(232,227,221,0.7)',
             }}>
               {/* Header */}
               <div style={{ marginBottom: 28 }}>
                 <h2 style={{
                   fontFamily: 'Fraunces, serif',
                   fontWeight: 300,
                   fontSize: 26,
                   color: '#1A1714',
                   marginBottom: 8,
                 }}>Help us get better.</h2>
                 <p style={{
                   fontSize: 14,
                   color: '#6B6560',
                   lineHeight: 1.65,
                   maxWidth: 480,
                 }}>
                   No corporate survey energy. Just honest questions.
                   Your answers shape what Sol becomes — and they go
                   directly to the people building it.
                 </p>
               </div>

               {feedbackSubmitted ? (
                 /* Success state */
                 <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                   <div style={{ fontSize: 48, marginBottom: 16 }}>☀️</div>
                   <div style={{
                     fontFamily: 'Fraunces, serif',
                     fontSize: 22,
                     fontWeight: 300,
                     color: '#1A1714',
                     marginBottom: 8,
                   }}>Thank you. Genuinely.</div>
                   <div style={{
                     fontSize: 14,
                     color: '#6B6560',
                     lineHeight: 1.6,
                     maxWidth: 360,
                     margin: '0 auto',
                   }}>
                     This goes straight to the people building Sol.
                     You just made it better for everyone.
                   </div>
                 </div>
               ) : alreadySubmitted ? (
                 <div style={{
                   textAlign: 'center', padding: '24px',
                   fontSize: 14, color: '#9E8E7E',
                 }}>
                   You've already shared feedback recently.
                   Come back in a few days — we'll have new questions. ☀️
                 </div>
               ) : (
                 <>
                   {/* Current mood */}
                   <div style={{ marginBottom: 28 }}>
                     <div style={{
                       fontSize: 13,
                       fontWeight: 600,
                       color: '#6B6560',
                       textTransform: 'uppercase',
                       letterSpacing: '0.06em',
                       marginBottom: 12,
                     }}>How are you feeling right now?</div>
                     <div style={{
                       display: 'flex', gap: 8, flexWrap: 'wrap',
                     }}>
                       {[
                         { val: 'awful',   emoji: '😔', label: 'Rough' },
                         { val: 'meh',     emoji: '😕', label: 'Meh'   },
                         { val: 'okay',    emoji: '😐', label: 'Okay'  },
                         { val: 'good',    emoji: '🙂', label: 'Good'  },
                         { val: 'great',   emoji: '😊', label: 'Great' },
                       ].map(m => (
                         <button
                           key={m.val}
                           onClick={() => setFeedbackMood(m.val)}
                           style={{
                             padding: '8px 16px',
                             borderRadius: 999,
                             border: `1.5px solid ${feedbackMood === m.val
                               ? '#C96B2E' : '#E8E3DD'}`,
                             background: feedbackMood === m.val
                               ? 'rgba(201,107,46,0.08)' : 'transparent',
                             color: feedbackMood === m.val ? '#C96B2E' : '#6B6560',
                             fontFamily: 'DM Sans, sans-serif',
                             fontSize: 13,
                             fontWeight: feedbackMood === m.val ? 600 : 400,
                             cursor: 'pointer',
                             transition: 'all 150ms',
                             display: 'flex',
                             alignItems: 'center',
                             gap: 6,
                           }}
                         >
                           {m.emoji} {m.label}
                         </button>
                       ))}
                     </div>
                   </div>

                   {/* Questions */}
                   <div style={{
                     display: 'flex', flexDirection: 'column', gap: 24,
                   }}>
                     {FEEDBACK_QUESTIONS.map((q, i) => (
                       <div key={q.id}>
                         {/* Question */}
                         <div style={{
                           fontSize: 15,
                           fontWeight: 500,
                           color: '#1A1714',
                           marginBottom: 4,
                           lineHeight: 1.4,
                         }}>
                           {q.question}
                           {q.optional && (
                             <span style={{
                               fontSize: 11,
                               color: '#C8C3BD',
                               fontWeight: 400,
                               marginLeft: 6,
                             }}>optional</span>
                           )}
                         </div>

                         {/* Text input */}
                         {q.type === 'text' && (
                           <textarea
                             value={feedbackAnswers[q.id] || ''}
                             onChange={e => setFeedbackAnswers(prev => ({
                               ...prev, [q.id]: e.target.value
                             }))}
                             placeholder={q.placeholder}
                             rows={2}
                             style={{
                               width: '100%',
                               padding: '12px 14px',
                               borderRadius: 12,
                               border: '1.5px solid #E8E3DD',
                               background: 'rgba(249,247,244,0.6)',
                               fontFamily: 'DM Sans, sans-serif',
                               fontSize: 14,
                               color: '#1A1714',
                               outline: 'none',
                               resize: 'none',
                               lineHeight: 1.6,
                               boxSizing: 'border-box',
                               transition: 'border-color 150ms',
                             }}
                             onFocus={e => e.target.style.borderColor = '#C96B2E'}
                             onBlur={e => e.target.style.borderColor = '#E8E3DD'}
                           />
                         )}

                         {/* Single select */}
                         {q.type === 'single' && (
                           <div style={{
                             display: 'flex', flexDirection: 'column', gap: 8,
                           }}>
                             {q.options.map(opt => (
                               <button
                                 key={opt}
                                 onClick={() => setFeedbackAnswers(prev => ({
                                   ...prev, [q.id]: opt
                                 }))}
                                 style={{
                                   padding: '11px 16px',
                                   borderRadius: 12,
                                   border: `1.5px solid ${
                                     feedbackAnswers[q.id] === opt
                                       ? '#C96B2E' : '#E8E3DD'
                                   }`,
                                   background: feedbackAnswers[q.id] === opt
                                     ? 'rgba(201,107,46,0.07)' : 'rgba(255,252,248,0.7)',
                                   color: feedbackAnswers[q.id] === opt
                                     ? '#C96B2E' : '#1A1714',
                                   fontFamily: 'DM Sans, sans-serif',
                                   fontSize: 13,
                                   fontWeight: feedbackAnswers[q.id] === opt ? 500 : 400,
                                   cursor: 'pointer',
                                   textAlign: 'left',
                                   transition: 'all 150ms',
                                   display: 'flex',
                                   alignItems: 'center',
                                   justifyContent: 'space-between',
                                 }}
                               >
                                 {opt}
                                 {feedbackAnswers[q.id] === opt && (
                                   <span style={{ color: '#C96B2E', fontSize: 14 }}>
                                     ✓
                                   </span>
                                 )}
                               </button>
                             ))}
                           </div>
                         )}

                         {/* Scale */}
                         {q.type === 'scale' && (
                           <div style={{ padding: '4px 0' }}>
                             <div style={{
                               display: 'flex',
                               justifyContent: 'space-between',
                               gap: 8,
                               marginBottom: 10,
                             }}>
                               {[1, 2, 3, 4, 5].map(val => (
                                 <button
                                   key={val}
                                   onClick={() => setFeedbackAnswers(prev => ({
                                     ...prev, [q.id]: val
                                   }))}
                                   style={{
                                     flex: 1,
                                     aspectRatio: '1',
                                     borderRadius: '50%',
                                     border: `2px solid ${
                                       feedbackAnswers[q.id] === val
                                         ? '#C96B2E' : '#E8E3DD'
                                     }`,
                                     background: feedbackAnswers[q.id] === val
                                       ? '#C96B2E' : 'transparent',
                                     color: feedbackAnswers[q.id] === val
                                       ? 'white' : '#6B6560',
                                     fontFamily: 'Fraunces, serif',
                                     fontSize: 18,
                                     fontWeight: 300,
                                     cursor: 'pointer',
                                     transition: 'all 150ms',
                                     display: 'flex',
                                     alignItems: 'center',
                                     justifyContent: 'center',
                                   }}
                                 >{val}</button>
                               ))}
                             </div>
                             <div style={{
                               display: 'flex',
                               justifyContent: 'space-between',
                               fontSize: 11,
                               color: '#9E8E7E',
                             }}>
                               <span>{q.minLabel}</span>
                               <span>{q.maxLabel}</span>
                             </div>
                           </div>
                         )}
                       </div>
                     ))}
                   </div>

                   {/* Error */}
                   {feedbackError && (
                     <div style={{
                       marginTop: 16,
                       padding: '10px 14px',
                       borderRadius: 10,
                       background: 'rgba(192,57,43,0.08)',
                       border: '1px solid rgba(192,57,43,0.2)',
                       fontSize: 13,
                       color: '#C0392B',
                     }}>{feedbackError}</div>
                   )}

                   {/* Submit */}
                   <button
                     onClick={handleFeedbackSubmit}
                     disabled={feedbackLoading}
                     className="btn-mesh"
                     style={{
                       marginTop: 24,
                       width: '100%',
                       padding: '14px',
                       fontSize: 15,
                       opacity: feedbackLoading ? 0.7 : 1,
                     }}
                   >
                     {feedbackLoading ? 'Sending...' : 'Send feedback →'}
                   </button>

                   <p style={{
                     textAlign: 'center',
                     fontSize: 12,
                     color: '#C8C3BD',
                     marginTop: 12,
                   }}>
                     Anonymous to other users. Goes directly to the Sol team.
                   </p>
                 </>
               )}
             </div>
           )}

           <section style={{ marginTop: 32 }}>
              <h2 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h2>
              <div className="bg-red-50 rounded-3xl p-8 border border-red-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                 <div>
                   <h3 className="font-semibold text-red-800 mb-1">Delete Account</h3>
                   <p className="text-sm text-red-600">Permanently remove your account and all therapy data. This cannot be reversed.</p>
                 </div>
                 <button onClick={handleDeleteAccount} className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors whitespace-nowrap">
                   Delete Account
                 </button>
              </div>
           </section>
        </main>
      </div>
    </AppShell>
  );
}

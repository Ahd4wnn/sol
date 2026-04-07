import { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { AppShell } from '../components/layout/AppShell';
import { CustomDropdown } from '../components/ui/CustomDropdown';
import { TherapistPicker } from '../components/settings/TherapistPicker';
import { usePushNotifications } from '../hooks/usePushNotifications';

const FOCUS_AREAS = [
  "Emotional support", "Academic stress", "Relationship advice", 
  "Anxiety management", "Boundary setting", "Confidence building",
  "Depression coping", "Time management"
];

export default function Settings() {
  const { profile, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('therapist');
  const [intakeData, setIntakeData] = useState(null);
  
  const { permission, subscribed, subscribe, unsubscribe } = usePushNotifications();

  const [tSettings, setTSettings] = useState({
    therapist_tone: 'Like a warm friend',
    response_length: 'Balanced',
    therapist_focus: []
  });

  useEffect(() => {
    if (profile?.therapist_settings) {
      setTSettings({
        therapist_tone: profile.therapist_settings.therapist_tone || 'Like a warm friend',
        response_length: profile.therapist_settings.response_length || 'Balanced',
        therapist_focus: profile.therapist_settings.therapist_focus || []
      });
    }

    if (profile?.intake_responses) {
      setIntakeData(profile.intake_responses);
    }
  }, [profile]);

  const saveTherapistSettings = async () => {
    setLoading(true);
    try {
      await api.patch('/api/profile/therapist-settings', tSettings);
      await refreshProfile();
      addToast('Therapist preferences updated.', 'success');
    } catch (e) {
      addToast('Failed to update preferences.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleFocus = (area) => {
    setTSettings(prev => {
      const current = prev.therapist_focus;
      if (current.includes(area)) {
        return { ...prev, therapist_focus: current.filter(x => x !== area) };
      }
      if (current.length >= 3) return prev;
      return { ...prev, therapist_focus: [...current, area] };
    });
  };

  return (
    <AppShell>
      <div className="flex-1 bg-sol-bg w-full overflow-y-auto">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-sol-border px-8 flex items-center sticky top-0 z-10">
           <h1 className="text-2xl font-display text-sol-text-primary">Settings</h1>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-12">
           <div className="flex space-x-6 border-b border-gray-200 mb-10">
             <button 
               onClick={() => setActiveTab('therapist')}
               className={`pb-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'therapist' ? 'border-sol-primary text-sol-primary' : 'border-transparent text-sol-text-secondary hover:text-sol-text-primary'}`}
             >
               Sol Persona
             </button>
             <button 
               onClick={() => setActiveTab('intake')}
               className={`pb-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'intake' ? 'border-sol-primary text-sol-primary' : 'border-transparent text-sol-text-secondary hover:text-sol-text-primary'}`}
             >
               Initial Intake Answers
             </button>
             <button 
               onClick={() => setActiveTab('redeem')}
               className={`pb-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'redeem' ? 'border-sol-primary text-sol-primary' : 'border-transparent text-sol-text-secondary hover:text-sol-text-primary'}`}
             >
               ✦ Redeem Code
             </button>
           </div>

           {activeTab === 'therapist' && (
             <section className="space-y-8 animate-fade-in">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col gap-6">
                   <div>
                     <label className="block text-sm font-semibold text-sol-text-secondary mb-3">Sol Persona</label>
                     <TherapistPicker
                       value={tSettings.therapist_tone}
                       onChange={(tone) => setTSettings({...tSettings, therapist_tone: tone})}
                     />
                   </div>
                   
                   <div>
                     <label className="block text-sm font-semibold text-sol-text-secondary mb-3">Response Length</label>
                     <CustomDropdown
                       value={tSettings.response_length}
                       onChange={(val) => setTSettings({...tSettings, response_length: val})}
                       options={[
                         { value: 'Concise (Get to the point)', label: 'Concise (Get to the point)' },
                         { value: 'Balanced', label: 'Balanced' },
                         { value: 'Detailed (Long, thoughtful prose)', label: 'Detailed (Long, thoughtful prose)' }
                       ]}
                     />
                   </div>



                   <div>
                     <label className="block text-sm font-semibold text-sol-text-secondary mb-3">Therapeutic Focus Areas (Max 3)</label>
                     <div className="flex flex-wrap gap-3">
                       {FOCUS_AREAS.map(area => (
                         <button
                           key={area}
                           onClick={() => toggleFocus(area)}
                           className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                             tSettings.therapist_focus.includes(area)
                             ? 'bg-sol-primary text-white scale-105 shadow-sm'
                             : 'bg-sol-bg text-sol-text-secondary hover:border-sol-primary border border-transparent border-gray-200'
                           }`}
                         >
                           {area}
                         </button>
                       ))}
                     </div>
                   </div>

                   <div className="pt-6 border-t border-gray-100">
                     <button onClick={saveTherapistSettings} disabled={loading} className="btn-primary px-8">
                       {loading ? 'Saving...' : 'Update Sol'}
                     </button>
                   </div>

                   {/* Push notification toggle */}
                   <div style={{ marginTop: 24, padding: '24px 0 0', borderTop: '1px solid #F0EBE5' }}>
                     <label style={{ fontSize: 13, color: '#6B6560', fontWeight: 600,
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                    display: 'block', marginBottom: 12 }}>
                       Notifications
                     </label>
                     <div style={{
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'space-between',
                       padding: '16px 20px',
                       borderRadius: 14,
                       background: 'rgba(255,252,248,0.8)',
                       border: '1px solid #E8E3DD',
                     }}>
                       <div>
                         <div style={{ fontSize: 15, fontWeight: 500, color: '#1A1714' }}>
                           Push notifications
                         </div>
                         <div style={{ fontSize: 13, color: '#9E8E7E', marginTop: 2 }}>
                           Daily check-ins and session reminders
                         </div>
                       </div>
                       {permission === 'unsupported' ? (
                         <span style={{ fontSize: 12, color: '#9E8E7E' }}>Not supported</span>
                       ) : (
                         <button
                           onClick={subscribed ? unsubscribe : subscribe}
                           style={{
                             padding: '8px 18px',
                             borderRadius: 999,
                             border: 'none',
                             background: subscribed ? '#F0EBE5' : '#C96B2E',
                             color: subscribed ? '#9E8E7E' : 'white',
                             fontFamily: 'DM Sans, sans-serif',
                             fontSize: 13,
                             fontWeight: 500,
                             cursor: 'pointer',
                             transition: 'all 150ms',
                             flexShrink: 0,
                           }}
                         >
                           {subscribed ? 'Turn off' : 'Turn on'}
                         </button>
                       )}
                     </div>
                     {permission === 'denied' && (
                       <p style={{ fontSize: 12, color: '#C0392B', marginTop: 8 }}>
                         Notifications are blocked. Enable them in your browser settings.
                       </p>
                     )}
                   </div>
                   
                </div>
             </section>
           )}

           {activeTab === 'intake' && (
             <section className="animate-fade-in">
               <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
                 <p className="text-sol-text-secondary mb-8">
                   Review or update the answers you gave when you first joined. Modifying these helps Sol re-calibrate your baseline psychological profile.
                 </p>
                 
                 {!intakeData ? (
                   <p className="text-gray-400 italic">No intake data found.</p>
                 ) : (
                   <div className="space-y-6">
                     {Object.entries(intakeData).map(([key, value]) => (
                       <div key={key} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                         <p className="text-xs text-sol-text-secondary font-mono mb-1 uppercase tracking-wider">{key}</p>
                         <p className="text-sol-text-primary font-medium">{String(value)}</p>
                       </div>
                     ))}
                   </div>
                 )}

                 <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-500 italic">To fully retake the assessment, please contact support or create a new account.</p>
                 </div>
               </div>
             </section>
           )}

           {activeTab === 'redeem' && (
             <section className="animate-fade-in flex justify-center">
               <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6 w-full max-w-md">
                 <RedeemTab profile={profile} onRedeemed={refreshProfile} />
               </div>
             </section>
           )}
        </main>
      </div>
    </AppShell>
  );
}

function RedeemTab({ profile, onRedeemed }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  if (profile?.is_early_member) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>☀️</div>
        <div style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 22,
          fontWeight: 300,
          color: '#1A1714',
          marginBottom: 8,
        }}>
          Early Member #{String(profile.early_member_number).padStart(3, '0')}
        </div>
        <div style={{ fontSize: 14, color: '#9E8E7E' }}>
          Your card is active. Check the sidebar to view it.
        </div>
      </div>
    )
  }

  const handleRedeem = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    try {
      // Hardcoded explicit fetch since `api` uses different references
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/profile/redeem-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb-gjggujmxcmduleftuboi-auth-token') ? JSON.parse(localStorage.getItem('sb-gjggujmxcmduleftuboi-auth-token')).access_token : ''}`
        },
        body: JSON.stringify({ code: code.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail?.message || data.detail || 'Invalid code.')
      setSuccess(data)
      onRedeemed?.()
    } catch (err) {
      setError(err.message || 'Invalid code.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 52, marginBottom: 16,
                     animation: 'popIn 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
          ☀️
        </div>
        <div style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 24,
          fontWeight: 300,
          color: '#1A1714',
          marginBottom: 8,
        }}>You're in.</div>
        <div style={{ fontSize: 15, color: '#6B6560', marginBottom: 20 }}>
          Welcome, Early Member #{String(success.member_number).padStart(3, '0')}.
          Your card is waiting in the sidebar.
        </div>
        <div style={{
          padding: '10px 20px',
          borderRadius: 999,
          background: 'rgba(201,107,46,0.08)',
          border: '1px solid rgba(201,107,46,0.2)',
          display: 'inline-block',
          fontSize: 13,
          color: '#C96B2E',
          fontWeight: 500,
        }}>
          70 free messages · Unlimited memory · Early Member badge
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2 style={{
        fontFamily: 'Fraunces, serif',
        fontSize: 26,
        fontWeight: 300,
        marginBottom: 8,
        color: '#1A1714',
      }}>Got a code?</h2>
      <p style={{ fontSize: 14, color: '#6B6560', marginBottom: 28, lineHeight: 1.6 }}>
        If you received a Sol Early Accelerator code, enter it below
        to unlock your membership card and exclusive perks.
      </p>

      <div style={{ marginBottom: 16 }}>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="SOL-001-XXXXXXXX"
          onKeyDown={e => e.key === 'Enter' && handleRedeem()}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 14,
            border: `1.5px solid ${error ? '#C0392B' : '#E8E3DD'}`,
            background: 'rgba(255,252,248,0.8)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 16,
            letterSpacing: '0.06em',
            fontWeight: 500,
            color: '#1A1714',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 150ms',
          }}
          onFocus={e => { e.target.style.borderColor = '#C96B2E'; setError(null) }}
          onBlur={e => e.target.style.borderColor = error ? '#C0392B' : '#E8E3DD'}
        />
      </div>

      {error && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 10,
          background: 'rgba(192,57,43,0.08)',
          border: '1px solid rgba(192,57,43,0.2)',
          fontSize: 13,
          color: '#C0392B',
          marginBottom: 14,
        }}>{error}</div>
      )}

      <button
        onClick={handleRedeem}
        disabled={!code.trim() || loading}
        className="btn-primary"
        style={{
          width: '100%',
          padding: '14px',
          fontSize: 15,
          opacity: !code.trim() ? 0.5 : 1,
        }}
      >
        {loading ? 'Checking...' : 'Redeem code →'}
      </button>

      <p style={{ fontSize: 12, color: '#C8C3BD', marginTop: 14, textAlign: 'center' }}>
        Codes are single-use and tied to your account.
      </p>
    </div>
  )
}

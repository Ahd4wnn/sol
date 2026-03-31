import { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { AppShell } from '../components/layout/AppShell';

const FOCUS_AREAS = [
  "Emotional support", "Academic stress", "Relationship advice", 
  "Anxiety management", "Boundary setting", "Confidence building",
  "Depression coping", "Time management"
];

export default function Settings() {
  const { profile } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('therapist'); // 'therapist' | 'intake'
  const [intakeData, setIntakeData] = useState(null);

  const [tSettings, setTSettings] = useState({
    therapist_tone: 'Like a warm friend',
    response_length: 'Balanced',
    preferred_language: 'English',
    therapist_focus: []
  });

  useEffect(() => {
    if (profile?.therapist_settings) {
      setTSettings({
        therapist_tone: profile.therapist_settings.therapist_tone || 'Like a warm friend',
        response_length: profile.therapist_settings.response_length || 'Balanced',
        preferred_language: profile.therapist_settings.preferred_language || 'English',
        therapist_focus: profile.therapist_settings.therapist_focus || []
      });
    }

    const fetchIntake = async () => {
      try {
        const res = await api.get('/api/profile/me');
        if (res.data?.intake_responses) {
          setIntakeData(res.data.intake_responses);
        }
      } catch (e) {
        console.error("Failed to load intake answers", e);
      }
    };
    fetchIntake();
  }, [profile]);

  const saveTherapistSettings = async () => {
    setLoading(true);
    try {
      await api.patch('/api/profile/therapist-settings', tSettings);
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
           </div>

           {activeTab === 'therapist' && (
             <section className="space-y-8 animate-fade-in">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col gap-6">
                   <div>
                     <label className="block text-sm font-semibold text-sol-text-secondary mb-3">Tone & Style</label>
                     <select 
                       value={tSettings.therapist_tone}
                       onChange={e => setTSettings({...tSettings, therapist_tone: e.target.value})}
                       className="sol-input appearance-none bg-white"
                     >
                        <option>Like a warm friend</option>
                        <option>Direct and coaching-oriented</option>
                        <option>Deeply psychological/clinical</option>
                        <option>Gentle and unconditionally validating</option>
                     </select>
                   </div>
                   
                   <div>
                     <label className="block text-sm font-semibold text-sol-text-secondary mb-3">Response Length</label>
                     <select 
                       value={tSettings.response_length}
                       onChange={e => setTSettings({...tSettings, response_length: e.target.value})}
                       className="sol-input appearance-none bg-white"
                     >
                        <option>Concise (Get to the point)</option>
                        <option>Balanced</option>
                        <option>Detailed (Long, thoughtful prose)</option>
                     </select>
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
        </main>
      </div>
    </AppShell>
  );
}

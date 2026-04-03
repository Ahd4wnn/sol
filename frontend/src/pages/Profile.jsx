import { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { AppShell } from '../components/layout/AppShell';

export default function Profile() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  
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

           <section>
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

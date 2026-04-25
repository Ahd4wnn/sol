import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { api } from '../lib/axios';
import { AppShell } from '../components/layout/AppShell';

const MOODS = [
  { val: 'awful', icon: '😔', color: 'bg-red-50 text-red-600 border-red-200' },
  { val: 'rough', icon: '😕', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { val: 'okay', icon: '😐', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  { val: 'good', icon: '🙂', color: 'bg-green-50 text-green-600 border-green-200' },
  { val: 'great', icon: '😊', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' }
];

export default function NewSession() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [moodBefore, setMoodBefore] = useState('');
  const [moodWord, setMoodWord] = useState('');
  const [openingContext, setOpeningContext] = useState('');

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!moodBefore || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.post('/api/sessions/create', {
        title: "Therapy Session",
        mood_before: moodBefore,
        mood_word: moodWord,
        opening_context: openingContext
      });
      navigate(`/session/${res.data.id}`);
    } catch (err) {
      const code = err.response?.data?.detail?.code;
      if (code === 'SESSION_LIMIT_REACHED') {
        navigate('/upgrade');
        return;
      }
      console.error(err);
      setError('Failed to start session. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getStepContent = () => {
    switch(step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center max-w-lg mx-auto glass-heavy p-8 rounded-3xl w-full overflow-hidden"
          >
            <h2 className="font-display italic text-4xl mb-4 text-center text-sol-text-primary">How are you arriving?</h2>
            <p className="text-sol-text-secondary mb-12 text-center text-lg">Don't overthink it. Just a quick pulse check.</p>
            
            <div className="flex justify-center flex-wrap w-full gap-3 md:gap-4 mb-16">
              {MOODS.map(m => (
                <button
                  key={m.val}
                  onClick={() => { setMoodBefore(m.val); setTimeout(handleNext, 300); }}
                  className={`flex flex-col items-center p-3 md:p-4 rounded-3xl border-2 transition-transform ${
                    moodBefore === m.val ? `scale-110 ${m.color}` : 'border-transparent bg-sol-surface hover:scale-105 shadow-sm hover:shadow-md'
                  }`}
                >
                  <span className="text-3xl md:text-4xl">{m.icon}</span>
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center max-w-lg mx-auto glass-heavy p-8 rounded-3xl w-full overflow-hidden"
          >
            <h2 className="font-display italic text-3xl md:text-4xl mb-4 text-center">If you had to name that feeling in one word?</h2>
            <p className="text-sol-text-secondary mb-10 text-center">e.g. anxious, excited, numb, exhausted</p>
            
            <input 
              type="text" 
              value={moodWord} 
              onChange={e => setMoodWord(e.target.value)} 
              placeholder="Your word..." 
              className="sol-input text-2xl text-center py-6 mb-12 shadow-sm font-medium focus:ring-4 focus:ring-sol-primary/20"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && moodWord && handleNext()}
            />
            
            <div className="flex gap-4 w-full">
               <button onClick={handleBack} className="px-6 py-4 rounded-full font-medium text-sol-text-secondary hover:bg-gray-100 transition-colors">
                 Back
               </button>
               <button onClick={handleNext} className="flex-1 btn-mesh py-4 flex items-center justify-center gap-2">
                 Next <ArrowRight size={18} />
               </button>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center max-w-lg mx-auto glass-heavy p-8 rounded-3xl w-full overflow-hidden"
          >
            <h2 className="font-display italic text-3xl md:text-4xl mb-4 text-center">What's on your mind?</h2>
            <p className="text-sol-text-secondary mb-10 text-center">Sol will read this before you enter the room so you don't have to start from scratch.</p>
            
            <textarea 
              value={openingContext} 
              onChange={e => setOpeningContext(e.target.value)} 
              placeholder="I've been feeling incredibly stressed about my exams next week..." 
              className="sol-input h-48 resize-none py-6 mb-8 text-lg shadow-sm"
              autoFocus
            />

            {error && <p className="text-sol-error mb-4">{error}</p>}
            
            <div className="flex gap-4 w-full">
               <button onClick={handleBack} className="px-6 py-4 rounded-full font-medium text-sol-text-secondary hover:bg-gray-100 transition-colors">
                 Back
               </button>
               <button 
                onClick={handleSubmit} 
                className="flex-1 btn-mesh py-4 flex items-center justify-center gap-2"
                disabled={isSubmitting}
               >
                 {isSubmitting ? 'Starting...' : "Begin Session"} <ArrowRight size={18} />
               </button>
            </div>
          </motion.div>
        );
      default: return null;
    }
  };

  return (
    <AppShell>
      <div className="h-[calc(100vh-80px)] md:h-screen flex flex-col bg-sol-bg">
        {/* Top nav */}
        <nav className="h-20 flex items-center px-6 md:px-12 flex-none">
           <button onClick={() => navigate('/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/50 transition-colors text-sol-text-secondary">
             <ArrowLeft size={20} />
           </button>
           <div className="flex-1 text-center font-medium text-sm text-sol-text-secondary uppercase tracking-wider">
             Check In &mdash; Step {step}/3
           </div>
           <div className="w-10"></div>
        </nav>

        {/* Main flow */}
        <main className="flex-1 flex items-center justify-center p-6">
          <AnimatePresence mode="wait">
            {getStepContent()}
          </AnimatePresence>
        </main>
      </div>
    </AppShell>
  );
}

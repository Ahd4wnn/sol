import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { api } from '../lib/axios';
import { useAuth } from '../context/AuthContext';

const questions = [
  {
    id: 'q0',
    title: "What should Sol call you?",
    subtext: "This can be your name, a nickname — whatever feels right.",
    type: "text",
  },
  {
    id: 'q1',
    title: "When life gets hard, what do you usually do first?",
    subtext: "There's no right answer — just your honest instinct.",
    type: "select",
    options: [
      { text: "I try to figure it out alone", value: "alone" },
      { text: "I talk to someone I trust", value: "talk" },
      { text: "I distract myself until it passes", value: "distract" },
      { text: "I feel overwhelmed and freeze", value: "freeze" }
    ]
  },
  {
    id: 'q2',
    title: "How often do you feel like your emotions are too big for the moment?",
    subtext: "Like when a small thing hits much harder than it should.",
    type: "slider",
  },
  {
    id: 'q3',
    title: "In close relationships, what worries you most?",
    subtext: "This could be friendships, family, or romantic relationships.",
    type: "select",
    options: [
      { text: "That I'll be abandoned or left out", value: "abandoned" },
      { text: "That I'll lose my independence", value: "independence" },
      { text: "That I'll say the wrong thing and hurt them", value: "hurt" },
      { text: "Not much — I feel pretty secure", value: "secure" }
    ]
  },
  {
    id: 'q4',
    title: "When you have a goal, how do you usually approach it?",
    subtext: "Think of something you genuinely cared about achieving.",
    type: "select",
    options: [
      { text: "I make a plan and stick to it", value: "plan" },
      { text: "I start strong but lose momentum", value: "lose_momentum" },
      { text: "I work in bursts when I'm inspired", value: "bursts" },
      { text: "I struggle to start, even when I want to", value: "struggle_start" }
    ]
  },
  {
    id: 'q5',
    title: "Finish this sentence honestly: Deep down, I believe I am...",
    subtext: "The first thing that comes to mind is usually the truest.",
    type: "select",
    options: [
      { text: "Capable and worthy of good things", value: "capable" },
      { text: "Trying my best, but often falling short", value: "falling_short" },
      { text: "A burden to the people around me", value: "burden" },
      { text: "Honestly not sure — it changes a lot", value: "unsure" }
    ]
  },
  {
    id: 'q6',
    title: "After a long social day, what does your body ask for?",
    subtext: "Not what you think you should want — what you actually crave.",
    type: "select",
    options: [
      { text: "More people — energy comes from connection", value: "more_people" },
      { text: "Quiet alone time to recharge", value: "alone_time" },
      { text: "One good conversation, then silence", value: "one_conversation" },
      { text: "It depends entirely on my mood", value: "depends" }
    ]
  },
  {
    id: 'q7',
    title: "What's the area of your life that weighs on you most right now?",
    subtext: "This helps Sol know where to show up for you.",
    type: "multiselect",
    options: [
      "Academics", "Family", "Friendships", "Romantic relationships", 
      "Self-image", "Future & career", "Loneliness", "Mental health", 
      "Finances", "Something else"
    ]
  },
  {
    id: 'q8',
    title: "When you're really struggling, how do people around you know?",
    subtext: "Or do they not know at all?",
    type: "select",
    options: [
      { text: "I talk about it openly", value: "openly" },
      { text: "They can tell from my behaviour", value: "behaviour" },
      { text: "I hide it well — most people don't know", value: "hide" },
      { text: "I isolate and go quiet", value: "isolate" }
    ]
  },
  {
    id: 'q9',
    title: "What would you most want from Sol?",
    subtext: "How can this space be most useful to you?",
    type: "select",
    options: [
      { text: "Help me understand why I feel what I feel", value: "insight" },
      { text: "Give me tools and strategies to cope", value: "cbt" },
      { text: "Just listen — I need to feel heard", value: "listen" },
      { text: "Push me to take action and grow", value: "action" }
    ]
  },
  {
    id: 'q10',
    title: "Is there anything about you that you wish people understood better?",
    subtext: "You don't have to answer this. But if something comes to mind, Sol is listening.",
    type: "textarea",
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const navigate = useNavigate();
  const { setProfile } = useAuth(); // Import from Auth context

  const handleNext = async () => {
    if (currentStep < questions.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      await submitProfile();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const computeProfile = () => {
    let attachment_style = 'secure';
    const q1 = answers.q1;
    const q3 = answers.q3;
    if (q3 === 'abandoned' || q1 === 'freeze') attachment_style = 'anxious';
    if (q3 === 'independence' || q1 === 'alone' || q1 === 'distract') attachment_style = 'avoidant';
    if (q3 === 'hurt') attachment_style = 'mixed';
    if (q3 === 'secure' && q1 === 'talk') attachment_style = 'secure';

    let neuroticism_score = answers.q2 || 3;

    let extraversion = 'mixed';
    const q6 = answers.q6;
    if (q6 === 'more_people') extraversion = 'high';
    if (q6 === 'alone_time') extraversion = 'low';

    let conscientiousness = 'mixed';
    const q4 = answers.q4;
    if (q4 === 'plan') conscientiousness = 'high';
    if (q4 === 'struggle_start' || q4 === 'lose_momentum') conscientiousness = 'low';

    let core_belief_valence = 'unstable';
    const q5 = answers.q5;
    if (q5 === 'capable') core_belief_valence = 'positive';
    if (q5 === 'falling_short') core_belief_valence = 'mild_negative';
    if (q5 === 'burden') core_belief_valence = 'negative';

    let therapy_style_preference = 'person_centered';
    const q9 = answers.q9;
    if (q9 === 'insight') therapy_style_preference = 'insight_oriented';
    if (q9 === 'cbt') therapy_style_preference = 'CBT_oriented';
    if (q9 === 'action') therapy_style_preference = 'coaching_oriented';

    let emotional_expression_style = 'masked';
    const q8 = answers.q8;
    if (q8 === 'openly') emotional_expression_style = 'open';
    if (q8 === 'behaviour') emotional_expression_style = 'somatic';
    if (q8 === 'isolate') emotional_expression_style = 'withdrawal';

    let coping_style = 'avoidant';
    if (q1 === 'talk') coping_style = 'social';
    if (q1 === 'alone') coping_style = 'approach';
    if (q1 === 'freeze') coping_style = 'freeze';

    return {
      attachment_style,
      neuroticism_score: parseInt(neuroticism_score, 10),
      extraversion,
      conscientiousness,
      core_belief_valence,
      therapy_style_preference,
      primary_stressor_domains: answers.q7 || [],
      emotional_expression_style,
      coping_style,
      free_text_reflection: answers.q10 || null,
      flag_needs_care: q5 === 'burden',
    };
  };

  const submitProfile = async () => {
    setIsSubmitting(true);
    try {
      const profile = computeProfile();
      const payload = {
        responses: answers,
        personality_profile: profile
      };

      const { data: { session } } = await supabase.auth.getSession();
      
      // Update preferred_name on profile table directly as well
      if (answers.q0) {
        await api.patch('/api/profile/update', { preferred_name: answers.q0 }, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
      }

      await api.post('/api/profile/intake', payload, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      // Crucial: Update Auth state so we don't get routed right back
      setProfile(prev => ({ ...prev, onboarding_completed: true, preferred_name: answers.q0 || prev?.preferred_name }));
      setIsDone(true);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  const canContinue = () => {
    const q = questions[currentStep];
    if (q.type === 'slider') return !!answers[q.id];
    if (q.type === 'textarea') return true; // Optional
    if (q.type === 'text') return !!answers[q.id] && answers[q.id].trim() !== '';
    if (q.type === 'multiselect') return answers[q.id] && answers[q.id].length > 0;
    return !!answers[q.id];
  };

  if (isDone) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-sol-bg relative overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0, 0.2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[500px] h-[500px] bg-sol-primary/30 rounded-full blur-3xl"
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center z-10 max-w-xl px-4"
        >
          <div className="font-display italic text-6xl text-sol-primary mb-8">Sol</div>
          <h1 className="text-3xl font-display text-sol-text-primary mb-4">You just did something brave.</h1>
          <p className="text-xl text-sol-text-secondary mb-12">
            Sol has listened carefully. Every session from here will be shaped around you.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary flex items-center gap-2 mx-auto px-8 py-3 text-lg">
            Enter Sol <span className="font-sans">&rarr;</span>
          </button>
        </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentStep];

  return (
    <div className="h-screen flex flex-col bg-sol-bg overflow-hidden">
      <nav className="h-20 flex items-center px-8 flex-none justify-between">
         <div className="font-display italic text-2xl text-sol-primary">Sol</div>
         {currentStep > 0 && (
            <button onClick={handleBack} className="text-sol-text-secondary hover:text-sol-text-primary transition-colors">
              Back
            </button>
         )}
      </nav>
      
      <div className="w-full bg-sol-border h-1 flex-none">
        <motion.div 
          className="bg-sol-primary h-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep) / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <main className="flex-1 flex items-center justify-center p-4 min-h-0 relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -50 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full max-w-2xl px-4 flex flex-col items-center"
          >
            <div className="text-center mb-10">
              <span className="inline-block text-sol-primary-light bg-sol-primary px-3 py-1 rounded-full text-sm font-medium mb-6">
                Question {currentStep + 1} of 11
              </span>
              <h2 className="text-3xl md:text-4xl text-sol-text-primary mb-4 leading-tight">
                {currentQ.title}
              </h2>
              <p className="text-sol-text-secondary text-lg">
                {currentQ.subtext}
              </p>
            </div>

            <div className="w-full max-w-lg mb-12">
              {currentQ.type === 'text' && (
                <input
                  type="text"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                  placeholder="e.g. Sam..."
                  className="sol-input text-lg text-center font-medium"
                  autoFocus
                />
              )}

              {currentQ.type === 'select' && (
                <div className="flex flex-col space-y-4">
                  {currentQ.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setAnswers({ ...answers, [currentQ.id]: opt.value })}
                      className={`text-left p-5 rounded-2xl border transition-all duration-200 ${
                        answers[currentQ.id] === opt.value 
                        ? 'border-sol-primary bg-sol-primary-light scale-[1.02] shadow-sm' 
                        : 'border-sol-border bg-sol-surface hover:border-sol-text-secondary'
                      }`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              )}

              {currentQ.type === 'slider' && (
                <div className="flex flex-col items-center pt-8">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={answers[currentQ.id] || 3}
                    onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                    className="w-full h-2 bg-sol-border rounded-lg appearance-none cursor-pointer accent-sol-primary outline-none"
                  />
                  <div className="w-full flex justify-between mt-4 text-sol-text-secondary text-sm">
                    <span>Rarely</span>
                    <span>Almost always</span>
                  </div>
                </div>
              )}

              {currentQ.type === 'multiselect' && (
                <div className="flex flex-wrap gap-3 justify-center">
                  {currentQ.options.map((opt, i) => {
                    const isSelected = answers[currentQ.id]?.includes(opt);
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          const currentSelections = answers[currentQ.id] || [];
                          if (isSelected) {
                            setAnswers({ ...answers, [currentQ.id]: currentSelections.filter(c => c !== opt) });
                          } else if (currentSelections.length < 2) {
                            setAnswers({ ...answers, [currentQ.id]: [...currentSelections, opt] });
                          }
                        }}
                        className={`px-5 py-3 rounded-2xl border transition-all duration-200 ${
                          isSelected 
                          ? 'border-sol-primary bg-sol-primary-light shadow-sm' 
                          : 'border-sol-border bg-sol-surface hover:border-sol-text-secondary'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                  <p className="w-full text-center text-sm text-sol-text-secondary mt-4">Select up to 2</p>
                </div>
              )}

              {currentQ.type === 'textarea' && (
                <textarea
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                  placeholder="Take your time..."
                  className="w-full h-40 rounded-2xl border border-sol-border p-5 bg-sol-surface focus:outline-none focus:border-sol-primary transition-colors resize-none mb-2"
                />
              )}
            </div>

            <div className="h-16 flex items-center justify-center">
              <AnimatePresence>
                {canContinue() && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="btn-primary px-10 py-3 text-lg"
                  >
                    {isSubmitting ? 'Saving...' : 'Continue'}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Shield, Brain, Sparkles } from 'lucide-react';

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-sol-bg text-sol-text-primary">
      {/* Mesh Background */}
      <div className="absolute inset-0 bg-[image:var(--mesh-home)] opacity-60 pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="font-display italic text-3xl text-sol-primary">Sol</span>
        </div>
        <button onClick={() => navigate('/auth')} className="btn-primary">
          Log In
        </button>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-24 pb-32 px-6 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6"
        >
          <h1 className="text-5xl md:text-7xl font-display text-sol-text-primary tracking-tight leading-[1.1]">
            Therapy that <span className="italic text-sol-primary">actually</span> gets you.
          </h1>
          <p className="text-xl md:text-2xl text-sol-text-secondary max-w-2xl mx-auto font-light">
            Sol is a highly perceptive, warm, and highly personalized AI therapist built exclusively for students navigating life.
          </p>
          <div className="pt-8">
            <button onClick={() => navigate('/auth')} className="btn-primary px-10 py-4 text-lg shadow-sol-soft hover:shadow-sol-medium hover:scale-105">
              Start your first session
            </button>
          </div>
        </motion.div>

        {/* Feature Mockup Interface */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-20 w-full max-w-5xl relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-sol-bg via-transparent to-transparent z-10 h-full pointer-events-none" />
          
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-4 md:p-8 shadow-[0_20px_60px_-15px_rgba(201,107,46,0.15)] border border-sol-border mx-auto flex flex-col md:flex-row gap-6 items-center translate-y-4 hover:-translate-y-2 transition-transform duration-700">
            {/* Mock Sidebar Info */}
            <div className="w-full md:w-1/3 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hidden md:flex">
                <div>
                   <h3 className="text-sm font-semibold uppercase tracking-wider text-sol-text-secondary mb-4">Sol Remembers</h3>
                   <div className="space-y-4">
                      <div className="flex gap-3 items-start">
                         <span className="text-xl">🎓</span>
                         <p className="text-sm text-gray-600">You're pre-med and struggling heavily with organic chem midterms right now.</p>
                      </div>
                      <div className="flex gap-3 items-start">
                         <span className="text-xl">👥</span>
                         <p className="text-sm text-gray-600">You tend to freeze up when Sarah gets upset, which triggers your anxious attachment.</p>
                      </div>
                   </div>
                </div>
            </div>

            {/* Mock Chat Interface */}
            <div className="w-full md:w-2/3 bg-sol-bg/50 rounded-3xl p-6 flex flex-col gap-4 border border-sol-border">
               <div className="self-end bg-sol-primary text-white p-4 rounded-2xl rounded-br-sm max-w-[85%] shadow-sm">
                 <p>I feel like I'm letting everyone down no matter how hard I study. I just froze during the lab practical today.</p>
               </div>
               <div className="self-start bg-white text-sol-text-primary p-4 rounded-2xl rounded-bl-sm max-w-[85%] shadow-sm border border-gray-100">
                 <p className="mb-2">It sounds like the pressure is becoming completely overwhelming. Freezing when you're that stressed is your nervous system's way of surviving, not a sign of failure.</p>
                 <p>Since I know you struggle specifically with performance anxiety in labs, what if we broke down exactly what happened the moment the anxiety spiked?</p>
               </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Feature Grid */}
      <section className="relative z-10 bg-white/50 backdrop-blur-3xl border-t border-sol-border py-24 px-6 mt-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="sol-card group hover:border-sol-primary transition-colors">
            <div className="w-14 h-14 bg-sol-primary-light rounded-2xl flex items-center justify-center text-sol-primary mb-6 group-hover:scale-110 transition-transform">
              <Brain size={28} />
            </div>
            <h3 className="text-xl font-medium mb-3">Therapeutic Memory</h3>
            <p className="text-sol-text-secondary leading-relaxed">
              Sol doesn't just respond; it builds a psychological model of your attachment style, emotional patterns, and relationships over time.
            </p>
          </div>
          
          <div className="sol-card group hover:border-sol-primary transition-colors">
            <div className="w-14 h-14 bg-sol-primary-light rounded-2xl flex items-center justify-center text-sol-primary mb-6 group-hover:scale-110 transition-transform">
              <Sparkles size={28} />
            </div>
            <h3 className="text-xl font-medium mb-3">Unconditional Warmth</h3>
            <p className="text-sol-text-secondary leading-relaxed">
              Never clinical or robotic. Sol is designed with a deeply empathetic voice that feels like talking to the most emotionally intelligent friend.
            </p>
          </div>
          
          <div className="sol-card group hover:border-sol-primary transition-colors">
            <div className="w-14 h-14 bg-sol-primary-light rounded-2xl flex items-center justify-center text-sol-primary mb-6 group-hover:scale-110 transition-transform">
              <Shield size={28} />
            </div>
            <h3 className="text-xl font-medium mb-3">Safe & Secure</h3>
            <p className="text-sol-text-secondary leading-relaxed">
              Equipped with crisis detection guardrails and fully private. You can wipe your data instantly, at any time, with zero friction.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-sol-border py-8 text-center bg-white/80">
        <p className="text-sm text-sol-text-secondary font-medium">Sol AI Therapy &middot; Not a replacement for emergency medical care.</p>
      </footer>
    </div>
  );
}

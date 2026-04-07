import { useState, useEffect } from 'react';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Play, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { api } from '../lib/axios';
import { AppShell } from '../components/layout/AppShell';
import { Clock } from 'lucide-react'
import { UpgradeModal, useUpgradeModal } from '../components/upgrade/UpgradeModal'
import { DailyWidget } from '../components/dashboard/DailyWidget'

const SUBTEXTS = [
  "Take a slow, deep breath.",
  "Sol is ready to listen holding no judgment.",
  "You've survived 100% of your hardest days.",
  "There is no rush. Start when you're ready."
];

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subtextIndex, setSubtextIndex] = useState(0);
  const [billingStatus, setBillingStatus] = useState(null);

  useEffect(() => {
    api.get('/api/billing/status')
      .then(r => setBillingStatus(r.data))
      .catch(() => {})  // non-fatal
  }, []);

  const isPro = billingStatus?.is_pro || false;
  const messagesUsed = billingStatus?.messages_used || 0;
  const messagesLimit = billingStatus?.messages_limit || 20;
  const messagesRemaining = messagesLimit - messagesUsed;

  const { isOpen: upgradeModalOpen, close: closeUpgradeModal } = useUpgradeModal(isPro);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsRes] = await Promise.all([
          api.get('/api/sessions/list')
        ]);
        setSessions(sessionsRes.data || []);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtextIndex(prev => (prev + 1) % SUBTEXTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const name = profile?.preferred_name || profile?.full_name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 overflow-y-auto w-full" style={{ background: 'transparent' }}>
          <div className="max-w-6xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-32">
            <DashboardSkeleton />
          </div>
        </div>
      </AppShell>
    );
  }

  // Calculate stats
  const totalSessions = sessions.length;
  const recentSessions = sessions.slice(0, 5);

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto w-full" style={{ background: 'transparent' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-32">
          {/* Ambient Greeting Block */}
          <div style={{
            position: 'relative',
            padding: '60px 48px 40px',
            marginLeft: '-48px',
            marginRight: '-48px',
          }}>
            {/* Ambient glow blob */}
            <div style={{
              position: 'absolute',
              top: -60,
              left: -80,
              width: 500,
              height: 400,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(201,107,46,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }} />
            <div style={{ position: 'relative', zIndex: 1 }} className="mb-16 md:mb-24 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 h-full">
              <div className="space-y-4 max-w-2xl">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                  className="text-4xl md:text-6xl font-display text-sol-text-primary tracking-tight"
                >
                  {getTimeGreeting()}, <span className="italic text-sol-primary">{name}.</span>
                </motion.h1>
                <div className="h-8 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={subtextIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5 }}
                      className="text-lg md:text-xl text-sol-text-secondary font-light"
                    >
                      {SUBTEXTS[subtextIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              <motion.button
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                onClick={() => navigate('/session/new')}
                className="btn-mesh flex items-center justify-center gap-3"
                style={{ padding: '14px 32px', fontSize: 16 }}
              >
                <Play size={20} fill="currentColor" />
                Start Session
              </motion.button>
            </div>
          </div>

          {/* Upgrade Banner */}
          {!isPro && billingStatus && (
            <div style={{
              margin: '0 0 24px',
              padding: '16px 20px',
              borderRadius: 16,
              background: 'rgba(201,107,46,0.06)',
              border: '1px solid rgba(201,107,46,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Progress bar for messages */}
                <div style={{ position: 'relative' }}>
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    {/* Background circle */}
                    <circle cx="22" cy="22" r="18"
                      fill="none" stroke="#F0EBE5" strokeWidth="3" />
                    {/* Progress circle */}
                    <circle cx="22" cy="22" r="18"
                      fill="none"
                      stroke={messagesRemaining <= 5 ? '#C0392B' : '#C96B2E'}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 18}`}
                      strokeDashoffset={`${2 * Math.PI * 18 * (1 - messagesUsed / messagesLimit)}`}
                      transform="rotate(-90 22 22)"
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                    {/* Count in center */}
                    <text x="22" y="27" textAnchor="middle"
                      style={{
                        fontSize: 13,
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: 600,
                        fill: messagesRemaining <= 5 ? '#C0392B' : '#C96B2E',
                      }}>
                      {messagesRemaining}
                    </text>
                  </svg>
                </div>

                <div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#1A1714',
                  }}>
                    {messagesRemaining > 0
                      ? `${messagesRemaining} free messages remaining`
                      : 'Free messages used up'}
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 13,
                    color: '#9E8E7E',
                    marginTop: 2,
                  }}>
                    {messagesRemaining > 5
                      ? 'Upgrade anytime for unlimited sessions'
                      : messagesRemaining > 0
                        ? 'Running low — upgrade to keep going'
                        : 'Upgrade to continue talking to Sol'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/upgrade')}
                style={{
                  padding: '10px 20px',
                  borderRadius: 999,
                  border: '1.5px solid #C96B2E',
                  background: 'transparent',
                  color: '#C96B2E',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 150ms ease',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#C96B2E'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#C96B2E'
                }}
              >
                Upgrade to Pro →
              </button>
            </div>
          )}

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16"
          >
            <div className="glass-card p-6 flex flex-col transition-colors" style={{ borderLeft: '3px solid rgba(201,107,46,0.4)' }}>
              <div className="text-sol-primary mb-3"><TrendingUp size={24} /></div>
              <p className="text-3xl font-display mb-1">{totalSessions}</p>
              <p className="text-sm font-medium text-sol-text-secondary">Sessions total</p>
            </div>
            <div className="glass-card p-6 flex flex-col transition-colors" style={{ borderLeft: '3px solid rgba(61,122,95,0.4)' }}>
              <div className="text-sol-primary mb-3"><Calendar size={24} /></div>
              <p className="text-3xl font-display mb-1">{sessions.filter(s => new Date(s.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</p>
              <p className="text-sm font-medium text-sol-text-secondary">This week</p>
            </div>
            <div className="glass-card p-6 flex flex-col transition-colors" style={{ borderLeft: '3px solid rgba(107,101,96,0.3)' }}>
              <div className="text-sol-text-secondary mb-3"><Clock size={24} /></div>
              <p className="text-xl font-medium mb-1 truncate text-sol-text-primary">
                {sessions[0] ? new Date(sessions[0].created_at).toLocaleDateString() : 'Never'}
              </p>
              <p className="text-sm text-sol-text-secondary">Last session</p>
            </div>
          </motion.div>

          {/* Daily Widget */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <DailyWidget preferredName={name} onStartSession={() => navigate('/session/new')} />
          </motion.div>

          {/* Horizontal Recent Sessions */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-sol-text-primary">Recent Sessions</h3>
              {sessions.length > 5 && (
                <button onClick={() => navigate('/sessions')} className="text-sm font-medium text-sol-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight size={14} />
                </button>
              )}
            </div>

            {sessions.length === 0 ? (
              <div className="bg-white/40 backdrop-blur-sm rounded-3xl border border-dashed border-sol-primary/30 p-12 text-center text-sol-text-secondary">
                No sessions yet. Jump in when you're ready.
              </div>
            ) : (
              <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
                {recentSessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => navigate(`/session/${session.id}`)}
                    className="snap-start flex-none w-[280px] md:w-[320px] glass-card p-6 cursor-pointer group hover:border-sol-primary/20"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-sol-text-secondary mb-3">
                      {new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <h4 className="text-lg font-medium text-sol-text-primary mb-2 line-clamp-1 group-hover:text-sol-primary transition-colors">
                      {session.title || 'Therapy Session'}
                    </h4>
                    <p className="text-sm text-sol-text-secondary line-clamp-3 mb-4 h-[60px]">
                      {session.summary || 'A session is waiting to be summarised. Click to view the raw conversation.'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100/50 px-2 py-1 rounded-md">
                        {session.message_count || 0} messages
                      </span>
                      {(session.mood_word || session.mood_before) && (
                        <span className="text-xs font-medium text-sol-primary bg-sol-primary-light/50 px-2 py-1 rounded-md">
                          {session.mood_word || session.mood_before}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
      <UpgradeModal isOpen={upgradeModalOpen} onClose={closeUpgradeModal} />
    </AppShell>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../hooks/useSession';
import { useChat } from '../hooks/useChat';
import { useToast } from '../components/ui/Toast';
import MessageBubble from '../components/chat/MessageBubble';
import MoodPicker from '../components/ui/MoodPicker';
import { ChatSkeleton } from '../components/ui/Skeleton';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';

const MOOD_EMOJIS = {
  awful: '😔',
  rough: '😕',
  okay: '😐',
  good: '🙂',
  great: '😊'
};

export default function Session() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { addToast } = useToast();
  const { session, messages: dbMessages, setMessages, loading, error } = useSession(id);
  const { sendMessage, isStreaming, error: chatError } = useChat(id, setMessages);
  const [input, setInput] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);
  const [endMood, setEndMood] = useState(null);
  const [isEnding, setIsEnding] = useState(false);
  const [billingStatus, setBillingStatus] = useState(null);

  const bottomRef = useRef(null);
  const chatContainerRef = useRef(null);
  const userHasScrolledUp = useRef(false);
  const lastScrollTop = useRef(0);
  const inputRef = useRef(null);
  const hasAutoStarted = useRef(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop < lastScrollTop.current) {
      userHasScrolledUp.current = true;
    }
    lastScrollTop.current = scrollTop;

    if (scrollHeight - scrollTop - clientHeight < 60) {
      userHasScrolledUp.current = false;
    }
  };

  // Lock AppShell's scrollable <main> so the Session manages its own scroll
  useEffect(() => {
    const appShellMain = document.querySelector('main');
    if (appShellMain) {
      const prevOverflow = appShellMain.style.overflow;
      const prevPadding = appShellMain.style.paddingBottom;
      appShellMain.style.overflow = 'hidden';
      appShellMain.style.paddingBottom = '0';
      return () => {
        appShellMain.style.overflow = prevOverflow;
        appShellMain.style.paddingBottom = prevPadding;
      };
    }
  }, []);

  useEffect(() => {
    api.get('/api/billing/status').then(r => setBillingStatus(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (isStreaming || !userHasScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dbMessages, isStreaming]);

  useEffect(() => {
    if (!isStreaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isStreaming]);

  useEffect(() => {
    if (
      !loading &&
      session &&
      !error &&
      dbMessages.length === 0 &&
      session.opening_context &&
      !hasAutoStarted.current
    ) {
      hasAutoStarted.current = true;
      sendMessage(session.opening_context);
    }
  }, [loading, session, error, dbMessages.length]);

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;
    userHasScrolledUp.current = false;
    sendMessage(input);
    setInput('');
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndSubmit = async () => {
    if (!endMood) return;
    setIsEnding(true);
    try {
      await api.patch(`/api/sessions/${id}`, { mood_after: endMood });
      addToast('Session saved. Sol will remember.', 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast('Failed to save session.', 'error');
      setIsEnding(false);
    }
  };

  const getEmptyStateText = () => {
    const pref = profile?.personality_profile?.therapy_style_preference;
    if (pref === 'person_centered') return "Start wherever feels right.";
    if (pref === 'CBT_oriented') return "What would you like to work through today?";
    if (pref === 'coaching_oriented') return "What are we working on today?";
    return "Take your time. There's no right way to begin.";
  };

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <ChatSkeleton />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-medium mb-4">Something went wrong</h2>
          <p className="text-sol-text-secondary mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="sol-button-primary max-w-xs px-8"
          >
            Return Home
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="h-[calc(100vh-80px)] md:h-screen flex flex-col overflow-hidden">

        {/* Top Bar */}
        <header className="flex-none h-16 bg-white/80 backdrop-blur-md border-b border-sol-border px-4 md:px-8 flex items-center justify-between z-10 w-full shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-sol-text-secondary hover:text-sol-text-primary shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="overflow-hidden">
              <h2 className="font-medium text-sol-text-primary truncate">
                {session?.title || 'Session'}
              </h2>
              {session?.mood_before && (
                <span className="text-[11px] text-sol-text-secondary flex items-center gap-1">
                  Started feeling {MOOD_EMOJIS[session.mood_before] || session.mood_before}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {billingStatus && billingStatus.is_pro !== true && (
              <span style={{
                fontSize: 12,
                color: billingStatus.messages_remaining <= 5 ? '#C0392B' : '#9E8E7E',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                {billingStatus.messages_remaining} messages left
                {billingStatus.messages_remaining <= 5 && ' — '}
                {billingStatus.messages_remaining <= 5 && (
                  <a href="/upgrade" style={{ color: '#C96B2E', textDecoration: 'underline' }}>
                    Upgrade
                  </a>
                )}
              </span>
            )}
            <button
              onClick={() => setShowEndModal(true)}
              className="px-4 py-1.5 text-sm font-medium text-sol-primary border border-sol-primary rounded-full hover:bg-sol-primary hover:text-white transition-colors whitespace-nowrap"
            >
              End Session
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <main
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 md:px-8 pt-8 pb-32 md:pb-36"
        >
          <div className="max-w-3xl mx-auto flex flex-col min-h-full justify-end">

            {dbMessages.length === 0 && !isStreaming && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 my-auto">
                <div className="w-14 h-14 rounded-full bg-sol-primary flex items-center justify-center text-white font-display italic text-2xl mb-6 shadow-sol-soft">
                  S
                </div>
                <h2 className="text-3xl font-display italic text-sol-text-primary mb-3">
                  Sol is here.
                </h2>
                <p className="text-sol-text-secondary">{getEmptyStateText()}</p>
              </div>
            )}

            <div className="flex flex-col w-full gap-1">
              {dbMessages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.created_at}
                  isStreaming={isStreaming && idx === dbMessages.length - 1 && msg.role === 'assistant'}
                />
              ))}
              <div ref={bottomRef} className="h-4 w-full" />
            </div>
          </div>
        </main>

        {/* Input Area */}
        <footer className="fixed bottom-[64px] md:bottom-0 w-[100vw] md:w-[calc(100vw-240px)] bg-white border-t border-sol-border px-4 py-4 md:px-8 z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="max-w-3xl mx-auto relative flex items-end gap-3 bg-sol-bg border border-sol-border rounded-[24px] rounded-br-[12px] p-2 pr-3 focus-within:border-sol-primary/50 focus-within:ring-1 focus-within:ring-sol-primary/50 transition-all shadow-sm">
            <textarea
              ref={inputRef}
              id="chat-input"
              autoFocus
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Say anything..."
              className="w-full bg-transparent border-none py-3 px-4 text-[15px] text-sol-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-0 resize-none min-h-[48px] max-h-[120px]"
              rows={1}
              maxLength={2000}
              disabled={isStreaming}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className={`flex-none w-11 h-11 mb-0.5 flex items-center justify-center rounded-full bg-sol-primary text-white transition-all
                ${!input.trim() || isStreaming
                  ? 'opacity-50 cursor-not-allowed scale-95'
                  : 'hover:bg-[#b05c24] hover:scale-[1.05] shadow-sm'
                }`}
            >
              {isStreaming ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={18} className="ml-0.5" />
              )}
            </button>
          </div>
          <div className="text-center mt-2 h-4 max-w-3xl mx-auto">
            {chatError && (
              <span className="text-[11px] text-red-500 font-medium">{chatError}</span>
            )}
          </div>
        </footer>

        {/* End Session Modal */}
        <AnimatePresence>
          {showEndModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-sol-text-primary/30 backdrop-blur-sm"
                onClick={() => setShowEndModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-xl p-8"
              >
                <h3 className="text-2xl font-display italic text-center mb-2">
                  How are you leaving?
                </h3>
                <p className="text-center text-sol-text-secondary mb-8 text-sm">
                  Takes a quick second to reflect on the session.
                </p>

                <MoodPicker value={endMood} onChange={setEndMood} size="lg" />

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setShowEndModal(false)}
                    className="flex-1 px-4 py-3 rounded-full font-medium text-sol-text-secondary hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEndSubmit}
                    disabled={!endMood || isEnding}
                    className={`flex-1 px-4 py-3 rounded-full font-medium bg-sol-primary text-white transition-colors
                      ${!endMood || isEnding ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#b05c24]'}`}
                  >
                    {isEnding ? 'Ending...' : 'End Session'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
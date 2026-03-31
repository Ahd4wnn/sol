import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import api from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchProfile = async (currentSession) => {
      try {
        const res = await api.get('/api/profile/me', {
          headers: { Authorization: `Bearer ${currentSession.access_token}` }
        });
        if (active && res.data?.profile) {
          setProfile(res.data.profile);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };

    const initialize = async () => {
      try {
        const { data: { session: initSession } } = await supabase.auth.getSession();
        if (initSession && active) {
          api.defaults.headers.common['Authorization'] = `Bearer ${initSession.access_token}`;
          setSession(initSession);
          setUser(initSession.user);
          await fetchProfile(initSession);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!active) return;
      if (_event === 'INITIAL_SESSION') return; // Prevent concurrent fetchProfile locking

      if (newSession?.access_token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${newSession.access_token}`;
      } else {
        delete api.defaults.headers.common['Authorization'];
      }
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession) {
        await fetchProfile(newSession);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Failsafe to guarantee the app boots even if Supabase network hangs
    const safetyTimer = setTimeout(() => {
      if (active) {
        console.warn('[AuthContext] Failsafe triggered: Loading bypassed after 5s');
        setLoading(false);
      }
    }, 5000);

    return () => {
      active = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signUp = (email, password) => supabase.auth.signUp({ email, password });
  const signOut = () => supabase.auth.signOut();
  const sendMagicLink = (email) => supabase.auth.signInWithOtp({ email });

  const value = {
    session,
    user,
    profile,
    setProfile,
    signIn,
    signUp,
    signOut,
    sendMagicLink,
    loading
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#C96B2E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'Fraunces, serif', fontSize: 22, fontStyle: 'italic', animation: 'pulse 2s ease-in-out infinite' }}>S</div>
        <p style={{ color: '#6B6560', fontSize: 14 }}>Loading Sol...</p>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.95); } }`}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

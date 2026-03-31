import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Auth() {
  const [activeTab, setActiveTab] = useState('Sign In');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { signIn, signUp, sendMagicLink } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (activeTab === 'Sign Up') {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setMessage('Check your email to confirm your account.');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email first to send a magic link.');
      return;
    }
    setError('');
    setMessage('');
    try {
      const { error } = await sendMagicLink(email);
      if (error) throw error;
      setMessage('Magic link sent to your email.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--mesh-auth)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-heavy" 
        style={{
          width: '100%',
          maxWidth: 400,
          padding: '48px 40px',
          borderRadius: 28,
        }}
      >
        {/* Sol wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontSize: 48,
            fontWeight: 300,
            color: '#1A1714',
          }}>Sol</span>
        </div>

        {/* Toggle: Sign In / Sign Up */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.06)',
          borderRadius: 999,
          padding: 4,
          marginBottom: 32,
        }}>
          {['Sign In', 'Sign Up'].map(label => (
            <button type="button" key={label} style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 999,
              border: 'none',
              background: activeTab === label ? 'white' : 'transparent',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14,
              fontWeight: activeTab === label ? 500 : 400,
              color: activeTab === label ? '#1A1714' : '#6B6560',
              cursor: 'pointer',
              transition: 'all 150ms',
              boxShadow: activeTab === label ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }} onClick={() => {
              setActiveTab(label);
              setError('');
              setMessage('');
            }}>{label}</button>
          ))}
        </div>

        {error && <div className="p-3 mb-4 bg-sol-error/10 text-sol-error rounded-xl text-sm text-center">{error}</div>}
        {message && <div className="p-3 mb-4 bg-sol-success/10 text-sol-success rounded-xl text-sm text-center">{message}</div>}

        <form onSubmit={handleSubmit}>
          {/* Email input */}
          <div style={{ marginBottom: 20 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(0,0,0,0.15)',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 15,
                color: '#1A1714',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 200ms',
              }}
              onFocus={e => e.target.style.borderBottomColor = '#C96B2E'}
              onBlur={e => e.target.style.borderBottomColor = 'rgba(0,0,0,0.15)'}
              required
            />
          </div>

          {/* Password input */}
          <div style={{ marginBottom: 24 }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(0,0,0,0.15)',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 15,
                color: '#1A1714',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 200ms',
              }}
              onFocus={e => e.target.style.borderBottomColor = '#C96B2E'}
              onBlur={e => e.target.style.borderBottomColor = 'rgba(0,0,0,0.15)'}
              required
            />
          </div>
          
          {/* Submit button */}
          <button type="submit" className="btn-mesh" style={{
            width: '100%',
            padding: '14px',
            fontSize: 15,
            marginTop: 8,
          }}>
            {activeTab === 'Sign In' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Magic link option */}
        <p style={{
          textAlign: 'center',
          marginTop: 20,
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 13,
          color: '#6B6560',
        }}>
          or{' '}
          <span style={{ color: '#C96B2E', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={handleMagicLink}>
            send me a sign-in link
          </span>
        </p>
      </motion.div>
    </div>
  );
}

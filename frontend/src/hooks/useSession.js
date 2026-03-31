import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';

export function useSession(sessionId) {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/sessions/${sessionId}`);
      setSession(res.data);
      // Only set messages on first fetch — never overwrite optimistic updates
      if (!hasFetched.current) {
        setMessages(res.data.messages || []);
        hasFetched.current = true;
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    hasFetched.current = false; // reset on session change
    fetchSession();
  }, [sessionId]); // ← sessionId only, not fetchSession

  // Explicit refetch that DOES overwrite messages (used after session end)
  const refetch = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await api.get(`/api/sessions/${sessionId}`);
      setSession(res.data);
      setMessages(res.data.messages || []);
    } catch (err) {
      logger.error(err);
    }
  }, [sessionId]);

  return { session, messages, setMessages, loading, error, refetch };
}
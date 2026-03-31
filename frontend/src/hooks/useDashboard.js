import { useState, useEffect } from 'react';
import api from '../lib/api';

export function useDashboard() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [memoryNotes, setMemoryNotes] = useState([]);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const [sessionsRes, memoryRes] = await Promise.all([
          api.get('/api/sessions/list'),
          api.get('/api/memory/notes')
        ]);

        if (active) {
          setSessions(sessionsRes.data || []);
          setMemoryNotes(memoryRes.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchData();

    return () => { active = false; };
  }, []);

  return { sessions, memoryNotes, loading };
}

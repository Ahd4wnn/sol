import { useState } from 'react';
import { supabase } from '../lib/supabase';


export function useChat(sessionId, setMessages) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async (content) => {
    if (!content.trim() || isStreaming) return;

    setError(null);

    // Get token internally — never rely on caller passing it
    let token;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    } catch (e) {
      console.error('[useChat] Failed to get session:', e);
    }

    if (!token) {
      setError('Not authenticated. Please sign in again.');
      return;
    }

    const userMsg = {
      id: `temp-u-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };

    const astMsg = {
      id: `temp-a-${Date.now()}`,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg, astMsg]);
    setIsStreaming(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/messages/send-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ session_id: sessionId, content })
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData?.detail?.message ||
          errData?.message ||
          `Server error: ${res.status}`
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let finalContent = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete last line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.slice(5).trim(); // strip "data:" prefix
          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            // Handle server error chunk
            if (data.error) {
              setError(data.message || 'Something went wrong. Please try again.');
              setMessages(prev => prev.filter(m => m.id !== astMsg.id));
              setIsStreaming(false);
              return; // ← stop processing, don't throw
            }

            if (data.done === true) {
              finalContent = data.full_content || finalContent;
              // Set final content on the assistant message
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.id === astMsg.id) {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: finalContent
                  };
                }
                return updated;
              });
            } else if (data.delta) {
              finalContent += data.delta;
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.id === astMsg.id) {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: updated[lastIdx].content + data.delta
                  };
                }
                return updated;
              });
            }
          } catch (parseErr) {
            // Only log if it looks like it should have been valid JSON
            if (dataStr.startsWith('{')) {
              console.warn('[useChat] Failed to parse SSE chunk:', dataStr, parseErr);
            }
          }
        }
      }

      // Final safety net — if stream ended without a done:true chunk
      if (finalContent) {
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.id === astMsg.id && !updated[lastIdx].content) {
            updated[lastIdx] = { ...updated[lastIdx], content: finalContent };
          }
          return updated;
        });
      }

    } catch (err) {
      console.error('[useChat] sendMessage failed:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      // Remove the empty assistant placeholder on error
      setMessages(prev => prev.filter(m => m.id !== astMsg.id));
    } finally {
      setIsStreaming(false);
    }
  };

  return { sendMessage, isStreaming, error };
}
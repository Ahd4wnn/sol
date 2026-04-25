import { useState, useRef, useEffect } from 'react';
import { SessionListSkeleton } from '../components/ui/Skeleton';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { api } from '../lib/axios';
import { AppShell } from '../components/layout/AppShell';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get('/api/sessions/list');
        setSessions(res.data || []);
      } catch (err) {
        console.error("Failed to fetch sessions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/sessions/${deleteTarget}`);
      setSessions(prev => prev.filter(s => s.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell>
      <div className="flex-1 bg-sol-bg w-full">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-sol-border px-8 flex items-center sticky top-0 z-10">
           <h1 className="page-title text-2xl font-display text-sol-text-primary">All Sessions</h1>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-12">
           {loading ? (
             <SessionListSkeleton />
           ) : sessions.length === 0 ? (
             <div className="text-center py-20 text-sol-text-secondary">
               <p>No sessions yet.</p>
             </div>
           ) : (
             <div className="relative border-l-2 border-sol-border ml-4 md:ml-8 space-y-12">
               {sessions.map((session, i) => (
                 <motion.div 
                   key={session.id}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.05 }}
                   className="relative pl-8 md:pl-12 group cursor-pointer"
                   onClick={() => navigate(`/session/${session.id}`)}
                 >
                   {/* Node */}
                   <div className="absolute left-[-9px] top-2 w-4 h-4 rounded-full bg-sol-primary-light border-2 border-sol-primary group-hover:scale-125 transition-transform shadow-[0_0_8px_rgba(201,107,46,0.3)]" />
                   
                   <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                         <div>
                           <p className="text-sm font-medium text-sol-text-secondary uppercase tracking-wider mb-1">
                             {new Date(session.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                           </p>
                           <h3 className="text-xl font-medium text-sol-text-primary group-hover:text-sol-primary transition-colors">
                             {session.title || 'Therapy Session'}
                           </h3>
                         </div>
                         <div className="flex gap-2">
                           {(session.mood_word || session.mood_before) && (
                              <span className="text-sm font-medium text-sol-primary bg-sol-primary-light px-3 py-1 rounded-full">
                                {session.mood_word || session.mood_before}
                              </span>
                           )}
                         </div>
                      </div>
                      
                      <p className="text-sol-text-secondary leading-relaxed mb-4">
                        {session.summary || 'A session is waiting to be summarised. Let Sol review this conversation.'}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                          <MessageCircle size={16} />
                          <span>{session.message_count || 0} messages exchanged</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-sm text-gray-400 hover:text-red-500 font-medium"
                          style={{ fontFamily: 'DM Sans, sans-serif' }}
                        >
                          Delete
                        </button>
                      </div>
                   </div>
                 </motion.div>
               ))}
             </div>
           )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sol-text-primary/30 backdrop-blur-sm"
              onClick={() => !isDeleting && setDeleteTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                <span className="text-red-500 text-xl">🗑</span>
              </div>
              <h3 className="text-xl font-display italic text-sol-text-primary mb-2">
                Delete this session?
              </h3>
              <p className="text-sol-text-secondary text-sm mb-6">
                This will permanently remove the session and all its messages. Your memories from this session will be kept.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-full font-medium text-sol-text-secondary hover:bg-gray-50 border border-gray-200 transition-colors"
                >
                  Keep it
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-full font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

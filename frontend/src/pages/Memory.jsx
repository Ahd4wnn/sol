import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, BookOpen, HeartPulse, BrainCircuit, Activity } from 'lucide-react';
import { api } from '../lib/axios';
import { AppShell } from '../components/layout/AppShell';

const TABS = [
  { id: 'all', label: 'All Notes', icon: BrainCircuit },
  { id: 'relationship', label: 'People', icon: Users },
  { id: 'journal', label: 'Journals', icon: BookOpen },
  { id: 'mood_snapshot', label: 'Moods', icon: HeartPulse },
  { id: 'coping', label: 'Coping', icon: Activity }
];

export default function Memory() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await api.get('/api/memory/notes');
        setNotes(res.data || []);
      } catch (err) {
        console.error("Failed to fetch memory notes", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      // Exclude crisis flags from memory UI
      if (note.tags?.includes('crisis_flag')) return false;
      
      const matchSearch = note.note.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (activeTab === 'all') return true;
      if (activeTab === 'journal') return note.tags?.includes('journal');
      if (activeTab === 'mood_snapshot') return note.tags?.includes('mood_snapshot');
      if (activeTab === 'coping') return note.tags?.includes('coping');
      if (activeTab === 'relationship') return note.tags?.includes('relationship');
      return true;
    });
  }, [notes, activeTab, search]);

  return (
    <AppShell>
      <div className="flex-1 bg-sol-bg w-full overflow-y-auto">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-sol-border px-6 md:px-8 flex items-center justify-between sticky top-0 z-10">
           <h1 className="text-2xl font-display text-sol-text-primary">Memory</h1>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8 md:py-12">
           <div className="mb-12">
             <h2 className="text-3xl md:text-4xl font-display text-sol-text-primary mb-4">What Sol remembers.</h2>
             <p className="text-lg text-sol-text-secondary max-w-2xl">
               Everything Sol learns about you is safely stored here. It uses these notes to contextualize future sessions and understand your patterns.
             </p>
           </div>

           {/* Search & Tabs */}
           <div className="flex flex-col md:flex-row gap-6 mb-12 items-start md:items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search memories..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white border border-sol-border rounded-full py-3 pl-11 pr-4 focus:outline-none focus:border-sol-primary shadow-sm"
                />
              </div>
              
              <div className="flex overflow-x-auto w-full md:w-auto hide-scrollbar -mx-6 px-6 md:mx-0 md:px-0 gap-2">
                 {TABS.map(tab => {
                   const Icon = tab.icon;
                   const isActive = activeTab === tab.id;
                   return (
                     <button
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id)}
                       className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-colors ${
                         isActive 
                         ? 'bg-sol-primary text-white shadow-sm' 
                         : 'bg-white text-sol-text-secondary border border-sol-border hover:bg-gray-50'
                       }`}
                     >
                       <Icon size={16} />
                       {tab.label}
                     </button>
                   );
                 })}
              </div>
           </div>

           {/* Notes Grid */}
           {loading ? (
             <div className="flex justify-center py-20">
               <div className="w-8 h-8 border-4 border-sol-primary/30 border-t-sol-primary rounded-full animate-spin" />
             </div>
           ) : filteredNotes.length === 0 ? (
             <div className="text-center py-32 bg-white/40 border border-dashed border-gray-300 rounded-3xl">
               <p className="text-sol-text-secondary">No notes found for "{search}" in {activeTab}.</p>
             </div>
           ) : (
             <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {filteredNotes.map((note, i) => (
                  <motion.div 
                    key={note.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="break-inside-avoid bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                     <div className="flex flex-wrap gap-2 mb-4">
                       {note.tags?.map(tag => (
                         <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-sol-primary bg-sol-primary-light px-2 py-0.5 rounded-md">
                           {tag.replace('_', ' ')}
                         </span>
                       ))}
                     </div>
                     <p className="text-sol-text-primary leading-relaxed">{note.note}</p>
                     <p className="text-xs text-gray-400 mt-6 font-medium">
                       {new Date(note.created_at).toLocaleDateString()}
                     </p>
                  </motion.div>
                ))}
             </div>
           )}
        </main>
      </div>
    </AppShell>
  );
}

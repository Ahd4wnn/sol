import { useNavigate } from 'react-router-dom';

const MOOD_EMOJIS = {
  awful: '😔',
  rough: '😕',
  okay: '😐',
  good: '🙂',
  great: '😊'
};

export default function SessionCard({ session }) {
  const navigate = useNavigate();
  
  const formattedDate = new Date(session.created_at).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const getSummaryExcerpt = () => {
    if (session.summary) {
      return session.summary.length > 100 
        ? session.summary.substring(0, 100) + '...' 
        : session.summary;
    }
    return "Session in progress...";
  };

  return (
    <button 
      onClick={() => navigate(`/session/${session.id}`)}
      className="sol-card text-left hover:-translate-y-[2px] transition-all duration-200 hover:border-sol-primary/40 group w-full"
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-medium text-lg text-sol-text-primary group-hover:text-sol-primary transition-colors truncate pr-4">
          {session.title || "Untitled Session"}
        </h4>
        <span className="text-sm text-sol-text-secondary whitespace-nowrap">{formattedDate}</span>
      </div>
      
      <p className="text-sol-text-secondary text-sm mb-4 line-clamp-2 leading-relaxed">
        {getSummaryExcerpt()}
      </p>

      {(session.mood_before || session.mood_after) && (
        <div className="flex items-center gap-2 text-sm bg-sol-bg px-3 py-1.5 rounded-lg inline-flex">
          {session.mood_before && <span>{MOOD_EMOJIS[session.mood_before]}</span>}
          {session.mood_before && session.mood_after && <span className="text-sol-text-secondary text-xs">&rarr;</span>}
          {session.mood_after && <span>{MOOD_EMOJIS[session.mood_after]}</span>}
        </div>
      )}
    </button>
  );
}

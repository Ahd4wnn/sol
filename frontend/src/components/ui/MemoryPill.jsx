export default function MemoryPill({ note }) {
  const truncated = note.length > 60 ? note.substring(0, 60) + "..." : note;
  
  return (
    <div className="group relative">
      <div className="inline-block bg-sol-surface shadow-sm border border-sol-border text-sol-text-secondary text-sm px-4 py-2.5 rounded-full cursor-default hover:border-sol-primary/30 transition-colors">
        {truncated}
      </div>
      {note.length > 60 && (
        <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-sol-text-primary text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg pointer-events-none">
          {note}
        </div>
      )}
    </div>
  );
}

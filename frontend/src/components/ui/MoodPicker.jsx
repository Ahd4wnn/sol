export default function MoodPicker({ value, onChange, size = 'lg' }) {
  const moods = [
    { value: 'awful', emoji: '😔', label: 'Awful' },
    { value: 'rough', emoji: '😕', label: 'Rough' },
    { value: 'okay', emoji: '😐', label: 'Okay' },
    { value: 'good', emoji: '🙂', label: 'Good' },
    { value: 'great', emoji: '😊', label: 'Great' }
  ];

  const sizeClasses = size === 'lg' 
    ? { container: 'flex flex-wrap gap-3 w-full justify-center', box: 'py-4 px-4 sm:py-6 sm:px-5 flex-1 min-w-[70px] max-w-[100px]' }
    : { container: 'flex flex-row justify-center gap-2 w-full', box: 'py-2 px-3 flex-1 max-w-[80px]' };

  return (
    <div className={sizeClasses.container}>
      {moods.map((m) => {
        const isSelected = value === m.value;
        return (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={`
              flex flex-col items-center justify-center rounded-2xl border transition-all duration-200
              ${sizeClasses.box}
              ${isSelected 
                ? 'border-sol-primary bg-sol-primary-light scale-[1.05] shadow-sm' 
                : 'border-sol-border bg-white hover:border-gray-300 hover:-translate-y-[2px]'}
            `}
          >
            <span className={size === 'lg' ? "text-4xl mb-2" : "text-xl"}>{m.emoji}</span>
            <span className={`font-medium ${size === 'lg' ? "text-base text-sol-text-primary" : "text-xs text-sol-text-secondary"} ${isSelected ? '!text-sol-primary flex-none' : ''}`}>
              {m.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

import { motion } from 'framer-motion';

export default function TypingIndicator() {
  const dotVariants = {
    start: { opacity: 0.4, y: 0 },
    end: { opacity: 1, y: -4 },
  };
  
  const containerVariants = {
    start: { transition: { staggerChildren: 0.15 } },
    end: { transition: { staggerChildren: 0.15 } },
  };

  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-white border border-sol-border rounded-[18px] rounded-bl-[4px] inline-flex h-10 shadow-sm">
      <motion.div variants={containerVariants} initial="start" animate="end" className="flex items-center gap-1.5">
        {[0, 1, 2].map((k) => (
          <motion.div
            key={k}
            variants={dotVariants}
            transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full bg-sol-text-secondary/50"
          />
        ))}
      </motion.div>
    </div>
  );
}

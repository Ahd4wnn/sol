import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import TypingIndicator from './TypingIndicator';

// Track which message IDs have already been rendered across the app lifetime
const seenMessageIds = new Set();

export default function MessageBubble({ role, content, isStreaming, timestamp }) {
  const isUser = role === 'user';
  const idRef = useRef(null);
  
  // Determine if this is the first time this message is rendered
  const msgKey = `${role}-${timestamp}-${content?.slice(0, 20)}`;
  const isNew = !seenMessageIds.has(msgKey);
  
  useEffect(() => {
    // Mark as seen after first render (small delay so animation plays)
    if (isNew && !isStreaming) {
      seenMessageIds.add(msgKey);
    }
  }, [msgKey, isNew, isStreaming]);

  // While streaming and no content yet — show typing dots
  if (role === 'assistant' && isStreaming && !content) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex justify-start items-end gap-3 mb-6"
      >
        <div className="flex-none w-8 h-8 rounded-full bg-sol-primary flex items-center justify-center text-white font-display italic text-sm shadow-sm">
          S
        </div>
        <TypingIndicator />
      </motion.div>
    );
  }

  const timeString = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  const isCrisisSupport = !isUser && content?.includes('Sol wants you to know:');

  // Only animate entrance for truly new messages, not on re-renders
  const animationProps = isNew
    ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.18 },
      }
    : {
        initial: false,
        animate: { opacity: 1, y: 0 },
      };

  return (
    <motion.div 
      {...animationProps}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-3 mb-6 group w-full`}
    >
      {!isUser && (
        <div className="flex-none w-8 h-8 rounded-full bg-sol-primary flex items-center justify-center text-white font-display italic text-sm shadow-sm">
          S
        </div>
      )}
      
      <div className="relative max-w-[85%] sm:max-w-[75%] md:max-w-[70%] flex flex-col items-stretch">
        <div className={`
          px-5 py-3.5 shadow-sm
          ${isUser 
            ? 'bg-sol-primary text-white rounded-[18px] rounded-br-[4px]' 
            : isCrisisSupport
              ? 'bg-[#FFF8F3] border-l-[3px] border-[#C96B2E] border-y border-r border-[#eddccf] text-sol-text-primary rounded-[18px] rounded-bl-[4px]'
              : 'bg-white border border-sol-border text-sol-text-primary rounded-[18px] rounded-bl-[4px]'
          }
        `}>
          {isCrisisSupport && (
            <div className="text-lg mb-1">❤️</div>
          )}
          <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{content}</p>
          {isStreaming && role === 'assistant' && (
            <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-sol-primary/60 animate-pulse rounded-full" />
          )}
        </div>
        
        {timeString && (
          <span className={`text-[11px] text-sol-text-secondary opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 ${isUser ? 'right-1' : 'left-1'}`}>
            {timeString}
          </span>
        )}
      </div>
    </motion.div>
  );
}

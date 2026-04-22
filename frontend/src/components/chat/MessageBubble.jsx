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

  const isCrisisMessage = role === 'assistant' &&
    content?.includes('iCall') &&
    content?.includes('9152987821');

  if (isCrisisMessage) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: 12,
      }}>
        <div style={{
          maxWidth: '85%',
          padding: '16px 18px',
          borderRadius: '18px 18px 18px 4px',
          background: 'rgba(255,248,244,0.95)',
          border: '2px solid rgba(201,107,46,0.3)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 2px 16px rgba(201,107,46,0.1)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
            paddingBottom: 10,
            borderBottom: '1px solid rgba(201,107,46,0.15)',
          }}>
            <span style={{ fontSize: 18 }}>☀️</span>
            <span style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              color: '#C96B2E',
            }}>
              Real support is available
            </span>
          </div>

          {/* Render content with phone numbers as tappable links */}
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 14,
            color: '#1A1714',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
          }}>
            {content
              .replace(/\*\*/g, '')  // strip markdown bold
              .split('\n')
              .map((line, i) => {
                // Make phone numbers tappable
                const phoneRegex = /(\d{3,5}-\d{3,5}-\d{3,5}|\d{10,})/g
                if (phoneRegex.test(line)) {
                  const parts = line.split(phoneRegex)
                  return (
                    <div key={i} style={{ marginBottom: 4 }}>
                      {parts.map((part, j) =>
                        /^\d[\d-]+\d$/.test(part) ? (
                          <a
                            key={j}
                            href={`tel:${part.replace(/-/g, '')}`}
                            style={{
                              color: '#C96B2E',
                              fontWeight: 700,
                              textDecoration: 'none',
                              fontSize: 15,
                            }}
                          >{part}</a>
                        ) : (
                          <span key={j}>{part}</span>
                        )
                      )}
                    </div>
                  )
                }
                // Make URLs tappable
                if (line.includes('.org') || line.includes('.com')
                    || line.includes('.in')) {
                  const urlMatch = line.match(
                    /[a-zA-Z0-9-]+\.(org|com|in|net)/
                  )
                  if (urlMatch) {
                    return (
                      <div key={i} style={{ marginBottom: 2 }}>
                        <a
                          href={`https://${urlMatch[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#3D7A5F',
                            textDecoration: 'underline',
                            fontSize: 13,
                          }}
                        >🌐 {urlMatch[0]}</a>
                      </div>
                    )
                  }
                }
                return line ? (
                  <div key={i} style={{ marginBottom: 2 }}>{line}</div>
                ) : (
                  <div key={i} style={{ height: 6 }} />
                )
              })
            }
          </div>
        </div>
      </div>
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

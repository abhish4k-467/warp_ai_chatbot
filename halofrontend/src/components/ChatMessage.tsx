import { motion } from 'framer-motion'
import { TypingAnimation } from './TypingAnimation'

export interface ChatMessageData { 
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
  isTyping?: boolean
}

export function ChatMessage({ m, onTypingComplete, onRequestScroll }: { 
  m: ChatMessageData, 
  onTypingComplete?: (messageId: string) => void,
  onRequestScroll?: () => void 
}) {
  const isUser = m.role === 'user'
  
  if (isUser) {
    // User message with bubble styling
    return (
      <motion.div
        initial={{ y: 8, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative text-sm leading-relaxed w-fit max-w-[78%] md:max-w-[70%] lg:max-w-[60%] px-4 py-3 rounded-2xl backdrop-blur-md whitespace-pre-wrap break-words select-text ml-auto bg-gradient-to-br from-[#1d2330]/70 to-[#11161f]/60 text-slate-100 border border-white/10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)]
          before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:bg-[linear-gradient(140deg,rgba(255,255,255,0.08),rgba(255,255,255,0)_35%,rgba(255,255,255,0)_65%,rgba(255,255,255,0.08))] before:opacity-40
          after:absolute after:top-px after:left-px after:right-px after:bottom-px after:rounded-[1rem] after:pointer-events-none after:border after:border-white/5"
      >
        {m.content}
      </motion.div>
    )
  }

  // AI message without bubble - formatted text with proper styling
  return (
    <motion.div
      initial={{ y: 8, opacity: 0, scale: 0.98 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="text-base leading-relaxed text-slate-200 break-words select-text w-full max-w-[85%] md:max-w-[80%] lg:max-w-[75%] ai-response-content"
    >
      <TypingAnimation 
        text={m.content}
        isTyping={m.isTyping || false}
        onComplete={() => onTypingComplete?.(m.id)}
        onRequestScroll={onRequestScroll}
      />
    </motion.div>
  )
}

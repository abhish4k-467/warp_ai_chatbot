import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, Square, FileText } from 'lucide-react'

interface ChatInputProps { disabled:boolean; onSend:(v:string)=>void; onStop:()=>void; onTyping:(active:boolean)=>void; mode?:'hero'|'dock'; onValueChange?: (v:string)=>void }

export function ChatInput({ disabled, onSend, onStop, onTyping, mode='dock', onValueChange }:ChatInputProps){
  const [v,setV] = useState('')
  const suggestions = [
    'What headlines are shaping global markets today?',
    'Summarize the latest breakthrough in space exploration.',
    'Any major tech announcements I should know about?',
    'What is happening in world politics right now?',
    'Give me a quick update on climate news this week.'
  ]
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const ref = useRef<HTMLTextAreaElement|null>(null)
  const [rows,setRows] = useState(1)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [showFileCard, setShowFileCard] = useState(false)
  const [isEditingLongForm, setIsEditingLongForm] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const MAX_TEXTAREA_HEIGHT = 240
  const MAX_VISIBLE_ROWS = 4
  const baseHeightRef = useRef<number | null>(null)
  useEffect(()=>{ 
    const el = ref.current
    if(!el) return

    if(showFileCard){
      el.style.height = '0px'
      setRows(1)
      setIsOverflowing(false)
      baseHeightRef.current = null
      return
    }

  el.style.height='auto'
    const fullHeight = el.scrollHeight
    const nextHeight = Math.min(fullHeight, MAX_TEXTAREA_HEIGHT)
    const style = window.getComputedStyle(el)
    const paddingTop = parseFloat(style.paddingTop) || 0
    const paddingBottom = parseFloat(style.paddingBottom) || 0
    const verticalPadding = paddingTop + paddingBottom
    const lineHeight = parseFloat(style.lineHeight || '24') || 24
    const singleRowHeight = verticalPadding + lineHeight
    if(baseHeightRef.current === null){
      baseHeightRef.current = singleRowHeight
    }
    const contentHeight = Math.max(0, nextHeight - verticalPadding)
    const computedRows = Math.max(1, Math.ceil(contentHeight / lineHeight))
    const rowsToUse = Math.min(computedRows, MAX_VISIBLE_ROWS)
    const targetHeight = (baseHeightRef.current ?? singleRowHeight) + (rowsToUse - 1) * lineHeight

    el.style.height = targetHeight + 'px'
    setRows(rowsToUse)
    setIsOverflowing(computedRows > MAX_VISIBLE_ROWS || fullHeight > targetHeight + 1)
  },[v, showFileCard])
  function submit(){ 
    if(!v.trim()) return; 
  onSend(v.trim()); 
  setV(''); 
  if(onValueChange) onValueChange('')
    setIsOverflowing(false);
  setShowFileCard(false)
    setIsEditingLongForm(false)
    setWordCount(0)
  }
  const typingTimer = useRef<number|undefined>(undefined)
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>){
    setV(e.target.value)
    if(onValueChange) onValueChange(e.target.value)
    onTyping(true)
    if(typingTimer.current) window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(()=> onTyping(false), 550)
    const words = e.target.value.trim().split(/\s+/).filter(Boolean).length
    setWordCount(words)
    if(words > 150){
      if(!isEditingLongForm) setShowFileCard(true)
    } else {
      setShowFileCard(false)
      setIsEditingLongForm(false)
    }
  }
  const textareaClass = `w-full flex-1 resize-none bg-transparent outline-none text-slate-200 px-1 py-2 leading-relaxed placeholder:text-slate-500 ${isOverflowing? 'overflow-y-auto' : 'overflow-hidden no-scrollbar'}`
  const containerShape = showFileCard || isOverflowing ? 'rounded-[28px]' : 'rounded-full'
  const characters = v.length
  const longTextSnippet = v.trim().slice(0, 140)

  const handleEditLongText = () => {
    setIsEditingLongForm(true)
    setShowFileCard(false)
    requestAnimationFrame(()=>{
      ref.current?.focus()
      const len = ref.current?.value.length ?? 0
      ref.current?.setSelectionRange(len, len)
    })
  }

  const handleClear = () => {
    setV('')
    setWordCount(0)
    setShowFileCard(false)
    setIsEditingLongForm(false)
    setIsOverflowing(false)
    if(ref.current){
      ref.current.style.height = 'auto'
      setRows(1)
    }
  if(onValueChange) onValueChange('')
  }

  const handleBlur = () => {
    onTyping(false)
    setIsEditingLongForm(false)
    if(wordCount > 150){
      setShowFileCard(true)
      setIsOverflowing(false)
    }
  }

  useEffect(() => {
    if(v.trim().length === 0){
      setShowFileCard(false)
      setIsEditingLongForm(false)
      setIsOverflowing(false)
      if(ref.current){
        ref.current.style.height = 'auto'
        setRows(1)
      }
      baseHeightRef.current = null
    }
  }, [v])

  useEffect(()=>{
    const id = window.setInterval(()=>{
      setSuggestionIndex(prev => (prev + 1) % suggestions.length)
    }, 4000)
    return () => window.clearInterval(id)
  }, [suggestions.length])

  const showSuggestionOverlay = !v.trim() && !showFileCard

  const renderLongTextCard = () => (
    <div className='flex flex-1 items-start justify-between gap-3 rounded-2xl bg-white/10 border border-white/12 px-4 py-3 text-sm text-slate-100 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_24px_-12px_rgba(0,0,0,0.85)] backdrop-blur-md'>
      <div className='flex flex-1 items-start gap-3 min-w-0'>
        <div className='flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/25 via-indigo-500/25 to-cyan-500/25 border border-white/15 shadow-[0_0_18px_-8px_rgba(64,143,255,0.9)]'>
          <FileText className='w-5 h-5 text-blue-200' />
        </div>
        <div className='min-w-0 space-y-1'>
          <div className='text-[15px] font-medium text-white truncate'>message.txt</div>
          <div className='text-xs text-slate-400'>{wordCount} words · {characters} chars</div>
          {longTextSnippet && (
            <div className='text-xs text-slate-300/80 line-clamp-2'>{longTextSnippet}{v.trim().length > longTextSnippet.length ? '…' : ''}</div>
          )}
        </div>
      </div>
      <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs whitespace-nowrap'>
        <button onClick={handleEditLongText} className='px-3 py-1 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-slate-100 transition-colors'>Edit text</button>
        <button onClick={handleClear} className='px-3 py-1 rounded-full border border-red-400/40 bg-red-500/10 hover:bg-red-500/20 text-red-200 transition-colors'>Remove</button>
      </div>
    </div>
  )

  // HERO VARIANT (centered landing state)
  if(mode==='hero'){
    return <div className='w-full flex items-center justify-center px-4'>
      <div className='flex-1 max-w-5xl'>
        <div className='group relative'>
          {/* chrome glow ring */}
          <div className='pointer-events-none absolute -inset-[2px] rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.55),rgba(170,180,190,0.15),rgba(255,255,255,0.45))] opacity-20 group-hover:opacity-35 group-focus-within:opacity-45 transition duration-500 blur-[1px]' />
          <div className={`relative bg-black border border-white/15 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_14px_-6px_rgba(0,0,0,0.9)] focus-within:border-white/30 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_6px_18px_-6px_rgba(0,0,0,0.85)] transition-[border,box-shadow] duration-400 flex items-center gap-4 px-4 py-2 ${containerShape} min-h-[56px]` }>
      {showFileCard ? renderLongTextCard() : (
            <div className='relative flex-1'>
              <AnimatePresence mode='wait'>
                {showSuggestionOverlay && (
                  <motion.span
                    key={suggestions[suggestionIndex]}
                    initial={{opacity:0, y:6}}
                    animate={{opacity:0.48, y:0}}
                    exit={{opacity:0, y:-6}}
                    transition={{duration:0.35, ease:'easeOut'}}
                    className='pointer-events-none absolute left-3 right-3 top-[11px] text-[15px] leading-relaxed text-slate-200/60'
                  >
                    {suggestions[suggestionIndex]}
                  </motion.span>
                )}
              </AnimatePresence>
              <textarea
                ref={ref}
                value={v}
                aria-label='Message input'
                disabled={disabled}
                onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); submit() } }}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder=''
                rows={rows}
                className={`${textareaClass} text-[15px] relative z-10 placeholder:text-slate-200/40`}
              />
            </div>
          )}
            <motion.button
              type='button'
              whileHover={{scale: v.trim()?1.05:1}}
              whileTap={{scale:.9}}
              disabled={disabled||!v.trim()}
              onClick={submit}
              className='relative inline-flex items-center justify-center h-11 w-11 rounded-full bg-neutral-900 border border-white/20 hover:bg-neutral-800 disabled:opacity-35 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition-colors shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_4px_10px_-4px_rgba(0,0,0,0.8)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_6px_14px_-5px_rgba(0,0,0,0.85)]'
            >
              <Send className='w-[18px] h-[18px] text-slate-200' />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  }

  // DOCK VARIANT (after first message at bottom)
  return <div className='flex items-end gap-4 px-2 py-3'>
    <div className='relative flex-1 group'>
      <div className='pointer-events-none absolute -inset-[2px] rounded-full bg-[linear-gradient(130deg,rgba(255,255,255,0.55),rgba(170,180,190,0.15),rgba(255,255,255,0.45))] opacity-15 group-hover:opacity-25 group-focus-within:opacity-35 transition duration-500 blur-[1px]' />
      <div className={`relative bg-black border border-white/12 flex items-center gap-4 min-h-[52px] px-4 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_12px_-6px_rgba(0,0,0,0.85)] focus-within:border-white/25 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_6px_16px_-6px_rgba(0,0,0,0.85)] transition-[border,box-shadow] duration-400 ${containerShape}`}>
  {showFileCard ? renderLongTextCard() : (
        <div className='relative flex-1'>
          <AnimatePresence mode='wait'>
            {showSuggestionOverlay && (
              <motion.span
                key={suggestions[suggestionIndex]}
                initial={{opacity:0, y:5}}
                animate={{opacity:0.45, y:0}}
                exit={{opacity:0, y:-5}}
                transition={{duration:0.3, ease:'easeOut'}}
                className='pointer-events-none absolute left-3 right-3 top-[9px] text-sm leading-relaxed text-slate-200/60'
              >
                {suggestions[suggestionIndex]}
              </motion.span>
            )}
          </AnimatePresence>
          <textarea
            ref={ref}
            value={v}
            aria-label='Message input'
            disabled={disabled}
            onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); submit() } }}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder=''
            rows={rows}
            className={`${textareaClass} text-sm relative z-10 placeholder:text-slate-200/40`}
          />
        </div>
      )}
        <motion.button
          whileHover={{scale: v.trim()?1.05:1}}
          whileTap={{scale:.9}}
          disabled={disabled||!v.trim()}
          onClick={submit}
          className='ml-2 relative inline-flex items-center justify-center h-11 w-11 rounded-full bg-neutral-900 border border-white/20 hover:bg-neutral-800 disabled:opacity-35 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition-colors shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_4px_10px_-4px_rgba(0,0,0,0.8)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_6px_14px_-5px_rgba(0,0,0,0.85)]'
        >
          <Send className='w-5 h-5 text-slate-200' />
        </motion.button>
      </div>
    </div>
    <div className='flex items-center gap-2 pr-1'>
  {/* send button moved inside pill in dock mode */}
      <motion.button
        whileHover={{scale: disabled?1:1.05}}
        whileTap={{scale:.92}}
        disabled={!disabled}
        onClick={onStop}
        className='h-11 w-11 rounded-full flex items-center justify-center relative text-white disabled:opacity-30 disabled:cursor-not-allowed border border-white/15 bg-neutral-900 hover:bg-neutral-800 transition-colors shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_10px_-4px_rgba(0,0,0,0.7)]'
      >
        <Square className='w-5 h-5' />
      </motion.button>
    </div>
  </div>
}

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Square } from 'lucide-react'

interface ChatInputProps { disabled:boolean; onSend:(v:string)=>void; onStop:()=>void; onTyping:(active:boolean)=>void; mode?:'hero'|'dock'; onValueChange?: (v:string)=>void }

export function ChatInput({ disabled, onSend, onStop, onTyping, mode='dock', onValueChange }:ChatInputProps){
  const [v,setV] = useState('')
  const ref = useRef<HTMLTextAreaElement|null>(null)
  const [rows,setRows] = useState(1)
  useEffect(()=>{ if(!ref.current) return; const el=ref.current; el.style.height='0px'; el.style.height=el.scrollHeight+'px'; setRows(Math.min(10, Math.floor(el.scrollHeight/24))) },[v])
  function submit(){ if(!v.trim()) return; onSend(v.trim()); setV('') }
  const typingTimer = useRef<number|undefined>(undefined)
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>){
    setV(e.target.value)
    if(onValueChange) onValueChange(e.target.value)
    onTyping(true)
    if(typingTimer.current) window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(()=> onTyping(false), 550)
  }
  // HERO VARIANT (centered landing state)
  if(mode==='hero'){
    return <div className='w-full flex items-center justify-center px-4'>
      <div className='flex-1 max-w-5xl'>
        <div className='group relative'>
          {/* chrome glow ring */}
          <div className='pointer-events-none absolute -inset-[2px] rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.55),rgba(170,180,190,0.15),rgba(255,255,255,0.45))] opacity-20 group-hover:opacity-35 group-focus-within:opacity-45 transition duration-500 blur-[1px]' />
          <div className='relative rounded-full bg-black border border-white/15 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_14px_-6px_rgba(0,0,0,0.9)] focus-within:border-white/30 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_6px_18px_-6px_rgba(0,0,0,0.85)] transition-[border,box-shadow] duration-400 flex items-center h-14 px-4'>
      <textarea
              ref={ref}
              value={v}
              aria-label='Message input'
              disabled={disabled}
              onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); submit() } }}
              onChange={handleChange}
              onBlur={()=>onTyping(false)}
              placeholder='Ask HALO anything...'
              rows={rows}
              className='flex-1 resize-none overflow-hidden no-scrollbar bg-transparent outline-none text-[15px] leading-relaxed placeholder:text-slate-500 text-slate-200 px-1 py-2'
            />
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
      <div className='relative rounded-full bg-black border border-white/12 flex items-center h-13 min-h-[52px] px-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_12px_-6px_rgba(0,0,0,0.85)] focus-within:border-white/25 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_6px_16px_-6px_rgba(0,0,0,0.85)] transition-[border,box-shadow] duration-400'>
  <textarea
          ref={ref}
          value={v}
          aria-label='Message input'
          disabled={disabled}
          onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); submit() } }}
          onChange={handleChange}
          onBlur={()=>onTyping(false)}
          placeholder='Send a message to HALO...'
          rows={rows}
          className='flex-1 resize-none overflow-hidden no-scrollbar bg-transparent outline-none text-sm leading-relaxed placeholder:text-slate-500 text-slate-200 px-1 py-2'
        />
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

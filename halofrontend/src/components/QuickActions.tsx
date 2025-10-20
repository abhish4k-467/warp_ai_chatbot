import { Brain, Globe2, Mic } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Action { label:string; icon: ReactNode; onClick: ()=>void }

const baseBtn = 'group relative inline-flex items-center justify-between h-11 pl-5 pr-4 rounded-full bg-black/90 border border-white/15 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_10px_-4px_rgba(0,0,0,0.7)] hover:border-white/25 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_6px_14px_-5px_rgba(0,0,0,0.75)] text-[13px] tracking-wide text-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 select-none overflow-hidden'

interface QuickActionsProps {
  active: Set<string>
  onToggle: (label:string, cb:()=>void)=>void
}

export function QuickActions({ active, onToggle }: QuickActionsProps){
  const actions:Action[] = [
  { label:'WarpThink', icon:<Brain className='w-[18px] h-[18px] opacity-80' />, onClick:()=>console.log('WarpThink') },
  { label:'Web Search', icon:<Globe2 className='w-[18px] h-[18px] opacity-80' />, onClick:()=>console.log('Web Search') },
  { label:'Voice', icon:<Mic className='w-[18px] h-[18px] opacity-80' />, onClick:()=>console.log('Voice') },
  ]

  return <div className='w-full flex items-center justify-center px-2'>
    <div className='flex flex-wrap gap-3 md:gap-4 justify-center'>
      {actions.map(a=>{
        const isActive = active.has(a.label)
        return <motion.button key={a.label}
          whileHover={{scale:isActive?1.02:1.04}}
          whileTap={{scale:0.94}}
          onClick={()=> onToggle(a.label, a.onClick)}
          aria-pressed={isActive}
          data-active={isActive? 'true': undefined}
          className={baseBtn + (isActive? ' border-white/35 bg-neutral-900/95 shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_6px_14px_-4px_rgba(0,0,0,0.85),0_0_0_4px_rgba(255,255,255,0.05)_inset] before:content-[""] before:absolute before:inset-0 before:rounded-full before:bg-[linear-gradient(160deg,rgba(255,255,255,0.18),rgba(255,255,255,0)_55%)] before:opacity-70':'')}
        >
          <span className='relative z-10 pr-4'>{a.label}</span>
          <span className={'relative z-10 flex items-center justify-center w-8 h-8 rounded-full border transition-colors '+(isActive? 'border-white/25 bg-neutral-800':'border-white/10 bg-neutral-900 group-hover:border-white/20') }>
            {a.icon}
          </span>
          <span className={'pointer-events-none absolute inset-0 rounded-full transition-opacity duration-700 '+(isActive? 'opacity-100':'opacity-0 group-hover:opacity-100')} style={{background:'linear-gradient(120deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.12)_45%,rgba(255,255,255,0)_60%)'}} />
        </motion.button>
      })}
    </div>
  </div>
}

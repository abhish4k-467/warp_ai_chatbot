import { motion, AnimatePresence } from 'framer-motion'
import React from 'react'

interface ThinkingIndicatorProps { active:boolean }

// Cosmic themed thinking animation: halo of orbiting particles + shimmering text
export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ active }) => {
  // stars placed along a ring; each pulses + slight radial jitter
  const stars = Array.from({length:12}).map((_,i)=>({
    id:i,
    angle:(i/12)*Math.PI*2,
    size: (i%3===0?4: (i%2?3:2)),
    delay: i*0.12
  }))
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key='thinking'
            initial={{opacity:0, y:4, scale:0.96}}
            animate={{opacity:1, y:0, scale:1}}
            exit={{opacity:0, y:-4, scale:0.96}}
            transition={{duration:0.35, ease:'easeOut'}}
            whileHover={{scale:1.015}}
            className='group relative inline-flex items-center gap-6 pl-4 pr-8 py-4 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/8 via-white/5 to-white/10 border border-white/18 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.12)] ring-1 ring-white/10 max-w-[520px] transition-colors duration-300'
        >
          {/* Animated gradient border overlay (masked to stroke) */}
          <motion.span
            aria-hidden
            className='pointer-events-none absolute inset-0 rounded-2xl'
            style={{
              background:'conic-gradient(from 0deg, rgba(120,220,255,0.0), rgba(120,220,255,0.35), rgba(180,160,255,0.25), rgba(120,220,255,0.0) 85%)',
              WebkitMask:'linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)',
              WebkitMaskComposite:'xor',
              maskComposite:'exclude',
              padding:'1px'
            }}
            initial={{rotate:0, opacity:0.55}}
            animate={{rotate:360}}
            transition={{repeat:Infinity, ease:'linear', duration:28}}
          />
          {/* Hover intensified glow */}
          <span className='absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(circle_at_20%_30%,rgba(160,220,255,0.18),rgba(0,0,0,0)),radial-gradient(circle_at_80%_70%,rgba(180,160,255,0.15),rgba(0,0,0,0))]' />
      <div className='relative w-16 h-16 flex items-center justify-center'>
            {/* Star field ring (no solid borders) */}
            {stars.map(s=>{
              const r = 22 // radius in px
              const center = 32
              const x = Math.cos(s.angle)*r + center
              const y = Math.sin(s.angle)*r + center
              return (
                <motion.span
                  key={s.id}
      className='absolute rounded-full bg-cyan-100'
                  style={{width:s.size, height:s.size, left:x, top:y, boxShadow:'0 0 6px 1px rgba(160,220,255,0.6)'}}
                  animate={{
                    scale:[0.6,1.2,0.6],
                    opacity:[0.4,1,0.4],
                    x:[0, (Math.random()*2-1)*2,0],
                    y:[0, (Math.random()*2-1)*2,0]
                  }}
      transition={{repeat:Infinity, duration:2.4 + (s.id%5)*0.25, ease:'easeInOut', delay:s.delay}}
                />
              )
            })}
            {/* soft radial glow center */}
    <div className='absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(180,235,255,0.35),rgba(0,0,0,0)_60%)] blur-sm opacity-80 pointer-events-none group-hover:opacity-100 transition-opacity duration-500' />
          </div>
          <motion.span
    className='relative text-base md:text-lg font-semibold tracking-wide'
    animate={{backgroundPosition:['0% 50%','100% 50%','0% 50%'], filter:['brightness(1)','brightness(1.25)','brightness(1)']}}
    transition={{repeat:Infinity, duration:7, ease:'linear'}}
            style={{
              backgroundImage:'linear-gradient(90deg,rgba(147,197,253,0.35),rgba(236,254,255,1),rgba(147,197,253,0.35))',
              WebkitBackgroundClip:'text',
              color:'transparent',
              filter:'drop-shadow(0 0 6px rgba(160,220,255,0.25))'
            }}
          >HALO is thinking…</motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

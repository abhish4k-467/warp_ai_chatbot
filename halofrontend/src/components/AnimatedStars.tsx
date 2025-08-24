import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface StarConf { id:string; startX:number; startY:number; length:number; duration:number; delay:number; opacity:number; driftX:number; driftY:number; angle:number; scale:number; }

export function AnimatedStars({ active, typing }:{ active:boolean; typing:boolean }){
  const count = active ? (typing?12:0) : 0
  const stars = useMemo<StarConf[]>(()=> Array.from({length:count},(_,i)=>{
    const driftX = 360 + Math.random()*300
    const driftY = 220 + Math.random()*260
    const angle = Math.atan2(driftY, driftX) * 180/Math.PI
    return {
      id: 'shoot'+i+'-'+Math.random().toString(36).slice(2,7),
      startX: Math.random()*100, // percent
      startY: Math.random()*100, // percent
      length: 70 + Math.random()*90,
      duration: 1.6 + Math.random()*0.6,
      delay: Math.random()*0.8,
      opacity: 0.08 + Math.random()*0.18,
      driftX,
      driftY,
      angle,
      scale: .6 + Math.random()*.5
    }
  }),[count,typing])
  return <motion.div className='pointer-events-none absolute inset-0 overflow-hidden'
    initial={{opacity:0}}
    animate={{opacity:1}}
    exit={{opacity:0}}
    transition={{duration:.5, ease:'easeInOut'}}
  >
    {stars.map(s=> <motion.span
      key={s.id}
      className='shooting-star'
      style={{ top: s.startY+'%', left: s.startX+'%', width: s.length, rotate: s.angle+'deg', opacity:s.opacity }}
      initial={{ x: 0, y: 0, scale: s.scale, opacity: 0 }}
      animate={{ 
        x: s.driftX, 
        y: s.driftY, 
        opacity: [0, s.opacity, s.opacity*0.8, 0],
        scale: [s.scale, s.scale*1.05, s.scale*0.9]
      }}
      transition={{ duration:s.duration, delay:s.delay, repeat: Infinity, repeatDelay: 0.9+Math.random()*0.6, ease:'easeInOut' }}
    />)}
  </motion.div>
}

import { useMemo } from 'react'
import { motion } from 'framer-motion'

// Rotating starfield idle background (no black hole)
export function CosmosBackground({ offsetX = 0 }: { offsetX?: number }){
  const far = useMemo(()=> Array.from({length:90},(_,i)=>({
    id:'far'+i,
    x: Math.random()*100,
    y: Math.random()*100,
    d: 1.5+Math.random()*3.5,
    delay: Math.random()*8,
    dur: 8+Math.random()*12,
    o: 0.05+Math.random()*0.18
  })),[])
  const near = useMemo(()=> Array.from({length:60},(_,i)=>({
    id:'near'+i,
    x: Math.random()*100,
    y: Math.random()*100,
    d: 2.5+Math.random()*5,
    delay: Math.random()*6,
    dur: 6+Math.random()*10,
    o: 0.08+Math.random()*0.22
  })),[])

  return <div className='absolute inset-0 pointer-events-none overflow-hidden'>
    {/* subtle vignette */}
    <div className='absolute inset-0' style={{background:'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 75%, rgba(0,0,0,0.6) 100%)'}} />

    {/* far layer rotates slowly */}
    <motion.div className='absolute inset-0' style={{transformOrigin:'50% 50%'}} animate={{rotate:360}} transition={{duration:360, ease:'linear', repeat:Infinity}}>
      {far.map(d=> (
        <motion.span key={d.id}
          className='absolute rounded-full'
          style={{ top:d.y+'%', left:d.x+'%', width:d.d, height:d.d, background:'radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0))', filter:'drop-shadow(0 0 4px rgba(160,210,255,0.30))' }}
          animate={{opacity:[0,d.o,d.o*0.5,0]}}
          transition={{duration:d.dur, delay:d.delay, repeat:Infinity, ease:'easeInOut'}}
        />
      ))}
    </motion.div>

    {/* near layer rotates slightly faster in opposite direction */}
    <motion.div className='absolute inset-0' style={{transformOrigin:'50% 50%'}} animate={{rotate:-360}} transition={{duration:240, ease:'linear', repeat:Infinity}}>
      {near.map(d=> (
        <motion.span key={d.id}
          className='absolute rounded-full'
          style={{ top:d.y+'%', left:d.x+'%', width:d.d, height:d.d, background:'radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,255,255,0))', filter:'drop-shadow(0 0 6px rgba(180,230,255,0.45))' }}
          animate={{opacity:[0,d.o,d.o*0.6,0]}}
          transition={{duration:d.dur, delay:d.delay, repeat:Infinity, ease:'easeInOut'}}
        />
      ))}
    </motion.div>

    {/* central chrome ring (very large, no interior fill) */}
    <div className='absolute left-1/2 top-1/2 pointer-events-none' style={{width:'58vmin', height:'58vmin', transform:`translate(-50%, -50%) translateX(${offsetX}px)`}}>
      {/* chrome border */}
      <div className='absolute inset-0 rounded-full' style={{
        boxShadow:'inset 0 0 0 2.5px rgba(255,255,255,0.20), 0 0 34px rgba(210,230,255,0.20), 0 0 110px rgba(210,230,255,0.08)'
      }} />
      {/* rotating chrome sheen masked to ring */}
      <motion.div className='absolute inset-0 rounded-full opacity-45' style={{
        background:'conic-gradient(from 0deg, rgba(255,255,255,0.18), rgba(200,220,255,0.0) 10%, rgba(255,255,255,0.16) 18%, rgba(200,220,255,0.0) 30%, rgba(255,255,255,0.14) 44%, rgba(200,220,255,0.0) 60%, rgba(255,255,255,0.12) 76%, rgba(200,220,255,0.0) 100%)',
        filter:'blur(10px)',
        WebkitMaskImage:'radial-gradient(circle, transparent calc(50% - 3px), black calc(50% - 1px), black calc(50% + 1px), transparent calc(50% + 3px))',
        maskImage:'radial-gradient(circle, transparent calc(50% - 3px), black calc(50% - 1px), black calc(50% + 1px), transparent calc(50% + 3px))'
      }} animate={{rotate:360}} transition={{duration:90, repeat:Infinity, ease:'linear'}}/>
    </div>
  </div>
}

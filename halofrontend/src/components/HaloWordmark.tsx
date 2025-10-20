import { motion } from 'framer-motion'
import { useRef } from 'react'

const TAGLINES = [
  'Conversations from Beyond.',
  'Where AI Meets the Cosmos.',
  'Your Gateway to Infinite Intelligence.',
  'Exploring New Dimensions of Chat.',
  'The Future Speaks Through HALO.',
  'Beyond Human. Beyond Limits.',
  'Intelligence, Orbited Around You.',
  'Chat Across the Stars.'
]

export function HaloWordmark(){
  // pick once per mount / refresh
  const taglineRef = useRef<string>(TAGLINES[Math.floor(Math.random()*TAGLINES.length)])
  const tagline = taglineRef.current
  const short = tagline.length < 26
  const trackingClass = short ? 'tracking-[0.22em]' : 'tracking-[0.28em]'
  const gapClass = short ? 'gap-5' : 'gap-6'
  return <div className={`flex flex-col items-center ${gapClass} select-none`}>
    <motion.h1 initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:.8, ease:'easeOut'}}
      className='halo-chrome text-6xl font-extrabold tracking-[0.25em] px-4 leading-none'>WARP</motion.h1>
    <motion.div initial={{opacity:0, y:10}} animate={{opacity:.78, y:0}} transition={{delay:.55,duration:.75,ease:'easeOut'}} className={`text-[11px] md:text-xs uppercase ${trackingClass} text-slate-400 text-center px-6 flex items-center justify-center`}> 
      {tagline}
    </motion.div>
  </div>
}

import { motion } from 'framer-motion'

export function LogoMark({ className='' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      <svg viewBox='0 0 120 120' className='w-full h-full' fill='none' aria-label='HALO logo'>
        <defs>
          <linearGradient id='halo-chrome-grad' x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor='#f9f9f9'/>
            <stop offset='18%' stopColor='#b9c3cb'/>
            <stop offset='35%' stopColor='#eef2f5'/>
            <stop offset='50%' stopColor='#6d7681'/>
            <stop offset='65%' stopColor='#dfe4e8'/>
            <stop offset='82%' stopColor='#4e555d'/>
            <stop offset='100%' stopColor='#f5f5f5'/>
          </linearGradient>
          <filter id='halo-glow' x='-50%' y='-50%' width='200%' height='200%'>
            <feDropShadow dx='0' dy='0' stdDeviation='6' floodColor='#9ddcff' floodOpacity='.35'/>
            <feDropShadow dx='0' dy='0' stdDeviation='14' floodColor='#ffffff' floodOpacity='.15'/>
          </filter>
        </defs>
        <g filter='url(#halo-glow)'>
          <path d='M54 18c17 0 28 11 28 30 0 18-11 30-28 30S26 66 26 48c0-19 11-30 28-30Z' fill='url(#halo-chrome-grad)' stroke='rgba(255,255,255,0.35)' strokeWidth='1.2' />
          <path d='M18 68c26 26 64 30 84 14' stroke='url(#halo-chrome-grad)' strokeWidth='10' strokeLinecap='round' strokeLinejoin='round'/>
          <path d='M102 54c-8 18-26 34-50 40' stroke='url(#halo-chrome-grad)' strokeWidth='7' strokeLinecap='round' strokeLinejoin='round'/>
        </g>
      </svg>
    </motion.div>
  )
}

import { motion } from 'framer-motion'

export function BlackholeLoader({ size = 64 }: { size?: number }){
  return (
    <div className='blackhole-wrap' style={{ width: size, height: size }}>
      <motion.div className='blackhole-core' animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }} />
      <motion.div className='blackhole-ring' animate={{ scale: [1, 1.22, 1], opacity: [0.9, 0.6, 0.0] }} transition={{ repeat: Infinity, duration: 2.2, ease: [0.4,0,0.2,1] }} />
      <motion.div className='blackhole-flare' animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.9, 0.0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }} />
    </div>
  )
}

export default BlackholeLoader

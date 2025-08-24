import { ComponentProps } from 'react'
import { motion } from 'framer-motion'

type GlassProps = ComponentProps<typeof motion.div>

export function Glass({ className='', children, ...rest }: GlassProps){
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: .995 }}
      className={`glass glass-edge rounded-xl ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

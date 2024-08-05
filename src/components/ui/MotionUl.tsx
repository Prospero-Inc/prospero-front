import { motion } from 'framer-motion'
import React, { FC, PropsWithChildren } from 'react'
export const MotionUl: FC<PropsWithChildren> = ({ children }) => {
  const container = {
    hidden: { opacity: 1, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  }
  return (
    <motion.ul variants={container} initial="hidden" animate="visible">
      {children}
    </motion.ul>
  )
}

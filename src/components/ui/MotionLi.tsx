import { motion } from 'framer-motion'
import React, { FC, PropsWithChildren } from 'react'
export const MotionLi: FC<PropsWithChildren> = ({ children }) => {
  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  }
  return <motion.article variants={item}>{children}</motion.article>
}

import { AuthLayout } from '@/components/layouts'
import { LoginView } from '@/components/views/auth'
import { Grid, GridItem, Image } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import React from 'react'
const login = () => {
  return (
    <AuthLayout title="Login" pageDescription="Login page">
      <Grid templateColumns="repeat(12, 1fr)" gap={4}>
        <GridItem colSpan={[12, 8]}>
          <motion.div
            className="box"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.5,
              ease: [0, 0.71, 0.2, 1.01]
            }}
          >
            <Image src={'/assets/Saly-1.svg'} alt="Sali-1" />
          </motion.div>
        </GridItem>
        <GridItem colSpan={[12, 4]} display={'flex'} w="100%">
          <LoginView />
        </GridItem>
      </Grid>
    </AuthLayout>
  )
}

export default login

import { Box, Image } from '@chakra-ui/react'
import { motion, useAnimation } from 'framer-motion'
import { useEffect } from 'react'

export const QrComponent = () => {
  const controls = useAnimation()

  useEffect(() => {
    controls
      .start({
        scaleY: 1,
        y: '100%',
        transition: { repeat: Infinity, repeatType: 'reverse', duration: 2 }
      })
      .then(resp => {
        console.log({ resp })
      })
      .catch(err => {
        console.log({ err })
      })
  }, [controls])
  return (
    <motion.div>
      <Box
        width="18rem"
        height="18rem"
        borderRadius="md"
        boxShadow="0px 0px 2px rgba(0, 0, 0, 0.2)" // Add a subtle shadow for depth
        position="relative"
        backgroundColor="transparent"
      >
        <Image
          p={4}
          zIndex={-1}
          src="https://www.lightenpic.pro/images/qr-example.avif" // Replace with your QR code image
          objectFit="contain"
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
        />
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            // backgroundColor: 'rgba(83, 82, 237, 0.5)', // Color de la capa de degradado
            opacity: 0.5 // Opacidad de la capa
          }}
        />

        <motion.div
          initial={{ scaleY: 0 }} // Start with a thin line at the top
          animate={{ scaleY: 1, y: '18rem' }} // Grow vertically to cover the whole image
          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%', // Adjust line width as needed
            height: '3%', // Initial height of 0%
            backgroundColor: 'rgba(83, 82, 237, 0.5)'
          }}
        />
      </Box>
    </motion.div>
  )
}

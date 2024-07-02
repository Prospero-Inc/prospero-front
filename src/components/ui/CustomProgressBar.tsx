import { Box, Progress, Text, Icon } from '@chakra-ui/react'
import React from 'react'
import { FaFlag } from 'react-icons/fa'

const CustomProgressBar = () => {
  return (
    <Box
      position="relative"
      background={'gray'}
      width="95%"
      mt={4}
      borderRadius={'md'}
    >
      {/* Primer punto: 20% */}
      <Box
        position="absolute"
        textAlign={'center'}
        left="15%"
        zIndex={1}
        top={-9}
      >
        <Icon as={FaFlag} boxSize={10} />
        <Text mt={3} fontWeight={'bold'}>
          20%
        </Text>
      </Box>
      {/* Segundo punto: 40% */}
      <Box position="absolute" left="35%">
        <Box width="10px" height="10px" borderRadius="full" />
        <Text color={'orange.400'} fontWeight={'bold'} mt={2}>
          40%
        </Text>
      </Box>
      {/* Tercer punto: 60% */}
      <Box position="absolute" left="55%">
        <Box width="10px" height="10px" borderRadius="full" background="gray" />
        <Text color={'red.400'} mt={2} fontWeight={'bold'}>
          60%
        </Text>
      </Box>
      {/* Cuarto punto: 80% */}
      <Box position="absolute" left="75%">
        <Box width="10px" height="10px" borderRadius="full" background="gray" />
        <Text color={'blue.400'} mt={2} fontWeight={'bold'}>
          80%
        </Text>
      </Box>
      {/* Quinto punto: 100% */}
      <Box position="absolute" left="95%">
        <Box
          width="10px"
          height="10px"
          borderRadius="full"
          background="green.400"
        />
        <Text className="green.400" mt={2} fontWeight={'bold'}>
          100%
        </Text>
      </Box>

      {/* Barra de progreso */}
      <Progress
        value={95}
        size="md"
        colorScheme="grey.400"
        borderRadius={'md'}
      />
    </Box>
  )
}

export default CustomProgressBar

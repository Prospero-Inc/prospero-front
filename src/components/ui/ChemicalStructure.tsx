import { Box } from '@chakra-ui/react'
import { FC } from 'react'

export const ChemicalStructure: FC<{ text?: string }> = ({ text = 'Or' }) => {
  return (
    <Box display="flex" alignItems="center">
      <Box as="span" mr={2} fontSize="2xl">
        ——
      </Box>
      <Box as="span" fontSize="2xl" fontWeight="bold">
        {text}
      </Box>
      <Box as="span" ml={2} fontSize="2xl">
        ——
      </Box>
    </Box>
  )
}

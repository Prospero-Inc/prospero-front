import { WalletCardProps } from '@/interfaces'
import {
  Box,
  Flex,
  Text,
  Image,
  IconButton,
  Heading,
  useBreakpointValue,
  As
} from '@chakra-ui/react'

import { TotalMoneyIcon } from '../icons/TotalMoneyIcon'

export const WalletCard = ({
  totalAmount,
  comparisonAmount
}: WalletCardProps) => {
  const variantTotalAmount = useBreakpointValue(
    {
      base: 'md',
      md: 'lg'
    },
    {
      fallback: 'md'
    }
  )
  const variantHeadingAmount = useBreakpointValue(
    {
      base: 20,
      md: 35
    },
    {
      fallback: 'md'
    }
  )
  const variantComparissio = useBreakpointValue(
    {
      base: 10,
      md: 12
    },
    {
      fallback: 'md'
    }
  )
  const variantWallet = useBreakpointValue(
    {
      base: '21.25em',
      md: '18.75em',
      sm: '18.75em'
    },
    {
      fallback: 'md'
    }
  )
  const variantCard = useBreakpointValue(
    {
      base: 270,
      md: 440
    },
    {
      fallback: 'md'
    }
  )
  const variantCardH = useBreakpointValue(
    {
      base: 100,
      md: 140
    },
    {
      fallback: 'md'
    }
  )
  const variantSpaceText = useBreakpointValue(
    {
      base: 0,
      md: 1
    },
    {
      fallback: 'md'
    }
  )
  const variantLeftWallet = useBreakpointValue(
    {
      base: 42,
      md: 55.5
    },
    {
      fallback: 'md'
    }
  )
  const variantTopWallet = useBreakpointValue(
    {
      base: 10,
      md: 4
    },
    {
      fallback: 'md'
    }
  )
  return (
    <Flex
      bg="walletCard"
      p={4}
      borderRadius="md"
      alignItems="center"
      gap={3}
      w={variantCard}
      h={variantCardH}
    >
      <Box>
        <IconButton
          aria-label="Money Icon"
          bg={'white'}
          icon={<TotalMoneyIcon />}
        />
      </Box>
      <Box>
        <Text fontSize={variantTotalAmount} color="white" mb={variantSpaceText}>
          Total
        </Text>
        <Heading
          fontSize={variantHeadingAmount}
          color="white"
          fontWeight="bold"
          mb={variantSpaceText}
        >
          ${totalAmount.toFixed(2)}
        </Heading>
        <Text fontSize={variantComparissio} color="white" mb={variantSpaceText}>
          En comparación con con el mes pasado{' '}
          <strong> ${comparisonAmount.toFixed(2)}</strong>
        </Text>
      </Box>
      <Box>
        <Image
          src={'/assets/purse.svg'} // Reemplaza con tu imagen de cartera
          alt="Cartera"
          boxSize={variantWallet}
          zIndex={1}
          position="relative"
          left={variantLeftWallet}
          top={variantTopWallet}
        />
      </Box>
    </Flex>
  )
}

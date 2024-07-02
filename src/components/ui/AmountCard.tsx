import { WalletCardProps } from '@/interfaces'
import {
  Box,
  Flex,
  Text,
  Image,
  IconButton,
  Heading,
  useBreakpointValue
} from '@chakra-ui/react'

export const AmountCard = ({
  totalAmount,
  comparisonAmount,
  image,
  icon: Icon,
  title,
  bgColor,
  breakpointsImage,
  breakpointsLeftImage,
  breakpointsTopImage
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
  const variantImage = useBreakpointValue(
    {
      base: breakpointsImage.base,
      md: breakpointsImage.md
    },
    {
      fallback: 'md'
    }
  )

  const variantLeftImage = useBreakpointValue(
    {
      base: breakpointsLeftImage.base,
      md: breakpointsLeftImage.md,
      lg: breakpointsLeftImage.lg
    },
    {
      fallback: 'md'
    }
  )
  const variantTopImage = useBreakpointValue(
    {
      base: breakpointsTopImage.base,
      md: breakpointsTopImage.md,
      lg: breakpointsTopImage.lg
    },
    {
      fallback: 'md'
    }
  )
  return (
    <Flex
      bg={bgColor}
      p={4}
      borderRadius="md"
      alignItems="center"
      gap={3}
      w={variantCard}
      h={variantCardH}
      position="relative" // Asegúrate de que el contenedor sea relativo
    >
      <Box>
        <IconButton
          flexDir={'row'}
          justifyContent={'center'}
          alignItems={'center'}
          aria-label="Money Icon"
          bg={'white'}
          icon={<Icon />}
        />
      </Box>
      <Box px={1}>
        <Text fontSize={variantTotalAmount} color="white" mb={variantSpaceText}>
          {title}
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
      <Box
        position="absolute"
        left={variantLeftImage}
        top={variantTopImage}
        boxSize={variantImage}
        zIndex={1}
      >
        <Image src={image} alt="Cartera" />
      </Box>
    </Flex>
  )
}

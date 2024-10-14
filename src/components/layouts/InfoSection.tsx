import { Badge, Box, Heading, Text } from '@chakra-ui/react'
import React from 'react'

interface InfoSectionProps {
  label: string
  value: string | undefined
  useBadge?: boolean
  badgeColor?: string
}

export const InfoSection: React.FC<InfoSectionProps> = ({
  label,
  value,
  useBadge = false,
  badgeColor = 'primary'
}) => {
  return (
    <Box padding={4}>
      <Heading as="h3" size={'sm'} color="GrayText">
        {label}
      </Heading>
      {useBadge ? (
        <Badge ml="1" fontSize="0.8em" colorScheme={badgeColor}>
          {value || 'N/A'}
        </Badge>
      ) : (
        <Text>{value || 'N/A'}</Text>
      )}
    </Box>
  )
}

import { Box, Button, Flex, Grid, Heading } from '@chakra-ui/react'
import React from 'react'

interface InfoLayoutProps {
  title: string
  onEdit?: () => void
  children: React.ReactNode
  showEdit?: boolean
  buttonLabel?: string
}

export const InfoLayout: React.FC<InfoLayoutProps> = ({
  title,
  onEdit,
  children,
  showEdit = true,
  buttonLabel = 'Edit'
}) => {
  return (
    <Flex
      direction={{ base: 'column', md: 'row' }}
      justifyContent={'space-between'}
      alignItems="flex-start"
    >
      {/* Contenido dinámico */}
      <Box>
        <Heading as="h2" size={'md'} mb={6}>
          {title}
        </Heading>
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
          {children}
        </Grid>
      </Box>

      {/* Botón de acción */}
      {showEdit && onEdit && (
        <Button onClick={onEdit} alignSelf="flex-start">
          {buttonLabel}
        </Button>
      )}
    </Flex>
  )
}

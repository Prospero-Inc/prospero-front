import { Container, Flex, Heading, useBreakpointValue } from '@chakra-ui/react'
import { ReactNode } from 'react'

interface SectionProps {
  title: string
  children: ReactNode
  showHeader?: boolean
  /**
   * Contenido secundario (badge, caption, etc.) que se muestra a la derecha
   * del título, en la misma fila del header. Útil para metadatos breves
   * relacionados a la sección (ej. rango de fechas del período) sin que
   * queden flotando sueltos en el layout.
   */
  caption?: ReactNode
  my?: number | string
}

export const GenericSection = ({
  title,
  children,
  showHeader = true,
  caption,
  my = 10
}: SectionProps) => {
  const padding = useBreakpointValue({ base: '4', sm: '6', md: '8', lg: '10' })
  const headingSize = useBreakpointValue({
    base: 'lg',
    sm: 'xl',
    md: '2xl',
    lg: '3xl'
  })

  return (
    <Container p={padding} maxW="container.2xl" my={my}>
      {showHeader && (
        <Flex
          justify="space-between"
          align={{ base: 'flex-start', sm: 'center' }}
          direction={{ base: 'column', sm: 'row' }}
          gap={1}
          mb={4}
        >
          <Heading as="h2" size={headingSize}>
            {title}
          </Heading>
          {caption}
        </Flex>
      )}
      {children}
    </Container>
  )
}

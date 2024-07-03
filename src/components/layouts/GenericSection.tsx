import { Container, Heading, useBreakpointValue } from '@chakra-ui/react'
import { ReactNode } from 'react'

interface SectionProps {
  title: string
  children: ReactNode
  showHeader?: boolean
}

export const GenericSection = ({
  title,
  children,
  showHeader
}: SectionProps) => {
  const padding = useBreakpointValue({ base: '4', sm: '6', md: '8', lg: '10' })
  const headingSize = useBreakpointValue({
    base: 'lg',
    sm: 'xl',
    md: '2xl',
    lg: '3xl'
  })

  return (
    <Container p={padding} maxW="container.2xl" my={10}>
      {showHeader && (
        <Heading as="h2" size={headingSize} mb={4}>
          {title}
        </Heading>
      )}
      {children}
    </Container>
  )
}

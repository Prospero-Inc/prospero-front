import { Flex, Icon, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'

interface EmptyStateProps {
  icon?: IconType
  title: string
  description?: string
  /** Optional call to action (e.g. a button). */
  action?: ReactNode
}

/** What a list shows when there's nothing in it yet. */
export const EmptyState = ({
  icon,
  title,
  description,
  action
}: EmptyStateProps) => (
  <Flex
    direction="column"
    align="center"
    textAlign="center"
    gap={2}
    py={10}
    px={4}
  >
    {icon && <Icon as={icon} boxSize={10} color="text.secondary" mb={2} />}
    <Text fontWeight="semibold" color="text.primary">
      {title}
    </Text>
    {description && (
      <Text color="text.secondary" maxW="xs">
        {description}
      </Text>
    )}
    {action && <Flex mt={3}>{action}</Flex>}
  </Flex>
)

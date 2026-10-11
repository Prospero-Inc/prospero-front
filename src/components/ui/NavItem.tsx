import { Badge, FlexProps, Link, Flex, Icon, Text } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { ReactText } from 'react'
import { IconType } from 'react-icons'

interface NavItemProps extends FlexProps {
  icon: IconType | string
  children: ReactText
  path: string
  /** Conteo de pendientes de revisión a mostrar como badge al final del
   * label. No se renderiza nada si es `undefined`/`0`. */
  badgeCount?: number
  /** Texto accesible del badge (ej. "2 ingresos pendientes de revisión") —
   * obligatorio junto a `badgeCount` para no depender solo del color/forma. */
  badgeAriaLabel?: string
}
export const NavItem = ({
  icon,
  children,
  path,
  badgeCount,
  badgeAriaLabel,
  ...rest
}: NavItemProps) => {
  const router = useRouter()
  const isActive = router.pathname === path
  const hasBadge = typeof badgeCount === 'number' && badgeCount > 0

  return (
    <Link
      onClick={() => router.push(path)}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
      textColor={isActive ? 'primary.500' : 'primaryGray'}
      fontWeight={isActive ? 'bold' : 'normal'}
    >
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        transition="all 0.3s ease"
        _hover={{
          boxShadow: 'customHover',
          transform: 'translateY(-2px)', // Efecto de relieve,
          color: 'primary.500'
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="18"
            _groupHover={{
              color: 'primary.500'
            }}
            as={icon as IconType}
          />
        )}
        <Text as="span" flex="1">
          {children}
        </Text>
        {hasBadge && (
          <Badge
            ml="2"
            colorScheme="orange"
            borderRadius="full"
            px={2}
            role="status"
            aria-label={badgeAriaLabel}
          >
            {badgeCount}
          </Badge>
        )}
      </Flex>
    </Link>
  )
}

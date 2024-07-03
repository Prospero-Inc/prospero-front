import { FlexProps, Link, Flex, Icon } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { ReactText } from 'react'
import { IconType } from 'react-icons'

interface NavItemProps extends FlexProps {
  icon: IconType | string
  children: ReactText
  path: string
}
export const NavItem = ({ icon, children, path, ...rest }: NavItemProps) => {
  const router = useRouter()
  return (
    <Link
      onClick={() => router.push(path)}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
      textColor={'primaryGray'}
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
        {children}
      </Flex>
    </Link>
  )
}

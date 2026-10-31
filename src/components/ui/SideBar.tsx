import { Box, Drawer, DrawerContent, useDisclosure } from '@chakra-ui/react'
import React, { ReactNode } from 'react'

import { MobileNav } from './MobileNav'
import { SidebarContent } from './SidebarContent'

export default function SidebarWithHeader({
  children
}: {
  children: ReactNode
}) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Box minH="100vh">
      <SidebarContent
        onClose={onClose}
        display={{ base: 'none', md: 'block' }}
      />
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      {/* mobilenav */}
      <MobileNav onOpen={onOpen} />
      {/* On phones the page container (ProsperoLayout) owns the single 16 px
          gutter; padding here too used to stack three layers of it. */}
      <Box ml={{ base: 0, md: 60 }} p={{ base: 0, md: 4 }}>
        {children}
      </Box>
    </Box>
  )
}

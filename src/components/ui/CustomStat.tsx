import { Stat } from '@chakra-ui/react'
import React, { FC, PropsWithChildren } from 'react'

interface Props {
  borderColor?: string
  children: React.ReactNode
}
export const CustomStat: FC<PropsWithChildren<Props>> = ({
  children,
  borderColor = 'gray.200'
}) => {
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py={'5'}
      my={'1rem'}
      border={'0.063rem solid'}
      borderColor={borderColor}
      rounded={'lg'}
      minH={'4.25rem'}
    >
      {children}
    </Stat>
  )
}

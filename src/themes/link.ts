import { defineStyle, defineStyleConfig } from '@chakra-ui/react'

const brandPrimary = defineStyle({
  color: 'primary'
})

export const linkTheme = defineStyleConfig({
  variants: { brandPrimary }
})

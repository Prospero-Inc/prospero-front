import { inputAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(inputAnatomy.keys)

const baseStyle = definePartsStyle({
  // define the part you're going to style
  field: {
    fontFamily: 'Montserrat', // change the font family
    _hover: {
      bg: 'gray.100',
      _dark: {
        bg: 'whiteAlpha.100'
      }
    },
    _focus: {
      borderColor: 'primary.500'
    }
  }
})

export const inputTheme = defineMultiStyleConfig({ baseStyle })

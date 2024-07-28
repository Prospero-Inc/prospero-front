import { inputAnatomy } from '@chakra-ui/anatomy'
import {
  createMultiStyleConfigHelpers,
  defineStyle,
  defineStyleConfig
} from '@chakra-ui/react'

// Define the custom size style
const xl = defineStyle({
  fontSize: 'xl',
  px: '6',
  h: '16',
  borderRadius: 'md'
})

// Create the button theme configuration with the new size
export const buttonTheme = defineStyleConfig({
  sizes: { xl }
})

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(inputAnatomy.keys)

const inputXl = defineStyle({
  fontSize: 'lg',
  px: '6',
  h: '16'
})

const sizes = {
  xl: definePartsStyle({ field: inputXl, addon: inputXl })
}

export const inputTheme = defineMultiStyleConfig({ sizes })

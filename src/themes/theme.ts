import { extendTheme } from '@chakra-ui/react'

import '@fontsource/montserrat'
import { colors } from './colors'
import { fonts } from './fonts'
import { shadows } from './shadows'
import { buttonTheme, inputTheme } from './sizes'

export const theme = extendTheme({
  colors,
  shadows,
  fonts,
  components: {
    Toast: {
      baseStyle: {
        bg: 'primary.500'
      }
    },
    Button: buttonTheme,
    Input: {
      ...inputTheme,
      sizes: {
        ...inputTheme.sizes
      }
    }
  },
  styles: {
    global: {
      a: {
        color: 'primary.500'
      }
    }
  }
})

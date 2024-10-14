import { extendTheme } from '@chakra-ui/react'

import '@fontsource/montserrat'
import { colors } from './colors'
import { fonts } from './fonts'
import { linkTheme } from './link'
import { shadows } from './shadows'
import { buttonTheme, inputTheme } from './sizes'

export const theme = extendTheme({
  colors,
  shadows,
  fonts,
  config: {
    initialColorMode: 'system',
    useSystemColorMode: true
  },
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
    },
    Link: linkTheme
  },
  styles: {
    global: {
      a: {
        color: 'primary.500'
      }
    }
  }
})

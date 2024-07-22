import { extendTheme } from '@chakra-ui/react'

import '@fontsource/montserrat'
import { colors } from './colors'
import { fonts } from './fonts'
import { shadows } from './shadows'

export const theme = extendTheme({
  colors,
  shadows,
  fonts,
  components: {
    Toast: {
      baseStyle: {
        bg: 'primary.500'
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

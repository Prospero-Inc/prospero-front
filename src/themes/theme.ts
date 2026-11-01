import { extendTheme } from '@chakra-ui/react'

import { colors } from './colors'
import { fonts } from './fonts'
import { linkTheme } from './link'
import { semanticTokens } from './semanticTokens'
import { shadows } from './shadows'
import { buttonTheme, inputTheme, numberInputTheme, selectTheme } from './sizes'

export const theme = extendTheme({
  colors,
  semanticTokens,
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
    Input: inputTheme,
    Select: selectTheme,
    NumberInput: numberInputTheme,
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

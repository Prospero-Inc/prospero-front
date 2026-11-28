import { extendTheme } from '@chakra-ui/react'

import { colors } from './colors'
import { layerStyles, textStyles } from './designStyles'
import { fonts } from './fonts'
import { linkTheme } from './link'
import { semanticTokens } from './semanticTokens'
import { shadows } from './shadows'
import { buttonTheme, inputTheme, numberInputTheme, selectTheme } from './sizes'
import { skeletonTheme } from './skeleton'

export const theme = extendTheme({
  colors,
  semanticTokens,
  layerStyles,
  textStyles,
  shadows,
  fonts,
  config: {
    initialColorMode: 'system',
    // "Automático" is applied by AppearanceSync, not by live system changes.
    useSystemColorMode: false
  },
  components: {
    Toast: {
      baseStyle: {
        bg: 'primary.500'
      }
    },
    Skeleton: skeletonTheme,
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

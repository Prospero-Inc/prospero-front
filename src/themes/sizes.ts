import {
  inputAnatomy,
  numberInputAnatomy,
  selectAnatomy
} from '@chakra-ui/anatomy'
import {
  createMultiStyleConfigHelpers,
  defineStyle,
  defineStyleConfig
} from '@chakra-ui/react'

import { designButtonSizes, designButtonVariants } from './designStyles'

// Phones (below `md`): every button at least 44 px tall — the minimum
// comfortable touch target — and every field at 16 px text, below which iOS
// zooms the page on focus. From `md` up, Chakra's usual sizes apply.
// (Chakra size 11 = 44 px.)
const touchButton = (desktopHeight: number) =>
  defineStyle({
    h: { base: '44px', md: desktopHeight },
    minW: { base: '44px', md: desktopHeight }
  })

// Define the custom size style
const xl = defineStyle({
  fontSize: 'xl',
  px: '6',
  h: '16',
  borderRadius: 'md'
})

// Create the button theme configuration with the new size
export const buttonTheme = defineStyleConfig({
  sizes: {
    xs: touchButton(6),
    sm: touchButton(8),
    md: touchButton(10),
    xl,
    ...designButtonSizes
  },
  variants: designButtonVariants
})

const touchField = (desktopFontSize: string, desktopHeight: number) =>
  defineStyle({
    fontSize: { base: 'md', md: desktopFontSize },
    h: { base: '44px', md: desktopHeight }
  })

const inputHelpers = createMultiStyleConfigHelpers(inputAnatomy.keys)

const inputXl = defineStyle({
  fontSize: 'lg',
  px: '6',
  h: '16'
})

// docs/diseno-mobile.html .lfield .box: 54 px, radius 14, 1.5 px border
// that turns into a 2 px brand one on focus.
const designField = inputHelpers.definePartsStyle({
  field: {
    h: '54px',
    borderRadius: '14px',
    border: '1.5px solid',
    borderColor: 'field.border',
    bg: 'bg.surface',
    fontSize: '16px',
    px: '14px',
    color: 'text.primary',
    _placeholder: { color: 'icon.subtle' },
    _focusVisible: {
      borderColor: 'brand.solid',
      borderWidth: '2px',
      px: '13.5px'
    },
    _invalid: { borderColor: 'money.expenseText' }
  }
})

export const inputTheme = inputHelpers.defineMultiStyleConfig({
  variants: { design: designField },
  sizes: {
    xs: inputHelpers.definePartsStyle({ field: touchField('xs', 6) }),
    sm: inputHelpers.definePartsStyle({ field: touchField('sm', 8) }),
    xl: inputHelpers.definePartsStyle({ field: inputXl, addon: inputXl })
  }
})

const selectHelpers = createMultiStyleConfigHelpers(selectAnatomy.keys)

export const selectTheme = selectHelpers.defineMultiStyleConfig({
  sizes: {
    xs: selectHelpers.definePartsStyle({ field: touchField('xs', 6) }),
    sm: selectHelpers.definePartsStyle({ field: touchField('sm', 8) })
  }
})

const numberInputHelpers = createMultiStyleConfigHelpers(
  numberInputAnatomy.keys
)

export const numberInputTheme = numberInputHelpers.defineMultiStyleConfig({
  sizes: {
    xs: numberInputHelpers.definePartsStyle({ field: touchField('xs', 6) }),
    sm: numberInputHelpers.definePartsStyle({ field: touchField('sm', 8) })
  }
})

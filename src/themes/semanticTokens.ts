// One color per meaning (docs/diseno-mobile.html, "Sistema de diseño"):
// income, expense, each budget category and "pending" always look the same,
// in light and dark mode. New UI uses these instead of raw palette values
// or ad-hoc useColorModeValue pairs. Text tones are darkened (light mode) /
// lightened (dark mode) so they pass WCAG AA (4.5:1) on their background.
export const semanticTokens = {
  colors: {
    'bg.canvas': { default: '#F5F5FA', _dark: 'gray.900' },
    'bg.surface': { default: 'white', _dark: 'gray.800' },
    'bg.subtle': { default: 'gray.50', _dark: 'whiteAlpha.100' },
    'border.subtle': { default: 'gray.200', _dark: 'whiteAlpha.200' },

    'text.primary': { default: '#1B1B2F', _dark: 'whiteAlpha.900' },
    // 6.1:1 on white; the old gray.500 (#718096) was 4.0:1.
    'text.secondary': { default: '#5F6175', _dark: 'gray.400' },

    'brand.solid': { default: '#5352ED', _dark: '#7F7FF7' },
    'brand.text': { default: '#4A4ADB', _dark: '#A4A4FA' },

    // Fills (bars, dots, icons) and their AA text variants.
    'money.income': { default: '#12B886', _dark: '#38D9A9' },
    'money.incomeText': { default: '#0A7D59', _dark: '#63E6BE' },
    'money.expense': { default: '#E03A3D', _dark: '#FF6B6E' },
    'money.expenseText': { default: '#C92A2D', _dark: '#FFA8AA' },
    'status.pending': { default: '#C2410C', _dark: '#FDBA74' },
    'status.pendingBg': { default: '#FFF4EC', _dark: 'rgba(194,65,12,0.18)' },

    'category.Necesidad': { default: '#5352ED', _dark: '#7F7FF7' },
    'category.Deseo': { default: '#F59F00', _dark: '#FFC94D' },
    'category.Ahorro': { default: '#12B886', _dark: '#38D9A9' }
  }
}

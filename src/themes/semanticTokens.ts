// One color per meaning (docs/diseno-mobile.html, "Sistema de diseño"):
// income, expense, each budget category and "pending" always look the same,
// in light and dark mode. New UI uses these instead of raw palette values
// or ad-hoc useColorModeValue pairs. Text tones are darkened (light mode) /
// lightened (dark mode) so they pass WCAG AA (4.5:1) on their background.
export const semanticTokens = {
  colors: {
    // Values below are the design's own (docs/diseno-mobile.html :root and
    // .screen.dark), so screens match the mockups in both themes.
    'bg.canvas': { default: '#F5F5FA', _dark: '#121220' },
    'bg.surface': { default: '#FFFFFF', _dark: '#1D1D2E' },
    'bg.subtle': { default: '#F5F5FA', _dark: '#24243A' },
    'border.subtle': { default: '#E6E6EF', _dark: '#2C2C40' },

    'text.primary': { default: '#1B1B2F', _dark: '#F2F2F8' },
    // 6.1:1 on white; the old gray.500 (#718096) was 4.0:1.
    'text.secondary': { default: '#5F6175', _dark: '#A3A5BA' },

    'brand.solid': { default: '#5352ED', _dark: '#5352ED' },
    'brand.text': { default: '#5352ED', _dark: '#A9A8FF' },
    // Text on brand.subtle buttons (design --primary-700).
    'brand.strong': { default: '#3F3FC8', _dark: '#C8C8FC' },
    'brand.subtle': { default: '#EBEBFE', _dark: '#2A2A55' },
    'hero.bg': { default: '#5352ED', _dark: '#3E3DC4' },
    'track.bg': { default: '#EEEEF5', _dark: '#2C2C40' },
    'tab.inactive': { default: '#6E7085', _dark: '#9C9EB4' },
    'tab.active': { default: '#5352ED', _dark: '#A9A8FF' },
    'tabbar.bg': {
      default: 'rgba(255,255,255,0.96)',
      _dark: 'rgba(24,24,38,0.96)'
    },
    'alert.iconBg': { default: '#FFFFFF', _dark: '#241A14' },
    // Segmented control, chips, input-like rows (design .seg/.chip/.field).
    'seg.bg': { default: '#E9E9F2', _dark: '#24243A' },
    'seg.on': { default: '#FFFFFF', _dark: '#33334D' },
    'field.bg': { default: '#F4F4F9', _dark: '#24243A' },
    'button.soft': { default: '#F0F0F6', _dark: '#2C2C40' },
    // Tinted backgrounds behind category icons (design .cat).
    'tint.Necesidad': { default: '#EBEBFE', _dark: '#2A2A55' },
    'tint.Deseo': { default: '#FFF4DE', _dark: '#3A2E14' },
    'tint.Ahorro': { default: '#E6F8F1', _dark: '#14302A' },
    'tint.income': { default: '#E6F8F1', _dark: '#14302A' },
    'tint.expense': { default: '#FDECEC', _dark: '#3A1A1E' },
    // Chevrons and the off state of toggles (decorative, not text).
    // Gmail review: bank badges alternate between these two palettes.
    'bank.aBg': { default: '#FFF4D6', _dark: '#3A2E10' },
    'bank.aText': { default: '#A86B00', _dark: '#F5C451' },
    'bank.bBg': { default: '#E3F4EA', _dark: '#14302A' },
    'bank.bText': { default: '#1C7C45', _dark: '#63E6BE' },
    'toast.bg': { default: '#1B1B2F', _dark: '#2C2C40' },
    // Onboarding/login (docs/diseno-mobile.html .choice, .lfield).
    'choice.onBg': { default: '#F7F7FF', _dark: '#23234A' },
    'choice.border': { default: '#E6E6EF', _dark: '#2C2C40' },
    'radio.off': { default: '#C9C9D8', _dark: '#4A4A63' },
    'steps.off': { default: '#E1E1EC', _dark: '#2C2C40' },
    'field.border': { default: '#DADAE6', _dark: '#3A3A52' },
    'field.label': { default: '#3B3D52', _dark: '#C9CADB' },
    'icon.subtle': { default: '#A0A2B5', _dark: '#6E7085' },
    'toggle.off': { default: '#D3D4E0', _dark: '#3A3A52' },

    // Fills (bars, dots, icons) and their AA text variants.
    'money.income': { default: '#12B886', _dark: '#38D9A9' },
    'money.incomeText': { default: '#0A7D59', _dark: '#63E6BE' },
    'money.expense': { default: '#E03A3D', _dark: '#FF6B6E' },
    'money.expenseText': { default: '#C92A2D', _dark: '#FFA8AA' },
    'status.pending': { default: '#C2410C', _dark: '#FDBA74' },
    'status.pendingBg': { default: '#FFF1E6', _dark: '#3A2418' },
    // Filled pending (buttons, badges): same orange in both themes, white
    // text on it is 5.2:1.
    'status.pendingSolid': { default: '#C2410C', _dark: '#C2410C' },

    // Same in both themes, as in the design.
    'category.Necesidad': { default: '#5352ED', _dark: '#5352ED' },
    'category.Deseo': { default: '#F59F00', _dark: '#F59F00' },
    'category.Ahorro': { default: '#12B886', _dark: '#12B886' }
  }
}

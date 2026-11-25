import { defineStyleConfig } from '@chakra-ui/react'

const placeholder = 'colors.skeleton.bg'

// Chakra's default skeleton fades `background` between two grays at 70 %
// opacity; with the app's near-white surfaces that was imperceptible, and it
// repaints every frame. Here: one color that reads on both surfaces (the
// semantic token already switches per color mode; `_dark` is repeated only
// because extendTheme merges with Chakra's own dark grays). The pulse is
// the `.chakra-skeleton` rule in globals.css: <Skeleton> sets its own
// `animation` as a style prop, which a theme cannot outrank.
// `startColor` still works per instance (the hero's translucent bones).
export const skeletonTheme = defineStyleConfig({
  baseStyle: {
    '--skeleton-start-color': placeholder,
    '--skeleton-end-color': placeholder,
    _dark: {
      '--skeleton-start-color': placeholder,
      '--skeleton-end-color': placeholder
    },
    background: 'var(--skeleton-start-color)',
    borderColor: 'var(--skeleton-end-color)',
    opacity: 1,
    borderRadius: 'md'
  }
})

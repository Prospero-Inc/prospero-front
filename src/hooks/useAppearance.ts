import { useColorMode } from '@chakra-ui/react'
import { useEffect, useState } from 'react'

export const APPEARANCES = ['system', 'light', 'dark'] as const
export type Appearance = (typeof APPEARANCES)[number]

const STORAGE_KEY = 'prospero-appearance'

/** What the user picked in "Apariencia"; 'system' when nothing (or
 * something unknown) was saved. */
export const readAppearance = (): Appearance => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return APPEARANCES.find(value => value === saved) ?? 'system'
  } catch {
    // Storage blocked (private mode): follow the phone.
    return 'system'
  }
}

/**
 * The appearance preference. Chakra only stores the resolved light/dark,
 * so "Automático" is kept here and `AppearanceSync` re-applies it.
 */
export const useAppearance = () => {
  const { setColorMode } = useColorMode()
  const [appearance, setAppearanceState] = useState<Appearance>('system')
  useEffect(() => setAppearanceState(readAppearance()), [])

  const setAppearance = (value: Appearance) => {
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // Storage blocked: the choice lasts until the app is closed.
    }
    setAppearanceState(value)
    setColorMode(value)
  }

  return { appearance, setAppearance }
}

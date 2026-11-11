import { Box, Flex, Text } from '@chakra-ui/react'
import Image from 'next/image'

/**
 * Screenshots of the three setup steps, shown under each step of
 * /settings/shortcut. None exist yet: to add one, put a portrait iPhone
 * screenshot (1179 × 2556, PNG) at `public/assets/shortcut/paso-N.png` and
 * set its `isAvailable` to true. (`public/assets` isn't precached by the
 * service worker, which is fine for these.)
 */
export const SHORTCUT_SCREENSHOTS = [
  { step: 1, path: '/assets/shortcut/paso-1.png', isAvailable: false },
  { step: 2, path: '/assets/shortcut/paso-2.png', isAvailable: false },
  { step: 3, path: '/assets/shortcut/paso-3.png', isAvailable: false }
] as const

/** iPhone portrait screen (1179 × 2556). */
const ASPECT_RATIO = 1179 / 2556

interface ShortcutScreenshotProps {
  /** Image to show; without it, a dashed placeholder of the same size. */
  src?: string
  alt: string
  /** Placeholder text while there's no image. */
  placeholder: string
}

export const ShortcutScreenshot = ({
  src,
  alt,
  placeholder
}: ShortcutScreenshotProps) => (
  <Box
    position="relative"
    w="full"
    maxW="180px"
    mx="auto"
    mt="14px"
    sx={{ aspectRatio: String(ASPECT_RATIO) }}
    borderRadius="22px"
    overflow="hidden"
    {...(src
      ? { bg: 'button.soft' }
      : {
          borderWidth: '1.5px',
          borderStyle: 'dashed',
          borderColor: 'icon.subtle'
        })}
  >
    {src ? (
      <Image src={src} alt={alt} fill sizes="180px" />
    ) : (
      <Flex h="full" align="center" justify="center" p="16px">
        <Text textStyle="help" textAlign="center">
          {placeholder}
        </Text>
      </Flex>
    )}
  </Box>
)
